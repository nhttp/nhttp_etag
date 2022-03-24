import { Handler, RequestEvent } from "https://deno.land/x/nhttp@1.1.11/mod.ts";
import * as base64 from "https://deno.land/std@0.131.0/encoding/base64.ts";

const encoder = new TextEncoder();
const def = '"0-2jmj7l5rSw0yVb/vlWAYkK/YBwk"';

export async function entityTag(entity: string | Uint8Array | undefined) {
  if (!entity) return def;
  if (typeof entity === "string") entity = encoder.encode(entity);
  if (entity.length === 0) return def;
  const digest = await crypto.subtle.digest("SHA-1", entity);
  const hash = base64.encode(digest).substring(0, 27);
  return `"${entity.length.toString(16)}-${hash}"`;
}


export const etag = <T extends RequestEvent = RequestEvent>(
  opts: { weak?: boolean } = {},
): Handler<T> =>
  async (rev, next) => {
    const weak = opts.weak !== false;
    const { response, request, respondWith } = rev;
    const sendEtag = async function (body: any) {
      try {
        let isJson = false;
        if (typeof body === "object") {
          if (body instanceof Response) return respondWith(body);
          if (
            body instanceof ReadableStream ||
            body instanceof FormData ||
            body instanceof Blob ||
            typeof (body as unknown as Deno.Reader).read === "function"
          ) {
            return respondWith(new Response(body, rev.responseInit));
          } else {
            body = JSON.stringify(body);
            isJson = true;
          }
        }
        if (!response.header("ETag")) {
          const etag = await entityTag(body);
          response.header("ETag", weak ? `W/${etag}` : etag);
        }
        if (request.headers.get("if-none-match") === response.header("ETag")) {
          response.status(304);
          return respondWith(new Response(null, rev.responseInit));
        }
        if (isJson) {
          response.header("content-type", "application/json; charset=utf-8");
        }
        return respondWith(new Response(body, rev.responseInit));
      } catch (_e) {
        return respondWith(new Response(body, rev.responseInit));
      }
    };
    rev.response.send = sendEtag as any;
    return next();
  };
