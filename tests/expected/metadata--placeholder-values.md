```json
{
  "title": "Placeholder Fallbacks",
  "author": "",
  "site": "Example Blog",
  "published": "2026-03-15T10:00:00+00:00"
}
```

Some CMSes leave unresolved template literals like the ones in this page's meta tags. Defuddle should skip over these and fall back to the next valid source.

In this fixture, og:title, og:site\_name, og:description, and article:published\_time are all template placeholders. The name meta description and the name author are both literal "..". The real values come from the schema and twitter:description tags.