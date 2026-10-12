```json
{
  "title": "Operator attributes",
  "author": "",
  "site": "operator-attributes",
  "published": ""
}
```

Explicit operator forms select dictionary spacing independently of the position of an operator in an expression.

$$
x+y
$$

$$
-x
$$

$$
x+y
$$

Large operators can opt out of enlargement in display style, while compact style remains compact.

$$
∑x
$$

Inline display style: $∑x$.

$$
∑x
$$

Invalid operator values and unsafe attributes must not survive extraction.

$$
+x
$$

The extracted MathML should retain these narrow operator controls without retaining arbitrary styling or executable attributes.
