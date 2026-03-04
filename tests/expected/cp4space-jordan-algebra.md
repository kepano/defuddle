```json
{
  "title": "The exceptional Jordan algebra",
  "author": "apgoucher",
  "site": "Complex Projective 4-Space",
  "published": "2020-10-28T14:19:38+00:00"
}
```

In the early 1930s, Pascual Jordan attempted to formalise the algebraic properties of Hermitian matrices. In particular:

- Hermitian matrices form a real vector space: we can add and subtract Hermitian matrices, and multiply them by real scalars. That is to say, if $\lambda, \mu \in \mathbb{R}$ and $A, B$ are Hermitian matrices, then so is the linear combination $\lambda A + \mu B$.
- We *cannot* multiply Hermitian matrices and obtain a Hermitian result, unless the matrices commute. So the matrix product $AB$ is not necessarily Hermitian, but the ‘symmetrised’ product $A \circ B = \frac{1}{2}(AB + BA)$ is Hermitian, and coincides with ordinary multiplication whenever the matrices commute.

Now, this symmetrised product $A \circ B$ is commutative by definition, and is also (bi)linear: $(\lambda A + \mu B) \circ C = \lambda (A \circ C) + \mu (B \circ C)$. What other algebraic properties must this product satisfy? The important ones are:

- **Power-associativity:** the expression $A^n = A \circ \cdots \circ A$ does not depend on the parenthesisation.
- **Formal reality:** a sum of squares is zero if and only if all of the summands are zero.

The second of these conditions means that we can say that an element of the Jordan algebra is ‘nonnegative’ if it can be expressed as a sum of squares. (In the familiar context of real symmetric matrices, this coincides with the property of the matrix being positive-semidefinite.) The nonnegative elements form a ‘cone’ closed under multiplication by positive real scalars and addition.

Jordan, von Neumann, and Wigner proceeded to classify all of the finite-dimensional algebras of this form (known as *formally real Jordan algebras*). They showed that every such algebra is a direct sum of ‘simple’ algebras, each of which is isomorphic to \[at least\] one of the following:

- the real symmetric matrices of dimension *n* (for any positive integer *n*) with the aforementioned symmetrised product;
- the complex Hermitian matrices of dimension *n*;
- the quaternionic Hermitian matrices of dimension *n*;
- the octonionic Hermitian matrices of dimension *n* (where *n ≤* 3);
- the algebras $\mathbb{R}^n \oplus \mathbb{R}$ with the product $(x, t) \circ (x', t') = (t'x + tx', \langle x, x' \rangle + tt')$, known as ‘spin factors’.

Exactly one of these simple formally real Jordan algebras fails to fit into any of the four infinite families. This exceptional Jordan algebra is $\mathfrak{h}_3(\mathbb{O})$, the 3-by-3 self-adjoint octonionic matrices endowed with the symmetrised product. Viewed as a real vector space, it is 27-dimensional: an arbitrary element can be described uniquely by specifying the three diagonal elements (which must be real) and three lower off-diagonal elements (which can be arbitrary octonions); the three upper off-diagonal elements are then determined.

### Projective spaces from Jordan algebras

Given a formally real Jordan algebra, we can consider the idempotent elements satisfying $A \circ A = A$. For the Jordan algebras built from *n* -by- *n* real, complex, or quaternionic matrices, these are the matrices with eigenvalues 0 and 1.

We get a partial order on these ‘projection’ matrices: *A* ‘contains’ *B* if and only if $A \circ B = B$. This partially-ordered set can be identified with the stratified collection of subspaces in the (*n* −1)-dimensional projective space over the base field.

What about the spin factors? The idempotents in $\mathbb{R}^n \oplus \mathbb{R}$ are:

- the zero element (0, 0), corresponding to the ’empty space’;
- the identity element (0, 1), corresponding to the ‘full space’;
- the points (*x*, ½) where *x* is an arbitrary vector of length ½.

### A lattice in this exotic spacetime

It is natural to consider the ‘integer points’ in this spacetime, namely the octonionic Hermitian matrices where the off-diagonal elements are Cayley integers and the diagonal elements are ordinary integers. John Baez [mentions](https://math.ucr.edu/home/baez/octonions/integers/integers_8.html) that this is the unique integral unimodular lattice in (26+1)-dimensional spacetime, and it can be seen as the direct sum $II_{25,1} \oplus \mathbb{Z}$ of the exceptional Lorentzian lattice with a copy of the integers.

One of these orbits contains the identity matrix; the other contains the circulant matrix with elements {2, η, η\*} where $\eta = \dfrac{-1 + \sqrt{-7}}{2}$.

Specifically, as shown in the Elkies-Gross paper, triples of Cayley integers with the norm $\langle x | E | x \rangle$ form an isometric copy of the Leech lattice! By contrast, the usual inner product $\langle x | I | x \rangle$ using the identity matrix as the quadratic form gives the direct sum $E_8 \oplus E_8 \oplus E_8$ — again an even unimodular lattice in 24 dimensions, but not as exceptional or beautiful or efficient as the Leech lattice.

### Further reading

To get a full understanding of the octonions, Cayley integers, and exceptional Jordan algebra, I recommend reading all of the following:

- John Baez’s articles on [integral octonions](https://math.ucr.edu/home/baez/octonions/integers/);
- *On Quaternions and Octonions*, by Conway and Smith;
- [The Exceptional Cone and the Leech Lattice](https://academic.oup.com/imrn/article-abstract/1996/14/665/717554), by Elkies and Gross.

Robert Wilson has also constructed the Leech lattice from the integral octonions. Wilson’s construction also involves $\eta = \dfrac{-1 + \sqrt{-7}}{2}$, so it may be possible to show reasonably directly that it’s equivalent to the Elkies-Gross construction.