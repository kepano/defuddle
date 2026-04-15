```json
{
  "title": "Day 39 Update",
  "author": "",
  "site": "Example News",
  "published": "2026-04-07T21:47:36+00:00"
}
```

In the last 24 hours, incidents across multiple regions have been recorded. This fixture exercises the placeholder author pattern and the duplicated datePublished across schema graph nodes.

When the author display name is empty, some CMSes emit a literal ".." in every metadata surface. Defuddle should treat this as no author rather than returning the placeholder verbatim.