```json
{
  "title": "Build a streaming parser",
  "author": "",
  "site": "Perplexity",
  "published": ""
}
```

**You**

How should I parse streamed Markdown?

---

**Perplexity**

Start with an incremental parser. [^1]

## Checklist

- Preserve incomplete tokens
- Render stable blocks
```
parser.write(chunk);
```

---

**You**

How do I keep citations?

---

**Perplexity**

Convert citation pills to footnotes [^1] and keep distinct sources [^2].

An invalid citation keeps its visible label: Unsafe label.

[^1]: [Example Docs](https://example.com/parser)

[^2]: [Spec & Guide](https://example.org/spec)