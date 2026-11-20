## 0.19.10

- Images: keep every image in WordPress block galleries and in figures, captioned paragraphs and spans with several images, instead of only the first (obsidianmd/obsidian#2516)
- Images: keep a figure's different images when they share alt text or have none, and keep the alt text when merging two copies of one image

## 0.19.9

- YouTube: keep transcript segment classes and timestamps, so Obsidian Web Clipper's reader can follow the video, scroll and seek again
- YouTube: ignore braces inside strings when reading inline JSON
- Mastodon: don't merge replies into the post when handles are missing
- Footnotes: keep every footnote when a page mixes styles
- Markdown: keep task list checkboxes, and don't rewrite code blocks during cleanup
- C2 wiki: open every missing list level at once
- C2 wiki, X: time out stalled fetches after 4 seconds, so `parseAsync()` can't hang
- Parse: remove images from the output instead of the live page, skip retries for site extractors, and keep the cover image upgrade out of cached metadata
- Parse: don't change the page being parsed. `<noscript>` images, `srcSet` attributes, and Medium, NYT and Substack content are now prepared on Defuddle's copy
- Parse: leave Web Clipper's stamped shadow DOM on the page, so later parses can still read it

## 0.19.8

- X: support the redesigned web app, which clipped as a list of links and counts instead of the post and its replies (#496)

## 0.19.7

- Security: remove `<title>` elements inside MathML, which linkedom writes unescaped and browsers parse as markup (GHSA-w8hh-2cpq-9whp)
- Hacker News: fix comment authors showing as `[deleted]` and an empty post author (#481)
- Substack: read post data from the new `preloads-json` script (#482), remove the voiceover player on custom domains (#477)
- Bilibili: don't send a User-Agent the API rejects, don't cache failed transcripts (#413)
- Metadata: keep titles that start with a hashtag (#466)
- Sites: keep PsycNet full-text sections (#362) and Sphinx cross-reference links (#489)
- Clutter: keep article containers with `data-date` (#461), nonempty elements with `empty:hidden` (#476), `with-ad` wrappers (#453), inline terms with anchor IDs (#449), headings with Tailwind arbitrary values (#394), and table rows, cells and section heading IDs (#480)
- Fix: don't cut articles at a singular "Comment" label (#448) or remove short articles with a "Comments" heading (#462)
- Breadcrumbs: match parents only on the same host and whole path segments (#373)
- Math: keep empty MathML descendants (#416), and math and footnote references in headings (#437)
- Footnotes: keep LaTeXML footnote bodies, merging repeated notes into one definition (#435)
- Code: keep line breaks in code without a `pre` wrapper (#474), and author, share and counter tokens inside code blocks (#475)
- Markdown: fix nested list indentation (#357), keep nested lists after a paragraph ending in a colon (#412)
- French: keep the space before `? ! : ;` (#467)
- Images: use the largest `srcset` candidate in `<picture>` (#409)
- Performance: speed up selector removal in Safari and other WebKit browsers several times over on long pages (#439), and large code blocks from 10.7 s to 0.6 s on a 5,000-row gist (#451)
- Build: keep extractor class names in the browser bundles, so `extractorType` reports `github` instead of a minified name (#414)
- Tests: make `npm test` work on Windows (#450)
- Website: update development dependencies with security fixes

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
