```json
{
  "title": "Lazy srcset placeholder",
  "author": "",
  "site": "example.com",
  "published": ""
}
```

Lazy images may ship a tiny inline placeholder in both src and srcset while the real responsive sources wait in data-srcset.

![Photo](https://images.example.com/photo-1200.jpg)

![Other](https://images.example.com/other-1200.jpg)

The extracted image should use the real responsive sources rather than the placeholder source set.