> de·​fud·dle /diˈfʌdl/ *transitive verb*  
> to remove unnecessary elements from a web page, and make it easily readable.

**Beware! Defuddle is very much a work in progress!**

Defuddle extracts the main content from web pages. It cleans up web pages by removing clutter like comments, sidebars, headers, footers, and other non-essential elements, leaving only the primary content.

## Features

Defuddle aims to output clean and consistent HTML documents. It was written for [Obsidian Web Clipper](https://github.com/obsidianmd/obsidian-clipper) with the goal of creating a more useful input for HTML-to-Markdown converters like [Turndown](https://github.com/mixmark-io/turndown).

Defuddle can be used as a replacement for [Mozilla Readability](https://github.com/mozilla/readability) with a few differences:

- More forgiving, removes fewer uncertain elements.
- Provides a consistent output for footnotes, citations, code blocks.
- Uses a page's mobile styles to guess at unnecessary elements.
- Extracts more metadata from the page, including schema.org data.

## Installation

```bash
npm install defuddle
```

## Usage

```typescript
import { Defuddle } from 'defuddle';

const article = new Defuddle(document).parse();

// Use the extracted content and metadata
console.log(article.content);  // HTML string of the main content
console.log(article.title);    // Title of the article
```

Defuddle comes in two bundles:

1. **Core bundle** (~50kB)
   ```js
   import { Defuddle } from 'defuddle';
   ```
2. **Full bundle** (~460kB) includes advanced math conversion capabilities
   ```js
   import { Defuddle } from 'defuddle/full';
   ```

The core bundle is recommended for most use cases. It still handles math content by preserving the original MathML or LaTeX, but doesn't include conversion between formats. The full bundle adds the ability to convert between MathML and LaTeX formats using `mathml-to-latex` and `temml` libraries.

### Debug mode

You can enable debug mode by passing an options object when creating a new Defuddle instance:

```typescript
const article = new Defuddle(document, { debug: true }).parse();
```

- More verbose console logging about the parsing process
- Preserves HTML class and id attributes that are normally stripped
- Retains all data-* attributes
- Skips div flattening to preserve document structure

### Server-side usage

When using Defuddle in a Node.js environment, you can use JSDOM to create a DOM document:

```typescript
import { Defuddle } from 'defuddle';
import { JSDOM } from 'jsdom';

const html = '...'; // Your HTML string
const dom = new JSDOM(html, {
  url: "https://www.example.com/page-url" // Optional: helps resolve relative URLs
});

const article = new Defuddle(dom.window.document).parse();
console.log(article.content);
```

Providing `url` in the JSDOM constructor helps convert relative URLs (images, links, etc.) to absolute URLs.

## Response

The `parse()` method returns an object with the following properties:

| Property | Type | Description |
|----------|------|-------------|
| `content` | string | HTML string of the extracted main content |
| `title` | string | Title of the article |
| `description` | string | Description or summary of the article |
| `domain` | string | Domain name of the website |
| `favicon` | string | URL of the website's favicon |
| `image` | string | URL of the article's main image |
| `parseTime` | number | Time taken to parse the page in milliseconds |
| `published` | string | Publication date of the article |
| `author` | string | Author of the article |
| `site` | string | Name of the website |
| `schemaOrgData` | object | Raw schema.org data extracted from the page |
| `wordCount` | number | Total number of words in the extracted content |

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

<div class="footnotes">
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

## Development

### Build

To build the package, you'll need Node.js and npm installed. Then run:

```bash
# Install dependencies
npm install

# Clean and build
npm run build
```

This will generate:
- `dist/index.js` - UMD build for both Node.js and browsers
- `dist/index.d.ts` - TypeScript declaration file
