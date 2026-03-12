```json
{
  "title": "Dependent Type Theory",
  "author": "",
  "site": "",
  "published": ""
}
```

This fixture verifies that Verso-style Lean command and output fragments are merged into a single fenced code block. It also checks that hidden hover metadata does not leak into visible code text during extraction. The paragraph is intentionally verbose so content detection remains stable and deterministic across environments.

```lean
#check Nat
Nat : Type
#check Bool
Bool : Type
#check Nat → Bool
Nat → Bool : Type
```

Text after the example ensures that downstream markdown rendering keeps non-code prose separate from the merged block output.