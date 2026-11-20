import { describe, it, expect } from 'vitest';
import { MathMLToLaTeX } from './shim';

describe('mphantom (integration)', () => {
  it.each([
    {
      name: 'replaces every character inside tag by normalized empty space',
      mathml: `
<root>
<math>
  <mrow>
    <mi> x </mi>
    <mo> + </mo>
    <mphantom>
      <mi> y </mi>
      <mo> + </mo>
    </mphantom>
    <mi> z </mi>
  </mrow>
</math>
</root>
`,
      latex: 'x + z',
    },
  ])('$name', ({ mathml, latex }) => {
    expect(MathMLToLaTeX.convert(mathml)).toBe(latex);
  });
});
