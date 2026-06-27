# Agents

## Fork of defuddle

This repo is a fork of [kepano/defuddle](https://github.com/kepano/defuddle). The goal is to add features while keeping changes minimal so patches can be submitted upstream.

**Rules:**
- Prefer adding new files over modifying existing ones. But if you need to touch existing code (hook into the pipeline, add a parameter, export something), just do it — keep the change minimal and focused.
- Follow the project's existing structure: small focused modules, each in its own file.
- Keep new features self-contained in a new file (or directory) rather than spreading changes across the codebase.
- Existing tests must keep passing without modification.
- This file (`AGENTS.md`), the `.agents/` directory, and any dot-directories are local — never commit changes that reorganize or refactor the original source layout.

## Reference workspace — `npx-crawly-template`

A sibling workspace at `../npx-crawly-template/` serves as **read-only reference** for
extraction patterns, CLI design, and some usefull tools i would like to have that i did implement in the other project. **Never edit or modify the
reference workspace.** When asked to implement a feature that exists there, read its
relevant files for inspiration, then port the approach to this project's conventions.
Do not rewrite or copypaste large blocks — adapt the ideas to defuddle's architecture.
Always write in English. The goal is to make a PR upstream.

## Commands

- Build: `bun run build` (clean → tsc declarations → tsc node → webpack)
- Test all: `bun test` (Vitest, TZ=UTC)
- Test with jsdom: `bun run test:jsdom` (sets `DOM=jsdom`)
- Single test: `npx vitest run tests/<file>`
- Dev mode (CLI on a real URL): `bun run start:dev <url> [-m] [-f]` — runs `dist/cli.js` after build, useful for quick smoke tests against live pages
- Security lint: `bun run lint:innerhtml` — bans direct innerHTML/outerHTML assignment outside `src/utils/dom.ts`
- Bundle size check: `bun run size`
- No typecheck-only script exists — `tsc` runs only via `bun run build`
- No formatter — ESLint checks tabs, nothing else

## Three bundles

| Import path | Target | Builder |
|---|---|---|
| `defuddle` | Browser (UMD) | webpack → `dist/index.js` |
| `defuddle/full` | Browser + math/markdown | webpack → `dist/index.full.js` |
| `defuddle/node` | Node.js (any DOM impl) | `tsc` → `dist/node.js` |

Tests use the full math module (alias in `vitest.config.ts` → `math.full.ts`). Webpack swaps math modules via alias (`math.core.ts` vs `math.full.ts`) depending on bundle.

## API

- **Browser**: `new Defuddle(document, options).parse()` — synchronous
- **Node.js**: `Defuddle(document, url?, options?)` — async function, calls `parseAsync()`
- **CLI**: `npx defuddle parse <url|file|stdin> [--markdown] [--json] [--debug] [--frontmatter] [--user-agent]`

## Pipeline

1. Flatten shadow DOM & resolve React streaming SSR
2. Find main content (auto-detection or `contentSelector`)
3. `standardizeFootnotes` → `standardizeCallouts` — **run before removals** because CSS sidenotes use `display:none` and `.alert` selectors would strip callouts
4. `removeSmallImages` → `removeHiddenElements` → `removeLowScoring` → `removeBySelector` → `removeByContentPattern`
5. `standardizeContent` → resolve relative URLs

Set `standardize: false` to disable both footnote and content standardization.

## Debug

```js
new Defuddle(doc, { debug: true }).parse()
// → result.debug.contentSelector (CSS path of chosen element)
// → result.debug.removals (array of {step, selector, reason, text})
```

Debug mode preserves class/id/data-* attributes and skips div flattening. Use `contentSelector` option to bypass auto-detection.

## Security rules (enforced by CI)

1. Never assign `innerHTML`/`outerHTML` directly — use `parseHTML()` from `src/utils/dom.ts` (parses via `<template>`, no script execution)
2. Sanitize URLs: strip `javascript:` and `data:text/html` from href/src; strip `srcdoc` from iframes; remove `on*` event handlers
3. **Escape all interpolated page values** in extractor template literals (`escapeHtml()` from `src/utils/dom.ts`) — unescaped `"` lets attacker-controlled values inject attributes (XSS)
4. Add a poisoned-attribute test to `tests/extractor-xss.test.ts` for new extractors

## Test fixtures

- Source: `tests/fixtures/<name>.html`
- Expected: `tests/expected/<name>.md` (JSON metadata preamble + markdown content)
- Anonymize all fixtures (replace names, emails, URLs with placeholders)
- **Verify fixture fails before applying fix** — a fixture that passes on old and new code proves nothing

## Inspiration: `npx-crawly-template`

The `../npx-crawly-template` directory is included in this VS Code workspace for inspiration only. **Never modify this directory.** Its code must be adapted to defuddle conventions (structure, pipelines, security) without adding new libraries unless truly necessary.

## Common pitfalls

- **UMD + `export: 'default'`**: Named exports must be static properties on the default class (see `src/index.full.ts:34`)
- **Live HTMLCollections**: `getElementsByTagName` returns live collections — always `Array.from()` before mutating the DOM
- **Elements inside `<pre>`/`<code>`** are protected from selector removal
- **linkedom quirks**: linkedom lacks `styleSheets` and `getComputedStyle` — `parseLinkedomHTML()` polyfills these (used by CLI and Worker)
- **Node floor is 20**: Vite 7 requires ^20.19 or >=22.12

@CLAUDE.md
