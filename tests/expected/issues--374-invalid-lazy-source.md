```json
{
  "title": "Invalid lazy sources",
  "author": "",
  "site": "example.com",
  "published": ""
}
```

Lazy-loading attributes sometimes hold empty or unsafe values instead of image URLs, and must not overwrite a working source.

![Empty](https://images.example.com/empty.jpg)

![Script](https://images.example.com/script.jpg)

![Inline](https://images.example.com/inline.jpg)

![Fallback](https://images.example.com/real.jpg)

Each image should keep a usable source that points to an actual image rather than an empty or unsafe URL.