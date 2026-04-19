```json
{
  "title": "Empty Video Placeholder",
  "author": "",
  "site": "",
  "published": ""
}
```

This fixture models a page that includes a JavaScript-driven video shell without any media source in the static HTML. The article text is intentionally long enough to keep main content detection stable during tests and to ensure the empty player is evaluated as part of the extracted content.

The player above should be removed because it has no src attribute and no source child elements. Keeping it would leak useless raw HTML into the extracted markdown output.
