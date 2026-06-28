## Summary
Improve automatic language detection for fenced code blocks in markdown output.

The main goal is to emit better fence labels (for example ` ```javascript `, ` ```typescript `, ` ```bash `) instead of empty or incorrect labels when Defuddle extracts code from documentation pages.

## Main implementation
### New file added first
- `src/elements/detect-code-lang.ts`

This file centralizes language guessing logic.

## Detection strategy
Language detection now uses ordered heuristics:

1. Strong signature rules first (high confidence)
	- `php`, `html`, `xml`
	- shebang-based detection (`bash`, `python`, `javascript`)
	- `dockerfile`, `cpp`, `java`, `go`, `rust`, `ruby`, `python`, `sql`, `latex`

2. Context/shape-based rules
	- `typescript` and `tsx` patterns
	- `css` and `yaml`
	- markdown content heuristics (`isMarkdown`)
	- `json`

3. Final fallback
	- common CLI patterns => `bash`
	- JS fallback detection via declarations/import/export patterns

Rule order is intentional to reduce false positives (for example HTML before CSS, markdown before generic fallbacks, JSON after YAML checks).

## Other files updated in the original flow
- `src/elements/code.ts`
  - Uses the new detector in the code normalization/serialization pipeline.
- `src/extractors/github.ts`
  - Keeps GitHub extraction aligned with improved language labels.

## Why this improves output
- More code fences include a reliable language tag.
- Syntax highlighting quality is better in markdown consumers (including Obsidian).
- Less manual cleanup after scraping technical docs.

## Backward compatibility
- If no rule matches confidently, behavior still falls back safely.
- The change is additive: existing extraction flow remains intact.

## Manual validation
Tested against a mix of docs and code-heavy pages, including:
- https://github.com/kepano/defuddle
- https://kieran.casa/aws-sdk-waiters-ts/
- https://expressjs.com/en/guide/routing/

Also verified on pages containing shell snippets, TypeScript/JavaScript examples, and markdown documentation blocks.

## Notes
Branch: `work/better-detect-code-lang`.
