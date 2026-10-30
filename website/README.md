# defuddle.md

[defuddle.md](https://defuddle.md) is a Cloudflare Worker that wraps Defuddle as an HTTP API. Pass any URL as the path and it returns the cleaned content:

```bash
curl https://defuddle.md/https://example.com/article
```

## Running locally

Install the website dependencies and start the development server:

```bash
cd website
npm install
npm run dev
```

The Worker imports source from `../src/` directly, so wrangler compiles on the fly. Test it with `curl` (not a browser):

```bash
curl http://localhost:8788/https://example.com/article
```

If source changes don't seem to take effect, clear the wrangler cache:

```bash
rm -rf .wrangler
```
