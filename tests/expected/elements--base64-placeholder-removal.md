```json
{
  "title": "Base64 Placeholder Image Handling",
  "author": "",
  "site": "",
  "published": ""
}
```

## Base64 Placeholder Images

This article tests removal of unresolvable base64 placeholder images while preserving resolvable ones.

Some article text between images with enough words for content detection to function properly here.

![Resolvable from picture source.](https://www.example.com/images/resolved.webp)

Resolvable from picture source. Photo credit.

More article text with enough content for the parser to work with on this test article page.

![Resolvable from data-src.](https://www.example.com/images/lazy-loaded.jpg) ![A real image.](https://www.example.com/images/real-image.jpg)

Final paragraph with concluding article text for the content detection scoring algorithm.