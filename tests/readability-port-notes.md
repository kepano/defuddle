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
  - Link-normalization variants:
    `base-url`
    - Accepted as semantic-text because Defuddle resolves fragment-only links to
      absolute page URLs instead of preserving bare `#fragment` hrefs.
  - Metadata-backed structural subsets:
    `ars-1`
    - Removed a standalone intro-image credit node so figure credits do not
      leak into article prose as stray links.
    - Accepted as a structural subset because Defuddle keeps the article body
      and lead image in content while leaving the section label and lower-deck
      in metadata rather than duplicating them in the body.
    - The compat harness strips the expected-side Ars `header` block before
      comparing the remaining article body.
  - Metadata fix plus richer-media superset:
    `bbc-1`
    - Fixed author extraction so section labels in date-adjacent metadata no
      longer override real bylines; `article:author` / `og:article:author`
      metadata is now used when present.
    - The fixture is accepted as a structural superset because Defuddle keeps
      BBC inline video embeds, media captions, and one live-updates link that
      Mozilla omits.
    - The compat harness strips decorative `img[alt="line"]` separator images
      from the expected side before comparing the remaining article text.
  - Schema multi-author fix:
    `videos-2`
    - Fixed schema array traversal and URL-only `article:author` handling so
      multi-author JSON-LD bylines are extracted instead of collapsing to an
      empty author.
    - The fixture is accepted as a metadata variant because Defuddle keeps the
      byline in metadata rather than duplicating the author names at the end of
      the article body.
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
  - Inline ad cleanup:
    `gmw`
    - Removed the in-article ad iframe from the selected content; the remaining
      diff is accepted as semantic-text because Defuddle normalizes the caption
      indentation instead of preserving the original full-width spacing.
  - Share-widget cleanup and chrome subset:
    `qq`
    - Removed the inline Tencent share widget from the article body.
    - The fixture is accepted as a structural subset because Defuddle keeps the
      article and intentionally drops the timestamp header and footer junk that
      Mozilla's expected HTML still preserves.
  - Channel-label cleanup and lead-media superset:
    `aclu`
    - Removed the blog-channel label from the extracted content.
    - The fixture is accepted as a structural superset because Defuddle keeps
      the lead image/caption block while preserving the article body intact.
  - Wrapper widening and inline-related cleanup:
    `aktualne`
    - Preferred the outer article wrapper over the inner `#article-content`
      node so the article deck/perex is retained.
    - Removed the inline related-story boxes, typo-report footer, and trailing
      topic tag rail that were still leaking into the selected content.
    - The imported Mozilla expected HTML still contains the typo-report module
      as a flattened paragraph, so the compat harness strips that expected-side
      boilerplate by text snippet before comparing the remaining article prose.
    - The fixture is accepted as a structural superset because Defuddle keeps
      the lead and inline photo/caption blocks while preserving the article
      body intact.
  - Inert iframe cleanup and heading-preservation superset:
    `basic-tags-cleaning`
    - Removed `iframe[src="about:blank"]` so inert fallback frames do not leak
      into extracted article content.
    - The fixture is accepted as a structural superset because Defuddle keeps
      the article's semantic headings instead of flattening them away.
  - Yahoo story chrome and byline cleanup:
    `yahoo-3`
    - Removed Yahoo story header/share/preference bars from the selected
      article container.
    - Added author extraction support for `cite.byline` markup.
    - Removed consecutive interstitial promo-link paragraphs inserted between
      real article paragraphs.
    - The fixture is accepted as a structural subset because Defuddle omits the
      non-article `'GMA' Cookie Search` teaser banner that Mozilla kept.
  - Yahoo Japan article chrome cleanup:
    `yahoo-4`
    - Removed the Yahoo Japan article shell around `#ym_newsarticle`
      (`.hd`, `.snsButton`, related-article block, and footer metadata).
    - The fixture keeps a title variant without the Yahoo suffix.
    - The imported Mozilla byline is intentionally skipped because `個人` comes
      from Yahoo navigation, not from the article itself.
  - Yahoo AP gallery subset:
    `yahoo-2`
    - Accepted as a structural subset because Defuddle drops the `1 / 5`
      gallery counter.
    - Accepted with a metadata variant because Defuddle keeps the article title
      instead of Yahoo’s generic portal title.
  - Author-meta fallback fix:
    `keep-images`, `medium-2`
    - Fixed generic author extraction so URL-only `article:author` metadata no
      longer masks a later `meta[name="author"]` string.
    - Added older-Medium author fallbacks in the site extractor so live Medium
      pages without modern `data-testid` markup still keep the byline.
  - Trailing flow-text preservation:
    `blogger`
    - Tightened the trailing thin-section remover so it does not delete
      headings that are interleaved with direct text nodes in old `<br>`-driven
      blog markup.
    - This keeps legitimate end-of-article FAQ/getting-started sections instead
      of stripping the headings and collapsing the remaining text into one long
      paragraph.
    - The fixture is accepted as semantic-text because Defuddle still
      normalizes some paragraph boundaries around inline image captions and
      `<br>`-separated prose instead of reproducing Mozilla's exact markdown
      block splits.
  - Independent related-module cleanup:
    `bug-1255978`
    - Removed the Independent's inline related-list, gallery, share-bar,
      syndication, Taboola, and signpost modules from the extracted article.
    - Trimmed extra Video.js control chrome that Defuddle was turning into body
      text.
    - The fixture is accepted as a structural subset because Defuddle now drops
      remaining share/reuse UI that Mozilla still preserved in the expected
      body, and it keeps the article title with the leading `The`.
  - Hero-metadata/newsletter subset:
    `breitbart`
    - Accepted as a structural subset because Defuddle keeps the headline hero
      as metadata (`response.image`) rather than duplicating it inline in the
      article body, and drops the duplicate date line and newsletter prompt
      that Mozilla preserved above the article text.
    - The imported Mozilla byline blob is intentionally skipped because it
      mixes the author with date and engagement counters, while Defuddle keeps
      the clean author name in metadata.
  - Metadata-led CityLab variant:
    `citylab-1`
    - Accepted as a structural subset because Defuddle strips the newsletter
      signup and about-author boilerplate from the body.
    - Accepted with a title variant because Defuddle keeps the page's SEO title
      (`A Brief History of Neon Signage`) while Mozilla expected the social
      share title.
  - BuzzFeed post-article cleanup:
    `buzzfeed-1`
    - Removed the BuzzFeed post-footer promo, author bio/contact box, share
      block, Facebook comments hook, and "next on" module from the extracted
      article.
    - The fixture is accepted as a structural superset because Defuddle still
      preserves the intro blurb and hero image block that Mozilla omitted.
  - CNN inline partner-module cleanup:
    `cnn`
    - Removed the inline SmartAsset calculator block, Outbrain/sidebar partner
      modules, and other paid-partner rail widgets that were leaking into the
      selected article.
    - The fixture is accepted as a structural subset because Defuddle also
      drops the SmartAsset sponsor label and footer timestamp that Mozilla
      preserved even though they are not part of the article body.
  - CNET sprite and flyout cleanup:
    `cnet`
    - Removed the global SVG symbol-sheet blocks, floating video promo shell,
      Taboola popover iframe container, and the CNET membership/signup flyout
      that were leaking into the selected article.
    - The fixture now passes without a per-fixture expectation override.
  - Dropbox wrapper and table-tail preservation:
    `dropbox-blog`
    - Added Dropbox’s `.dr-article-content__content` wrapper as an entry point
      and stripped the adjacent in-page side navigation.
    - Fixed the trailing-boilerplate truncation pass so it does not treat the
      table header cell `Comment` as a comments-footer marker and delete the
      remainder of the article.
    - Accepted with a title variant because Defuddle keeps Dropbox’s page-title
      form (`How we designed Dropbox ATF: an async task framework`) instead of
      Mozilla’s typographic apostrophe-plus-dash variant.
  - EBB body-vs-footer normalization:
    `ebb-org`
    - Accepted as a structural superset because Defuddle preserves the article
      title as a heading and drops the trailing site disclaimer/footer block
      that Mozilla preserved in the imported expected HTML.
    - The compat harness strips the expected-side in-body date/byline line and
      disclaimer text before checking that the remaining article prose is
      contained in Defuddle’s output.

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
