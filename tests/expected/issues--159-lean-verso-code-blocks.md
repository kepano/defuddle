```json
{
  "title": "Dependent Type Theory",
  "author": "",
  "site": "",
  "published": ""
}
```

This fixture simulates a documentation page where highlighted code is rendered as a standalone `code.hl.block` element instead of a `pre` wrapper. Defuddle should preserve this as a fenced code block and should not expand internal links into markdown link syntax inside code. The surrounding prose is intentionally long enough to make main-content detection stable in tests and avoid scoring noise.

```lean
def m : Nat := 1       -- m is a natural number
```

Additional text after the code block verifies that extraction continues normally and that the code is treated as block content rather than inline text. This also helps ensure the markdown output remains readable and that the issue does not regress in future updates.