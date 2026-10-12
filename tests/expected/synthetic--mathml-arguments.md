```json
{
  "title": "MathML arguments",
  "author": "",
  "site": "example.com",
  "published": ""
}
```

A fraction needs both arguments, even when a class resembles page navigation or one argument is invisible but still occupies space.

Mathematical notation is a tree of expressions rather than a collection of unrelated page elements. A fraction contains a numerator and a denominator in a particular order. A power contains a base followed by an exponent. Removing one of those children changes the expression, even when the surviving characters still look plausible. This article compares several ways of describing the same two argument structure. The examples use generic letters so that the surrounding prose does not provide a second source for the missing symbols. Each formula has its own paragraph and must be extracted from the original document. Class names may describe a local component without describing its role on the page. A mathematical token named like a header is still an argument, not a navigation heading. Visibility and opacity can make a box invisible while leaving it in the layout tree. Such boxes are useful for alignment and spacing within an equation. They differ from elements removed from layout with display none. Accessibility sources can also live inside hidden wrappers alongside a visible rendering. Keeping those sources does not require keeping unrelated navigation or duplicate render trees. The extraction process should retain mathematical arguments while continuing to clean page structure and sanitize unsafe markup. The following examples make each of these boundaries explicit.

Exact: $\frac{a}{b}$.

Partial: $\frac{c}{d}$.

Visibility: $\frac{e}{f}$.

Opacity: $\frac{g}{h}$.

Utilities: $\frac{i}{j}$.

Phantom: $\frac{}{l}$.
