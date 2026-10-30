# Defuddle

Extracts main content from web pages as clean HTML.

## Security

- Never use `innerHTML` directly. Use `parseHTML()` from `src/utils/dom.ts` (template-based parsing without script execution or resource loading).
- Escape every page-derived value interpolated into HTML with `escapeHtml()`, or build nodes with `createElement`/`setAttribute` and `serializeHTML()`. Downstream sanitization does not replace escaping at the point of interpolation.
- Strip `javascript:`, `blob:`, and non-image `data:` URLs from `href`/`src`. Allow `data:image/*` except as an iframe `src`. Strip iframe `srcdoc` and all `on*` event handlers.
- Preserve sanitization regardless of pipeline options. See `isDangerousUrl()` in `src/utils/dom.ts` and `_stripUnsafeElements()` in `src/defuddle.ts`.
- Cover new extractors with a poisoned-attribute case in `tests/extractor-xss.test.ts`.

## Build and test

- `npm run build` — build all bundles.
- `npm test` — run Vitest.
- For extraction fixes, add a minimal HTML fixture in `tests/fixtures/` with correct expected output in `tests/expected/`. Verify the same fixture fails before the fix and passes afterward; do not change expectations to match buggy behavior.
- Anonymize fixtures: replace real names, emails, URLs, and identifying content with generic placeholders.
- Always use `curl` to test the Worker or defuddle.md; never open those URLs in a browser.
- Local Worker: run `cd website && npx wrangler dev`, then `curl http://localhost:8787/https://stephango.com/saw`.
- Production: `curl https://defuddle.md/https://stephango.com/saw`.

## Runtime compatibility

Changes must work across these environments:

- Browser (`defuddle`, `defuddle/full`): native DOM.
- Node.js (`defuddle/node`): async API accepting any DOM `Document`, including linkedom, JSDOM, and happy-dom.
- CLI (`src/cli.ts`) and Cloudflare Worker (`website/src/convert.ts`): linkedom; the Worker is the most constrained environment.

## Debugging extraction

- Start with `{ debug: true }` and inspect `result.debug.removals` and `result.debug.contentSelector`. Debug mode preserves class/id/data attributes and skips div flattening.
- Disable removal steps individually to isolate content loss. Use `contentSelector` to bypass incorrect main-content detection.
- For selector issues, inspect `EXACT_SELECTORS` and `PARTIAL_SELECTORS` in `src/constants.ts`. Elements inside `<pre>` or `<code>` are protected from selector removal.
- Standardize footnotes and callouts before removals: CSS sidenotes may use `display:none`, and callout classes such as `.alert` otherwise match clutter selectors.

## Common pitfalls

- UMD bundles use webpack `export: 'default'`; expose named exports as static properties on the default class (see `src/index.full.ts`).
- `getElementsByTagName` returns live HTMLCollections. Use `Array.from()` before mutating the DOM.
