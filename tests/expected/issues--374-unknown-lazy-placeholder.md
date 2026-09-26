```json
{
  "title": "Unknown lazy attributes",
  "author": "",
  "site": "example.com",
  "published": ""
}
```

Some lazy-loading scripts store the real source in attributes other than data-src, with an external spacer image as the placeholder.

![Blank placeholder](https://cdn.example.com/real.jpg)

![Grey placeholder](https://pic.example.com/photo_b.jpg)

![Spacer placeholder](https://cdn.example.com/echo.jpg)

![Gray whale](https://upload.example.com/thumb/Gray_whale.jpg/220px-Gray_whale.jpg)

Placeholder images should be replaced by the real sources, while a real image whose name merely contains a placeholder-like word should keep its own source.