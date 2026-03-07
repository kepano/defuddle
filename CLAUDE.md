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
- **Node.js** (`defuddle/node`) — JSDOM. Async API.
- **CLI** (`src/cli.ts`) — JSDOM. Supports `--markdown` and `--json` flags.
- **Cloudflare Worker** (`website/src/convert.ts`) — linkedom polyfill, most constrained DOM.

## Build and test

- `npm run build` — Build all bundles
- `npm test` — Run Vitest

### Testing across environments

1. **Worker**: `http://localhost:8787/https://stephango.com/saw` — run with `cd website && npx wrangler dev`
2. **CLI**: `npx defuddle parse https://stephango.com/saw --markdown`
3. **Vitest fixtures**: HTML files in `tests/fixtures/` with expected output in `tests/expected/`

## Debugging content extraction

### Pipeline order

1. Flatten shadow DOM (`flattenShadowRoots`)
2. Find main content (auto-detection or `contentSelector`)
3. `standardizeFootnotes` — runs before removals because CSS sidenotes use `display:none`
4. `removeSmallImages`
5. `removeHiddenElements`
6. `removeLowScoring`
7. `removeBySelector` — exact and partial selectors from `src/constants.ts`
8. `standardizeContent` — HTML normalization
9. Resolve relative URLs

### Pipeline toggles

```typescript
new Defuddle(document, {
  removeSmallImages: false,
  removeHiddenElements: false,
  removeLowScoring: false,
  removeExactSelectors: false,
  removePartialSelectors: false,
  standardize: false,  // disables standardizeFootnotes and standardizeContent
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
5. After fixing, create a minimal fixture in `tests/fixtures/` with expected output in `tests/expected/` to prevent regressions. Anonymize fixtures — replace real names, emails, URLs, and identifying content with generic placeholders.

### Rules

- **Never use `innerHTML` directly.** Always use `parseHTML()` from `src/utils/dom.ts` which parses via `<template>` elements (no script execution, no resource loading).
- **Sanitize URLs** — `javascript:` and `data:text/html` must be stripped from `href`/`src` attributes. `srcdoc` must be stripped from iframes. `on*` event handler attributes must be removed. See `sanitizeContent()` in `src/defuddle.ts`.

### Common pitfalls
- **UMD exports**: `export: 'default'` in webpack means named exports must be static properties on the default class (see `src/index.full.ts`).
- **Live HTMLCollections**: `getElementsByTagName` returns live collections. Convert to static arrays with `Array.from()` before mutating the DOM.
