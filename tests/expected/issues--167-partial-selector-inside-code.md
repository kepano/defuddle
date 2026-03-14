```json
{
  "title": "Type Theory Reference",
  "author": "",
  "site": "",
  "published": ""
}
```

This page defines helper functions for working with natural numbers. The code blocks below use span elements with generated anchor IDs that happen to match partial selector patterns like "next-".

```lean
def h1 (x : Nat) : Nat :=
```

The function h1 takes a natural number and returns a natural number. Below is a second definition that should also be preserved.

```lean
def h2 (x : Nat) : Nat :=
```

Both h1 and h2 should appear in the output. If partial selector removal strips the span elements inside code, the function names will be missing.