```json
{
  "title": "pulldown-cmark footnote-definition",
  "author": "",
  "site": "",
  "published": ""
}
```

## Example post with a footnote

Example bit-shift analysis: a common simplification is to replace `x & ~0` with `x` [^1]. Other paragraph content follows that explains the broader idea in more detail.

This is an additional paragraph with more prose to give the post enough weight for the content detection scoring. Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.

Thanks to everyone for reading. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat.

[^1]: Possibly with masking of the top bit if our IR semantics have defined wrapping/truncation behavior: `x & 0x7fff..ffff`