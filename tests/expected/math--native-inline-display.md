```json
{
  "title": "Native math display",
  "author": "",
  "site": "example.com",
  "published": ""
}
```

Prose contains $x$ and continues with an explanation of the variable.

$y$ continues after a paragraph without becoming a display equation.

The next expression sits between two paragraphs but explicitly requests inline display.

$z$

An explicit block expression remains a display equation.

$$
b
$$

The following expression has no display attribute and uses the preceding paragraph heuristic.

$$
h
$$

Without a display attribute, surrounding prose still keeps $i$ inline while a preceding paragraph still implies block display.
