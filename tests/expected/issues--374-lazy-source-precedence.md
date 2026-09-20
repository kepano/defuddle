```json
{
  "title": "Lazy image sources",
  "author": "",
  "site": "example.com",
  "published": ""
}
```

Lazy images use explicit source attributes to replace placeholders. Metadata that merely resembles an image URL should not override those sources.

![data-src](https://images.example.com/data-src.jpg)

![original](https://images.example.com/original.jpg)

![gif](https://images.example.com/gif.jpg)

![lazy-src](https://images.example.com/lazy-src.jpg)

![actual](https://images.example.com/actual.jpg)

![backup](https://images.example.com/backup.jpg)

![large-preview](https://images.example.com/large-preview.jpg)

All photographs should retain their real source after extraction, including images with an external placeholder, a small GIF, or a large inline preview.
