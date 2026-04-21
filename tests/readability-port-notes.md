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

Fixture-level port annotations:

- `readability-port-annotations.ts`
  - Centralizes the small set of fixture-specific adaptations instead of
    scattering comments through the test body
  - Unlisted fixtures are treated as baseline ports unless they are called out in
    the milestone notes below as requiring a Defuddle fix
  - Annotation buckets are:
    - `semantic-text`
      - Readability and Defuddle preserve the same extracted text, but Defuddle's
        markdown normalization differs
    - `structural-superset`
      - Defuddle preserves extra headings, hero media, or labels while keeping
        the article text that Readability expected
    - `structural-subset`
      - Defuddle intentionally drops leading site chrome that Readability kept in
        the expected fixture
    - `metadata-variant`
      - The content is accepted, but a fixture also needs a title/byline variant
        because Defuddle's metadata choice is judged equivalent or better

Milestone notes:

- Baseline imports
  - Any fixture that passes without an entry in `readability-port-annotations.ts`
    worked as-is once the canonical harness was in place.
- Phase 1: expectation adaptations
  - Fixtures listed in `readability-port-annotations.ts`
  - These remain compatibility tests, but their assertion mode or accepted
    metadata variant is adjusted to match Defuddle's normalization choices.
- Phase 2: Defuddle metadata/parser fixes
  - Fixed in code rather than in fixture expectations:
    `001`, `002`, `003-metadata-preferred`,
    `004-metadata-space-separated-properties`,
    `comment-inside-script-parsing`, `metadata-content-missing`,
    `parsely-metadata`, `theverge`
  - Fix categories:
    title-source precedence, Dublin Core token handling, Parsely metadata
    handling, site-name filtering, relative/protocol-relative URL resolution,
    malformed-script text parsing, namespace normalization, and explicitly closed
    void-element recovery
- Phase 3: remaining failures
  - At the current phase-2 baseline, the remaining failures are treated as real
    extractor/content-selection issues unless later triage reclassifies them as
    acceptable Defuddle differences.
  - Extractor fixes are recorded in commit-sized batches by fixture so the port
    can still be upstreamed without burying the harness in inline comments.
  - Entry-point selector fixes:
    `aclu`, `gmw`, `qq`, `webmd-1`, `webmd-2`, `yahoo-3`, `yahoo-4`
    - Added explicit site containers so Defuddle scores the article subtree
      instead of the document body; cleanup-specific fixes may still follow.
  - Link-preservation cleanup:
    `yahoo-3`
    - Removed an over-broad partial selector so article prose that mentions
      Facebook keeps the inline anchor text instead of dropping it.
  - Module cleanup selectors:
    `webmd-1`, `webmd-2`
    - Removed WebMD reviewer/context modules that were still leaking into the
      extracted article after the container fix.

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
