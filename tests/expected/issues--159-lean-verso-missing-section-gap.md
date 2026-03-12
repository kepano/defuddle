```json
{
  "title": "Dependent Type Theory",
  "author": "",
  "site": "",
  "published": ""
}
```

This fixture verifies we preserve an intentional blank line between adjacent Verso code fragments when one fragment ends with an extra newline before the next section header.

```lean
def b2 : Bool := false

/- Check their types. -/

#check m
m : Nat
```

Trailing prose ensures extraction continues normally.