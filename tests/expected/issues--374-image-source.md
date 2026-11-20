```json
{
  "title": "Image sources",
  "author": "",
  "site": "example.com",
  "published": ""
}
```

Images should retain their real source even when metadata attributes also contain URLs ending in image extensions.

![Diagram](https://images.example.com/diagram.png)

![Chart](https://example.com/images/chart.png)

Both images have usable sources that should remain intact after extraction. Metadata must not replace either the relative source or the protocol-relative source.
