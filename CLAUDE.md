# Defuddle

Extracts main content from web pages as clean HTML.

## Project structure

- `src/defuddle.ts` — Core parsing pipeline
- `src/standardize.ts` — HTML normalization (headings, code blocks, footnotes)
- `src/scoring.ts` — Content scoring to remove non-content blocks
- `src/constants.ts` — Exact/partial selectors for clutter removal
- `src/elements/` — Element-specific rules (code, footnotes, math)
- `src/extractors/` — Site-specific extractors
- `src/utils/dom.ts` — DOM utilities (`parseHTML`, `serializeHTML`)
- `src/index.ts` / `src/index.full.ts` — Bundle entry points (UMD, `export: 'default'`)
- `website/src/convert.ts` — Cloudflare Worker API (defuddle.md)

## Environments

- **Browser** (`defuddle`, `defuddle/full`) — Native DOM. Used by extensions and web apps.
- **Node.js** (`defuddle/node`) — Accepts any DOM `Document` (linkedom, JSDOM, happy-dom, etc.). Async API.
- **CLI** (`src/cli.ts`) — linkedom. Supports `--markdown` and `--json` flags.
- **Cloudflare Worker** (`website/src/convert.ts`) — linkedom, most constrained DOM.

## Build and test

- `npm run build` — Build all bundles
- `npm test` — Run Vitest

### Testing across environments

Always use `curl` when testing the Worker or defuddle.md — do not open URLs in a browser.

1. **Worker** — run with `cd website && npx wrangler dev`, then:
   ```bash
   curl http://localhost:8787/https://stephango.com/saw
   ```
2. **defuddle.md** — same pattern against production:
   ```bash
   curl https://defuddle.md/https://stephango.com/saw
   ```
3. **CLI**: `npx defuddle parse https://stephango.com/saw --markdown`
4. **Vitest fixtures**: HTML files in `tests/fixtures/` with expected output in `tests/expected/`

## Debugging content extraction

### Pipeline order

1. Flatten shadow DOM (`flattenShadowRoots`)
2. Resolve React streaming SSR (`resolveStreamedContent`)
3. Find main content (auto-detection or `contentSelector`)
4. `standardizeFootnotes` — runs before removals because CSS sidenotes use `display:none`
5. `standardizeCallouts` — converts GitHub alerts, Bootstrap alerts, callout asides to `blockquote[data-callout]` before selector removal strips `.alert` etc.
6. `removeSmallImages`
7. `removeHiddenElements`
8. `removeLowScoring`
9. `removeBySelector` — exact and partial selectors from `src/constants.ts`
10. `removeByContentPattern` — content-based removal (read time, boilerplate, article cards)
11. `standardizeContent` — HTML normalization
12. Resolve relative URLs

### Pipeline toggles

```typescript
new Defuddle(document, {
  removeSmallImages: false,
  removeHiddenElements: false,
  removeLowScoring: false,
  removeExactSelectors: false,
  removePartialSelectors: false,
  removeContentPatterns: false,
  standardize: false,  // disables standardizeFootnotes and standardizeContent
  includeReplies: false, // excludes replies from extractors like Reddit, HN, GitHub, Twitter/X
}).parse();
```

### Debug mode

```typescript
const result = new Defuddle(document, { debug: true }).parse();
result.debug.contentSelector; // CSS path of chosen content element
result.debug.removals;        // array of {step, selector, reason, text}
```

Debug mode preserves class/id/data-* attributes and skips div flattening. Use `contentSelector` to bypass auto-detection when it picks the wrong element.

### Debugging strategy

1. Check `result.debug.removals` for unexpected entries
2. Disable steps one at a time to find which one removes the content
3. For selector issues, check `EXACT_SELECTORS` and `PARTIAL_SELECTORS` in `src/constants.ts`
4. Elements inside `<pre>` or `<code>` are protected from selector removal
5. After fixing, create a minimal fixture in `tests/fixtures/` with expected output in `tests/expected/` to prevent regressions. Anonymize fixtures — replace real names, emails, URLs, and identifying content with generic placeholders. **Verify the fixture fails before applying the fix** — run `npm test` with the fix reverted (or with the expected output reflecting the buggy behavior) to confirm the fixture actually exercises the bug. A fixture that passes on both old and new code proves nothing.

### Rules

- **Never use `innerHTML` directly.** Always use `parseHTML()` from `src/utils/dom.ts` which parses via `<template>` elements (no script execution, no resource loading).
- **Sanitize URLs** — `javascript:`, `blob:`, and non-image `data:` URLs must be stripped from `href`/`src` attributes; `data:image/*` is allowed except as an iframe `src`. `srcdoc` must be stripped from iframes. `on*` event handler attributes must be removed. See `isDangerousUrl()` in `src/utils/dom.ts` and `_stripUnsafeElements()` in `src/defuddle.ts`, which runs on the main extraction output regardless of which pipeline steps are enabled.
- **Never interpolate page-derived values into HTML strings unescaped.** Extractors that build HTML from template literals (e.g. `` `<img src="${src}" alt="${alt}">` ``) must wrap every interpolated value in `escapeHtml()` from `src/utils/dom.ts`, or build the node via `createElement`/`setAttribute` + `serializeHTML()`. An unescaped `"` lets attacker-controlled values (image `alt`/`src`, `og:image`, descriptions) inject new attributes (XSS, e.g. GHSA-jg4p-g6xj-4qmf). Downstream sanitization is a backstop, not a substitute — escape at the point of interpolation. Cover new extractors with a poisoned-attribute case in `tests/extractor-xss.test.ts`.

### Common pitfalls
- **UMD exports**: `export: 'default'` in webpack means named exports must be static properties on the default class (see `src/index.full.ts`).
- **Live HTMLCollections**: `getElementsByTagName` returns live collections. Convert to static arrays with `Array.from()` before mutating the DOM.
