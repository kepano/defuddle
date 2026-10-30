## 0.19.6

- Fixed HTML kept in Markdown output (embeds, SVG, superscripts, and complex tables) carrying unsafe links and event handlers, or Markdown that renders as links, including when calling `createMarkdownContent` directly (GHSA-6frv-jcwm-xqcj).
- Fixed YouTube auto-dub captions being selected instead of the default audio language when the player response omits the default caption index (#410).
- Fixed YouTube transcripts using stale inline player data from another video when caption requests fail (#400).
- Updated development dependencies with security fixes.

## 0.19.5

- Hardened Markdown escaping for links, images, footnotes, callouts, code blocks, and math, preventing page content from becoming unintended markup or unsafe links (#396).
- Fixed lazy-loaded images using explicit source attributes, preventing filenames and unrelated metadata from replacing image URLs (#388).
- Preserved screen-reader text, including mixed numbers and link labels, while removing redundant link annotations (#390).
- Fixed extraction on pages with special characters in IDs and classes, including Tailwind classes and React streaming content. Kept generated selectors stable after shadow DOM and streamed-content changes (#392).
- Fixed whole-page fallbacks overriding successfully extracted content during retries, and allowed async extractors to run before falling back to the page body (#358).
- Added caught extraction errors to `debug.errors` and automatic content detection when `contentSelector` is invalid (#358).
- Shared math processing between core and full builds, fixed element creation in cloned documents, and added direct tests for both variants.
- Removed unused code and added unused-code checks to CI.

## 0.19.4

- Fixed metadata and content extraction inconsistencies between linkedom and JSDOM, including missing site names and dates removed from email headers.
- Fixed lowercase heading serialization with linkedom.
- Fixed backticks escaped inside code blocks and fences ending prematurely (#359).
- Fixed unwanted spaces around inline code, superscripts, subscripts, typographic quotes, and dashes (#379, #364).
- Preserved MathML in arXiv equation tables (#376) and made the MathML converter a required dependency (#385).
- Preserved declarative shadow DOM content.
- Fixed YouTube transcript selection to prefer the default caption language over translations (#370).
- Fixed the CLI hanging after failed fetches.
- Hardened HTML sanitization for templates and unsafe content roots, and escaped C2 wiki source.
- Updated dependencies and added JSDOM coverage to CI.
