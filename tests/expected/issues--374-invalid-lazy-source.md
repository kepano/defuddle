```json
{
  "title": "Invalid lazy sources",
  "author": "",
  "site": "example.com",
  "published": ""
}
```

Lazy-loading attributes sometimes hold flags or unsafe values instead of image URLs, and must not overwrite a working source.

![Flag](https://images.example.com/flag.jpg)

![Script](https://images.example.com/script.jpg)

![Inline](https://images.example.com/inline.jpg)

![Fallback](https://images.example.com/real.jpg)

Each image should keep a usable source that points to an actual image rather than a flag or an unsafe URL.