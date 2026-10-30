```json
{
  "title": "Explicit image sources",
  "author": "",
  "site": "example.com",
  "published": ""
}
```

Lazy sources can be relative URLs without file extensions. Metadata must never supply an image source, even when its filename resembles an image or a placeholder.

![Relative](https://example.com/photo)

![Query](https://example.com/article?image=123)

![Blank](https://example.com/blank.gif)

![Loader](https://example.com/assets/loader.gif)

The explicit source determines each image independently of attribute order, filename, and unrelated metadata.
