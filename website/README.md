# defuddle.md

[defuddle.md](https://defuddle.md) is a Cloudflare Worker that wraps Defuddle as an HTTP API. Pass any URL as the path and it returns the cleaned content:

```bash
curl https://defuddle.md/https://example.com/article
```

## Running locally

Install [Wrangler](https://developers.cloudflare.com/workers/wrangler/), Cloudflare's CLI for Workers:

```bash
npm install -g wrangler
```

Then start the dev server from this directory:

```bash
cd website
npx wrangler dev
```

The Worker imports source from `../src/` directly, so wrangler compiles on the fly. Test it with `curl` (not a browser):

```bash
curl http://localhost:8787/https://example.com/article
```

If source changes don't seem to take effect, clear the wrangler cache:

```bash
rm -rf .wrangler
```
