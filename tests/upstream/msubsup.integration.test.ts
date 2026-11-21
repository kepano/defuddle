import { describe, it, expect } from 'vitest';
import { MathMLToLaTeX } from './shim';
import { InvalidNumberOfChildrenError } from './shim';

describe('msubsup (integration)', () => {
  it.each([
    {
      name: 'join its children using _ and ^ and wrapping in brackets',
      mathml: `
<root>
<math>
  <msubsup>
    <mo> &#x222B; </mo>
    <mn> 0 </mn>
    <mn> 1 </mn>
  </msubsup>
</math>
</root>
`,
      latex: '\\int_{0}^{1}',
    },
    {
      name: 'wraps base inside parentheses when there are empty spaces on it',
      mathml: `
<root>
<math>
  <msubsup>
    <mrow>
      <mn>x</mn>
      <mo>+</mo>
      <mn>y</mn>
    </mrow>
    <mn> 0 </mn>
    <mn> 1 </mn>
  </msubsup>
</math>
</root>
`,
      latex: '\\left(x + y\\right)_{0}^{1}',
    },
  ])('$name', ({ mathml, latex }) => {
    expect(MathMLToLaTeX.convert(mathml)).toBe(latex);
  });

  it('throws InvalidNumberOfChildrenError', () => {
    const mathml = `
<root>
<math>
  <msubsup>
    <mo> &#x222B; </mo>
    <mn> 0 </mn>
    <mn> 1 </mn>
    <mn> 5 </mn>
  </msubsup>
</math>
</root>
`;
    expect(() => MathMLToLaTeX.convert(mathml)).toThrow(new InvalidNumberOfChildrenError('msubsup', 3, 4));
  });
});
