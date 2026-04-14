```json
{
  "title": "Article With Date In H1 Cousin Subtree",
  "author": "",
  "site": "",
  "published": "2026-02-05T00:00:00+00:00"
}
```

Some publishers place the article date in a sibling subtree of the h1 rather than as a direct sibling of the heading element. This fixture covers that case so defuddle can find the date by walking up the h1 ancestor chain and scanning descendants.

The metadata block is a cousin of the h1 — both live inside the same content wrapper but in separate header and metadata subtrees. A plain h1.nextElementSibling walk would never reach the date text.
