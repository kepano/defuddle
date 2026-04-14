```json
{
  "title": "Small equation images",
  "author": "",
  "site": "",
  "published": ""
}
```

You can obtain all the elementary functions from just the function

$$
\operatorname{fn}(x,y) = \exp(x) - \log(y)
$$

and the constant 1. The following equations show how to bootstrap addition and subtraction.

$$
\begin{align*} \exp(z) &\mapsto \operatorname{fn}(z,1) \\ \log(z) &\mapsto \operatorname{fn}(1,\exp(\operatorname{fn}(1,z))) \end{align*}
$$

See the paper for more details.
