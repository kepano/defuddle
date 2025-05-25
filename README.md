> de·​fud·dle /diˈfʌdl/ *transitive verb*  
> to remove unnecessary elements from a web page, and make it easily readable.

**Beware! Defuddle is very much a work in progress!**

Defuddle extracts the main content from web pages. It cleans up web pages by removing clutter like comments, sidebars, headers, footers, and other non-essential elements, leaving only the primary content.

[Try the Defuddle Playground →](https://kepano.github.io/defuddle/)

## Features

Defuddle aims to output clean and consistent HTML documents. It was written for [Obsidian Web Clipper](https://github.com/obsidianmd/obsidian-clipper) with the goal of creating a more useful input for HTML-to-Markdown converters like [Turndown](https://github.com/mixmark-io/turndown).

Defuddle can be used as a replacement for [Mozilla Readability](https://github.com/mozilla/readability) with a few differences:

- More forgiving, removes fewer uncertain elements.
- Provides a consistent output for footnotes, math, code blocks, etc.
- Uses a page's mobile styles to guess at unnecessary elements.
- Extracts more metadata from the page, including schema.org data.

## Installation

```bash
npm install defuddle
```

For Node.js usage, you'll also need to install JSDOM:

```bash
npm install jsdom
```

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

```javascript
import { JSDOM } from 'jsdom';
import { Defuddle } from 'defuddle/node';

// Parse HTML from a string
const html = '<html><body><article>...</article></body></html>';
const result = await Defuddle(html);

// Parse HTML from a URL
const dom = await JSDOM.fromURL('https://example.com/article');
const result = await Defuddle(dom);

// With options
const result = await Defuddle(dom, {
  debug: true, // Enable debug mode for verbose logging
  markdown: true, // Convert content to markdown
  url: 'https://example.com/article' // Original URL of the page
});

// Access the content and metadata
console.log(result.content);
console.log(result.title);
console.log(result.author);
```

_Note: for `defuddle/node` to import properly, the module format in your `package.json` has to be set to `{ "type": "module" }`_

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
| `metaTags` | object | Meta tags |
| `parseTime` | number | Time taken to parse the page in milliseconds |
| `published` | string | Publication date of the article |
| `site` | string | Name of the website |
| `schemaOrgData` | object | Raw schema.org data extracted from the page |
| `title` | string | Title of the article |
| `wordCount` | number | Total number of words in the extracted content |

## Bundles

Defuddle is available in three different bundles:

1. Core bundle (`defuddle`): The main bundle for browser usage. No dependencies.
2. Full bundle (`defuddle/full`): Includes additional features for math equation parsing.
3. Node.js bundle (`defuddle/node`): Optimized for Node.js environments using JSDOM. Includes full capabilities for math and Markdown conversion.

The core bundle is recommended for most use cases. It still handles math content, but doesn't include fallbacks for converting between MathML and LaTeX formats. The full bundle adds the ability to create reliable `<math>` elements using `mathml-to-latex` and `temml` libraries.

## Options

| Option                   | Type    | Description                                                                     |
|--------------------------|---------|---------------------------------------------------------------------------------|
| `debug`                  | boolean | Enable debug logging                                                            |
| `url`                    | string  | URL of the page being parsed                                                    |
| `markdown`               | boolean | Convert `content` to Markdown                                                   |
| `separateMarkdown`       | boolean | Keep `content` as HTML and return `contentMarkdown` as Markdown                 |
| `removeExactSelectors`   | boolean | Whether to remove elements matching exact selectors like ads, social buttons, etc. Defaults to true. |
| `removePartialSelectors` | boolean | Whether to remove elements matching partial selectors like ads, social buttons, etc. Defaults to true. |

### Debug mode

You can enable debug mode by passing an options object when creating a new Defuddle instance:

```typescript
const article = new Defuddle(document, { debug: true }).parse();
```

- More verbose console logging about the parsing process
- Preserves HTML class and id attributes that are normally stripped
- Retains all data-* attributes
- Skips div flattening to preserve document structure


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

## Development

### Build

To build the package, you'll need Node.js and npm installed. Then run:

```bash
# Install dependencies
npm install

# Clean and build
npm run build
```
