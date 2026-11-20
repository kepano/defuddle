import { describe, it, expect } from 'vitest';
import { MathMLToLaTeX } from './shim';
import { InvalidNumberOfChildrenError } from './shim';

describe('munderover (integration)', () => {
  it.each([
    {
      name: 'handles it as it were a subsup tag',
      mathml: `
<root>
<math>
  <munderover>
    <mo> &#x222B;</mo>
    <mn> 0 </mn>
    <mn> 1 </mn>
  </munderover>
</math>
</root>
`,
      latex: '\\int_{0}^{1}',
    },
    {
      name: 'handles it as it were a subsup tag and convert special operator',
      mathml: `
<root>
<math>
  <munderover>
    <mo> &#x222B;</mo>
    <mn> 0 </mn>
    <mi> &#x221E; </mi>
  </munderover>
</math>
</root>
`,
      latex: '\\int_{0}^{\\infty}',
    },
  ])('$name', ({ mathml, latex }) => {
    expect(MathMLToLaTeX.convert(mathml)).toBe(latex);
  });

  it('throws InvalidNumberOfChildErrors', () => {
    const mathml = `
<root>
<math>
  <munderover>
    <mo> &#x222B;</mo>
    <mn> 0 </mn>
    <mi> &#x221E; </mi>
    <mi> 1 </mi>
  </munderover>
</math>
</root>
`;
    expect(() => MathMLToLaTeX.convert(mathml)).toThrow(new InvalidNumberOfChildrenError('munderover', 3, 4));
  });
});
