```json
{
  "title": "Available Article",
  "author": "",
  "site": "example.com",
  "published": ""
}
```

This article remains available in the page when an external content source returns nothing. Its paragraphs should still be extracted so readers can access the information already present in the document.

A failed external lookup should not hide this second paragraph either. The article contains useful text independently of that service, while navigation and footer text belong outside the extracted result.
