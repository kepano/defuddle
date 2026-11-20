```json
{
  "title": "Reading results",
  "author": "",
  "site": "example.org",
  "published": ""
}
```

This guide shows how to read the object the parser returns. The parser takes a document, finds the main content, removes clutter such as navigation and sidebars, and returns the cleaned content.

```
// Parse the current document and read the metadata the parser found on the page
const result = parser.parse();
console.log(result.author);
menu.share(result.url);
```

The result carries the title, the author, the publication date and the content. Each property is a plain string, so it can be logged or stored without further conversion.

```
Written by
Share
12 Likes
```

`3 Comments`

That is the whole result.
