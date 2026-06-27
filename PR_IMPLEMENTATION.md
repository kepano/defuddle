## PR Implementation: Optional Keyword Tags System

### Summary
This change introduces an optional keyword/tag system for Defuddle output.

Tags are generated from extracted metadata and content using a lightweight score-based approach with regex-driven normalization.

The feature is optional at CLI level:
- No tag output unless `--tags` or `-t` is provided.
- `--tags` (without a number) defaults to 10 tags.
- `--tags <count>` limits output to the given positive integer.

### Scope
Implemented across:
- Tag generation logic: [src/keyword-tags.ts](src/keyword-tags.ts)
- Parse response shape: [src/types.ts](src/types.ts)
- Defuddle parse flow integration: [src/defuddle.ts](src/defuddle.ts)
- Frontmatter output (YAML properties): [src/frontmatter.ts](src/frontmatter.ts)
- CLI flag and output gating: [src/cli.ts](src/cli.ts)
- Tests: [tests/keyword-tags.test.ts](tests/keyword-tags.test.ts), [tests/cli.test.ts](tests/cli.test.ts)
- Documentation: [README.md](README.md)

### How Tag Generation Works

#### 1) Candidate extraction
Tags are built from several text sources in `DefuddleResponse`:
- title
- description
- site
- author
- extracted HTML content (converted to plain text)
- selected SEO/meta keywords (`metaTags`)

#### 2) Regex-based normalization pipeline
Main regexes used:
- HTML stripping:
  - `<[^>]*>`
  - `&nbsp;`, `&amp;`, `&lt;`, `&gt;`, `&quot;`, `&#\d+;`, `&\w+;`
- Tokenization:
  - `[\p{L}\p{N}][\p{L}\p{N}'’_-]{1,40}` (unicode letters/numbers + basic word punctuation)
- Edge cleanup for tokens:
  - `^[^\p{L}\p{N}]+|[^\p{L}\p{N}]+$`
- Numeric-only rejection:
  - `^\d+$`
- Slug normalization:
  - Apostrophe removal: `['’]`
  - Non-alnum collapse to hyphen: `[^\p{L}\p{N}]+`
  - Trim outer hyphens: `^-+|-+$`
- Composite split (for title/site phrase boosts):
  - `[-|/:]`
- Meta keyword splitting:
  - `[;,|]`

#### 3) Scoring model (points)
Base weighted token scoring:
- title: +10
- description: +4
- site: +5
- author: +3
- body tokens: +1 (capped to first 3000 tokens)

Additional phrase boosts (composite parts from title/site):
- title composites: +12
- site composites: +8

Explicit meta-keyword boost:
- each normalized keyword entry: +40

Supported meta keyword keys:
- keywords
- news_keywords
- article:tag
- article:section
- parsely-tags
- topic
- topics

#### 4) Filtering and ranking
Candidates are filtered by:
- min length >= 3
- score > 0
- stopword exclusion (English + French common words)

Output is sorted by descending score and truncated to a max of 10 at generator level.

### CLI Behavior
In [src/cli.ts](src/cli.ts):

`-t, --tags [count]`
- Absent: tags removed from final output.
- Present without value (`--tags` or `-t`): limit = 10.
- Present with value (`--tags 5` / `--tags=5` / `-t 5`): limit = parsed positive integer.
- Invalid value (non-integer, zero, negative): explicit CLI error.

### Output Behavior
- Frontmatter (`--frontmatter`): includes `tags:` list only when tags option is enabled.
- JSON (`--json`): includes `tags` field only when tags option is enabled.
- `--property`: unchanged behavior, but `tags` can be requested when present.

### Examples
- Default optional tags (10):
  - `npx defuddle parse page.html --frontmatter --tags`
- Custom count:
  - `npx defuddle parse page.html --frontmatter --tags 5`
  - `npx defuddle parse page.html --json --tags=12`

### Validation
Covered by tests in:
- [tests/keyword-tags.test.ts](tests/keyword-tags.test.ts)
- [tests/cli.test.ts](tests/cli.test.ts)

Build and CLI tests pass after integration.

### Notes / Tradeoffs
- This is intentionally lightweight (fast, deterministic, no external dependency).
- Score constants are easy to tune in one place.
- The generator already caps at 10; CLI can further reduce but not exceed this cap unless generator cap is changed.
