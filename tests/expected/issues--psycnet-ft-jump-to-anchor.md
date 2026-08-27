```json
{
  "title": "Article Sections With Jump-To Anchors",
  "author": "Example Author",
  "site": "Example Author",
  "published": ""
}
```

## Abstract

This invented article demonstrates a publishing layout in which the full text is divided into anchored sections. The abstract remains outside those sections, just as it does on the source site. It is deliberately substantial so the incomplete extraction produced by the regression remains above the short-content retry threshold and cannot silently recover by disabling partial-selector removal.

The example contains no names, findings, quotations, or other text from a real publication. Its only site-specific detail is the structural class used by the article sections. That is enough to reproduce the extraction failure while keeping the fixture small, deterministic, and suitable for the repository.

The unaffected material also needs enough length to mirror the real failure mode. On a full paper, the abstract, front matter, and reference list can easily exceed the parser's retry threshold even after every body section has vanished. This additional invented paragraph keeps the broken first pass above that threshold, ensuring the regression test observes the original omission instead of a recovery path intended for genuinely short pages.

## First anchored section

This section is ordinary article prose and must survive extraction. APA PsycNet applies the mixed-case class name to full-text section wrappers so that its jump navigation can target them. A case-insensitive partial match for the shorter clutter token appears inside that longer class name and previously caused the entire wrapper, including its heading and paragraphs, to be discarded.

Removing the wrapper creates a severe but quiet failure. Readers receive the abstract and bibliography, which makes the result appear plausible, while the substantive discussion between them is absent. Preserving this section therefore verifies the behavior that matters to people clipping a full paper for later reading.

## Second anchored section

A second wrapper confirms that the repair is structural rather than dependent on one identifier or heading. The longer class token should not be treated as navigation merely because its internal letters happen to spell the shorter removal pattern. Only a standalone selector token, such as the actual jump control above, should match.

The expected output retains both paragraphs and their section heading while omitting the navigation control. Together those assertions protect both sides of the change: article content stays available, and genuine page chrome continues to be filtered from the cleaned document.

## References

Example Author. (2026). A fictional reference included only to model the position of a bibliography after the article body.

Sample Researcher. (2025). Another invented citation supplies additional unaffected content so the buggy result is long enough to avoid Defuddle's automatic retry path. Journal of Reproducible Fixtures, 1, 1–10.

Test Writer. (2024). Minimal examples can isolate selector behavior without reproducing copyrighted source material. Testing Review, 2, 20–30.
