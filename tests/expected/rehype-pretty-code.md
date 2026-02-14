```json
{
  "title": "A Social Filesystem",
  "author": "Dan Abramov",
  "site": "Dan Abramov",
  "published": ""
}
```

Some intro text here to make the article long enough for defuddle to pick it up as content. This is a test article with enough words to pass the word count threshold. We need to make sure defuddle picks this up properly so we can test the code block behavior with rehype-pretty-code output.

Rehype-pretty-code uses Shiki for syntax highlighting and outputs span elements with data-line attributes to represent each line of code. The display grid style on the code element creates a visual line-by-line layout.

```fish
posts/
├── 1221499500000000-c5.json
├── 1221499500000000-k3.json   # clock id helps avoid global collisions
└── 1221499500000001-k3.json   # artificial +1 avoids local collisions
```

Each post is a small JSON file named with a timestamp and a short random clock ID.