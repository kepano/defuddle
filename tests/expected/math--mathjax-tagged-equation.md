```json
{
  "title": "Tagged Equation Test",
  "author": "",
  "site": "",
  "published": ""
}
```

A tagged single equation produced by `\tag{}` is wrapped by MathJax in an `mtable` with a single `mlabeledtr`. It should stay on one horizontal line, not collapse into a vertical stack.

$$
a = b + c ( \star )
$$

A genuine multi-row aligned system uses several `mtr` rows and must be preserved as an aligned environment.

$$
\begin{aligned}x & = & y \\ u & = & v\end{aligned}
$$