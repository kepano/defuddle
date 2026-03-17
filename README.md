> de·​fud·dle /diˈfʌdl/ *transitive verb*  
> to remove unnecessary elements from a web page, and make it easily readable.

**Beware! Defuddle is very much a work in progress!**

Defuddle extracts the main content from web pages. It cleans up web pages by removing clutter like comments, sidebars, headers, footers, and other non-essential elements, leaving only the primary content.

## Overview

Defuddle takes a URL or HTML, finds the main content, and returns cleaned HTML or Markdown. Defuddle was created for the browser extension [Obsidian Web Clipper](https://github.com/obsidianmd/obsidian-clipper), but it is designed to run in any environment.

Defuddle can be used as a replacement for [Mozilla Readability](https://github.com/mozilla/readability) with a few differences:

- More forgiving, removes fewer uncertain elements.
- Provides a consistent output for footnotes, math, code blocks, etc.
- Uses a page's mobile styles to guess at unnecessary elements.
- Extracts more metadata from the page, including schema.org data.

## Usage

### Browser

```javascript
import Defuddle from 'defuddle';

// Parse the current document
const defuddle = new Defuddle(document);
const result = defuddle.parse();

// Access the content and metadata
console.log(result.content);
console.log(result.title);
console.log(result.author);
```

### Node.js

`defuddle/node` accepts a DOM `Document` from any implementation (JSDOM, linkedom, happy-dom, etc.).

```javascript
import { parseHTML } from 'linkedom';
import { Defuddle } from 'defuddle/node';

const { document } = parseHTML(html);
const result = await Defuddle(document, 'https://example.com/article', {
  markdown: true
});

console.log(result.content);
console.log(result.title);
console.log(result.author);
```

Or with JSDOM:

```javascript
import { JSDOM } from 'jsdom';
import { Defuddle } from 'defuddle/node';

const dom = new JSDOM(html, { url: 'https://example.com/article' });
const result = await Defuddle(dom.window.document, 'https://example.com/article');
```

_Note: for `defuddle/node` to import properly, the module format in your `package.json` has to be set to `{ "type": "module" }`_

### CLI

Defuddle includes a command-line interface for parsing web pages directly from the terminal. You can run it with `npx` or [install it globally](#cli-installation).

```bash
# Parse a local HTML file
npx defuddle parse page.html

# Parse a URL
npx defuddle parse https://example.com/article

# Output as markdown
npx defuddle parse page.html --markdown

# Output as JSON with metadata
npx defuddle parse page.html --json

# Extract a specific property
npx defuddle parse page.html --property title

# Save output to a file
npx defuddle parse page.html --output result.html

# Enable debug mode
npx defuddle parse page.html --debug
```

#### CLI Options

| Option | Alias | Description |
|--------|-------|-------------|
| `--output <file>` | `-o` | Write output to a file instead of stdout |
| `--markdown` | `-m` | Convert content to markdown format |
| `--md` | | Alias for `--markdown` |
| `--json` | `-j` | Output as JSON with metadata and content |
| `--property <name>` | `-p` | Extract a specific property (e.g., title, description, domain) |
| `--debug` | | Enable debug mode |
| `--lang <code>` | `-l` | Preferred language (BCP 47, e.g. `en`, `fr`, `ja`) |

## Installation

```bash
npm install defuddle
```

For Node.js usage, install a DOM implementation:

```bash
npm install linkedom
```

Or use JSDOM:

```bash
npm install jsdom
```

### CLI installation

To use the `defuddle` command globally, install it with the `-g` flag:

```bash
npm install -g defuddle
```

Or use `npx` to run the CLI without installing globally:

```bash
npx defuddle parse https://example.com/article
```

## Response

Defuddle returns an object with the following properties:

| Property | Type | Description |
|----------|------|-------------|
| `author` | string | Author of the article |
| `content` | string | Cleaned up string of the extracted content |
| `description` | string | Description or summary of the article |
| `domain` | string | Domain name of the website |
| `favicon` | string | URL of the website's favicon |
| `image` | string | URL of the article's main image |
| `language` | string | Language of the page in [BCP 47](https://www.rfc-editor.org/info/bcp47) format (e.g. `en`, `en-US`) |
| `metaTags` | object | Meta tags |
| `parseTime` | number | Time taken to parse the page in milliseconds |
| `published` | string | Publication date of the article |
| `site` | string | Name of the website |
| `schemaOrgData` | object | Raw schema.org data extracted from the page |
| `title` | string | Title of the article |
| `wordCount` | number | Total number of words in the extracted content |
| `debug` | object | Debug info including content selector and removals (when `debug: true`) |

## Bundles

Defuddle is available in three different bundles:

1. Core bundle (`defuddle`): The main bundle for browser usage. No dependencies.
2. Full bundle (`defuddle/full`): Includes additional features for math equation parsing and Markdown conversion.
3. Node.js bundle (`defuddle/node`): For Node.js environments. Accepts any DOM `Document` (e.g. from linkedom, JSDOM, or happy-dom). Includes full capabilities for math and Markdown conversion.

The core bundle is recommended for most use cases. It still handles math content, but doesn't include fallbacks for converting between MathML and LaTeX formats. The full bundle adds the ability to create reliable `<math>` elements using `mathml-to-latex` and `temml` libraries.

## Options

| Option                   | Type    | Default | Description                                                               |
| ------------------------ | ------- | ------- | ------------------------------------------------------------------------- |
| `debug`                  | boolean | false   | Enable debug logging and return debug info in the response                |
| `url`                    | string  |         | URL of the page being parsed                                              |
| `markdown`               | boolean | false   | Convert `content` to Markdown                                             |
| `separateMarkdown`       | boolean | false   | Keep `content` as HTML and return `contentMarkdown` as Markdown           |
| `removeExactSelectors`   | boolean | true    | Remove elements matching exact selectors like ads, social buttons, etc.   |
| `removePartialSelectors` | boolean | true    | Remove elements matching partial selectors like ads, social buttons, etc. |
| `removeHiddenElements`   | boolean | true    | Remove elements hidden via CSS (display:none, visibility:hidden, etc.)    |
| `removeLowScoring`       | boolean | true    | Remove non-content blocks by scoring (navigation, link lists, etc.)       |
| `removeSmallImages`      | boolean | true    | Remove small images (icons, tracking pixels, etc.)                        |
| `removeImages`           | boolean | false   | Remove images.                                                            |
| `standardize`            | boolean | true    | Standardize HTML (footnotes, headings, code blocks, etc.)                 |
| `contentSelector`        | string  |         | CSS selector to use as the main content element, bypassing auto-detection |
| `useAsync`               | boolean | true    | Allow async extractors to fetch from third-party APIs when no local content is available. |
| `language`               | string  |         | Preferred language (BCP 47 tag, e.g. `en`, `fr`). Sets `Accept-Language` header and selects transcript language. |
| `includeReplies`         | boolean \| 'extractors' | 'extractors' | Include replies: `'extractors'` for site-specific extractors only, `true` for all, `false` for none. |

## HTML standardization

Defuddle attempts to standardize HTML elements to provide a consistent input for subsequent manipulation such as conversion to Markdown.

### Headings

- The first H1 or H2 heading is removed if it matches the title.
- H1s are converted to H2s.
- Anchor links in H1 to H6 elements are removed and become plain headings.

### Code blocks

Code block are standardized. If present, line numbers and syntax highlighting are removed, but the language is retained and added as a data attribute and class.

```html
<pre>
  <code data-lang="js" class="language-js">
    // code
  </code>
</pre>
```

### Footnotes

Inline references and footnotes are converted to a standard format:

```html
Inline reference<sup id="fnref:1"><a href="#fn:1">1</a></sup>.

<div id="footnotes">
  <ol>
    <li class="footnote" id="fn:1">
      <p>
        Footnote content.&nbsp;<a href="#fnref:1" class="footnote-backref">↩</a>
      </p>
    </li>
    </ol>
</div>
```

### Math

Math elements, including MathJax and KaTeX, are converted to standard MathML:

```html
<math xmlns="http://www.w3.org/1998/Math/MathML" display="inline" data-latex="a \neq 0">
  <mi>a</mi>
  <mo>≠</mo>
  <mn>0</mn>
</math>
```

### Callouts

Callout and alert elements from various sources are standardized to blockquotes with a `data-callout` attribute. When converting to Markdown, these become [Obsidian-style callouts](https://help.obsidian.md/Editing+and+formatting/Callouts).

Supported sources:
- GitHub markdown alerts (`div.markdown-alert`)
- Obsidian Publish callouts (`div.callout[data-callout]`)
- Callout asides (`aside.callout-*`)
- Bootstrap alerts (`div.alert.alert-*`)

The standardized HTML follows the [Obsidian Publish](https://help.obsidian.md/Editing+and+formatting/Callouts) format:

```html
<div data-callout="info" class="callout">
  <div class="callout-title">
    <div class="callout-title-inner">Info</div>
  </div>
  <div class="callout-content">
    <p>This is an informational callout.</p>
  </div>
</div>
```

In Markdown:

```markdown
> [!info] Info
> This is an informational callout.
```

## Development

### Build

To build the package, you'll need Node.js and npm installed. Then run:

```bash
# Install dependencies
npm install

# Clean and build
npm run build
```

## Third-party services

When using `parseAsync()`, if no content can be extracted from the local HTML, Defuddle may fetch content from third-party APIs as a fallback. This only happens when the page HTML contains no usable content (e.g. client-side rendered SPAs). You can disable this by setting `useAsync: false` in options.

- [FxTwitter API](https://github.com/FixTweet/FxTwitter) — Used to extract X (Twitter) article content, which is not available in server-rendered HTML.

## Debugging

### Debug mode

You can enable debug mode by passing an options object when creating a new Defuddle instance:

```typescript
const result = new Defuddle(document, { debug: true }).parse();

// Access debug info
console.log(result.debug.contentSelector); // CSS selector path of chosen main content element
console.log(result.debug.removals);        // Array of removed elements with reasons
```

When debug mode is enabled:

- Returns a `debug` field in the response with detailed information about content extraction
- More verbose console logging about the parsing process
- Preserves HTML class and id attributes that are normally stripped
- Retains all data-* attributes
- Skips div flattening to preserve document structure

The `debug` field contains:

| Property | Type | Description |
|----------|------|-------------|
| `contentSelector` | string | CSS selector path of the chosen main content element |
| `removals` | array | List of elements removed during processing |

Each removal entry contains:

| Property | Type | Description |
|----------|------|-------------|
| `step` | string | Pipeline step that removed the element (e.g. `removeLowScoring`, `removeBySelector`, `removeHiddenElements`) |
| `selector` | string | CSS selector or pattern that matched (for selector-based removal) |
| `reason` | string | Why the element was removed (e.g. `score: -20`, `display:none`) |
| `text` | string | First 200 characters of the removed element's text content |

### Pipeline toggles

You can disable individual pipeline steps to diagnose content extraction issues:

```typescript
// Skip content scoring to see if it's removing content incorrectly
const result = new Defuddle(document, { removeLowScoring: false }).parse();

// Skip hidden element removal (useful for CSS sidenote layouts)
const result = new Defuddle(document, { removeHiddenElements: false }).parse();

// Skip small image removal
const result = new Defuddle(document, { removeSmallImages: false }).parse();
```

### Content selector

Use `contentSelector` to bypass Defuddle's auto-detection and specify the main content element directly:

```typescript
const result = new Defuddle(document, {
  contentSelector: 'article.post-content'
}).parse();
```

If the selector doesn't match any element, Defuddle falls back to auto-detection.
