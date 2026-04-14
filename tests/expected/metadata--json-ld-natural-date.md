```json
{
  "title": "Example Article With Natural-Language JSON-LD Date",
  "author": "",
  "site": "",
  "published": "2025-10-20T00:00:00+00:00"
}
```

Some sites emit schema.org JSON-LD with non-ISO date strings like "Oct 20, 2025" instead of the ISO 8601 format the specification requires. Defuddle should normalize these to ISO when possible so downstream consumers can pass the value straight to Date constructors without hitting V8's year-2001 fallback quirk.

This fixture reproduces that upstream pattern: a JSON-LD block with an abbreviated-month, natural-language datePublished value and no other date sources on the page.
