# Mozilla Readability Port Notes

This repo now ports the Mozilla Readability test suite in the places where the
behavior maps to Defuddle rather than to Mozilla-specific APIs or parser
internals.

Ported suites:

- `readability-compat.test.ts`
  - Imports the upstream `test-pages` corpus from `/tmp/readability/test/test-pages`
  - Compares Defuddle output against a Defuddle-canonicalized form of Mozilla's
    `expected.html`
  - Keeps the bar on content fidelity while tolerating intentional Defuddle
    normalization like wrapper flattening, heading normalization, and markdown
    formatting differences
- `readability-readerable-compat.test.ts`
  - Adapts upstream `readerable` expectations
  - Uses a Defuddle-appropriate invariant: pages Mozilla marks readerable should
    yield substantive extracted content in Defuddle
- `readability-parser-compat.test.ts`
  - Ports parser-adjacent cases that still affect Defuddle behavior
  - Covers script text handling, entity decoding, base URI handling, namespace
    normalization, and malformed HTML recovery

Not ported intentionally:

- `test-isProbablyReaderable.js`
  - Mozilla-specific `isProbablyReaderable()` API and visibility callback contract
  - Defuddle does not expose an equivalent public preflight API
- `test-jsdomparser.js` DOM mutation mechanics
  - `insertBefore`, `replaceChild`, `DocumentFragment`, sibling-pointer
    bookkeeping, and custom parser tree semantics
  - These test Mozilla's standalone parser implementation, not Defuddle's
    extraction behavior
- `test-readability.js` constructor internals
  - Direct assertions on internal fields such as `_nbTopCandidates`,
    `_keepClasses`, `_allowedVideoRegex`, serializer hooks, and oversized-document
    abort behavior
  - These do not correspond to Defuddle's public contract
- `debug-testcase.js` and `generate-testcase.js`
  - Upstream maintenance utilities, not test behavior to preserve in Defuddle

Output artifacts used during porting:

- `/tmp/readability`
  - upstream Mozilla Readability checkout used as the source of truth
- `/tmp/defuddle-readability-results.json`
  - JSON report from the page-compat suite
- `/tmp/defuddle-readability-all-results.json`
  - JSON report from the full imported compatibility run
