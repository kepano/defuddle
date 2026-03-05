```json
{
  "title": "Centraliser",
  "author": "",
  "site": "",
  "published": ""
}
```

Time taken by KaTeX to render formulæ: 8 ms [PDF version](https://katex-centraliser/centraliser.pdf)  
  

#### Theorem

*If $g$ is an element of $G=S_n$ then $C_G(g)=\langle g\rangle$ if and only if the cycles of $g$ are of unequal coprime lengths.  
Alternatively, $C_G(g)=\langle g\rangle$ if and only if $g$ has cycles of coprime length with at most one 1-cycle.*  
  
*Proof.* Since powers of $g$ centralise $g$ it follows that $\langle g\rangle\subseteq C_G(g)$ so 
$$
\begin{aligned}
C_G(g)=\langle g\rangle\iff \lvert\langle g\rangle\rvert=\lvert C_G(g)\rvert\iff\lvert g\rvert=\lvert C_G(g)\rvert
\end{aligned}
$$
 (1) Let $G$ act on itself by conjugation. Then $xgx^{-1} = x\iff xg=gx$ so 
$$
\begin{aligned}
 \text{Stab}(g)=C_G(g)
\end{aligned}
$$
 (2) 
$$
\begin{aligned}
\lvert \text{Orb}(g)\rvert&=\text{\small the number of distinct conjugates of g}\\
&=\text{\small the number of permutations with the same cycle structure as }g
\end{aligned}
$$
 Let $a$ be the product of the lengths of the cycles of $g$  
Let $b$ be the number of cycles of equal length.  
Let $l$ be the least common multiple of the lengths of the cycles, $\lvert g\rvert=l\leq a$.  
  
Then the number of permutations with the same cycle structure as $g$ is 
$$
\begin{aligned}
\frac{n!}{ab}=\frac{\lvert G\rvert}{ab}
\end{aligned}
$$
 Hence 
$$
\begin{aligned}
\lvert \text{Orb}(g)\rvert=\frac{\lvert G\rvert}{ab}
\end{aligned}
$$
 (3) By the Orbit-Stabiliser theorem, $\lvert \text{Orb}(g)\rvert\times\lvert \text{Stab}(g)\rvert=\lvert G\rvert$ so by (3) 
$$
\begin{aligned}
\lvert \text{Stab}(g)\rvert=\frac{\lvert G\rvert}{\lvert \text{Orb}(g)\rvert}=\frac{\lvert G\rvert}{\lvert G\rvert/ab}=ab\geq\lvert g\rvert b\geq\lvert g\rvert=l
\end{aligned}
$$
 and it follows that 
$$
\begin{aligned}
\lvert \text{Stab}(g)\rvert=\lvert g \rvert\iff a = l \text{ and } b = 1
\end{aligned}
$$
 (4) But 
$$
\begin{aligned}
a=l\iff g\text{ has coprime cycle lengths}\\
b=1 \iff g \text{ has unequal cycle lengths}
\end{aligned}
$$
 (5) (6) The result now follows from (1), (2), (4), (5) and (6). 
$$
C_G(g)=\langle g\rangle\iff\lvert \text{Stab}(g)\rvert=\lvert g \rvert\iff\text{the cycles of g are of unequal coprime lengths}
$$
 Cycles of coprime length will have unequal lengths unless they are 1-cycles. Hence we may replace *unequal* by *at most one 1-cycle*. $\blacksquare$