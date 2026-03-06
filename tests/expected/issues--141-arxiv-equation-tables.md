```json
{
  "title": "arXiv Equation Tables",
  "author": "",
  "site": "",
  "published": ""
}
```

## Scaled Dot-Product Attention

We call the attention function on a set of queries simultaneously.

$$
\mathrm{Attention}(Q,K,V)=\mathrm{softmax}(\frac{QK^{T}}{\sqrt{d_{k}}})V
$$

The two most commonly used attention functions are additive attention and dot-product attention.

$$
\mathrm{MultiHead}(Q,K,V)=\mathrm{Concat}(\mathrm{head}_{1},...,\mathrm{head}_{h})W^{O}
$$