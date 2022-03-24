## NHttp Etag

Etager for nhttp.

## Usage

```ts
import { NHttp } from "https://deno.land/x/nhttp@1.1.11/mod.ts";
import { etag } from "https://deno.land/x/nhttp_etag@0.0.1/mod.ts";

const app = new NHttp();

// add to middleware
app.use(etag(/* options */));

app.get("/", (_) => "hello with etag");

app.listen(8080);
```
