import { describe, it, expect } from 'vitest';
import { MathMLToLaTeX } from './shim';
import { InvalidNumberOfChildrenError } from './shim';

describe('msup (integration)', () => {
  it.each([
    {
      name: 'converts msup joining its two char contents with ^ and wrap exponent in brackets',
      mathml: `
<root>
<math>
  <msup>
    <mi>x</mi>
    <mn>2</mn>
  </msup>
</math>
</root>
`,
      latex: 'x^{2}',
    },
    {
      name: 'converts msup joining its two char contents with ^ and wrap exponent in brackets',
      mathml: `
<root>
<math>
  <msup>
    <mi>x</mi>
    <mrow>
      <mn>a</mn>
      <mo>+</mo>
      <mn>b</mn>
    </mrow>
  </msup>
</math>
</root>
`,
      latex: 'x^{a + b}',
    },
    {
      name: 'converts msup joining its multi char contents with ^ and wrap base in parenthesis',
      mathml: `
<root>
<math>
  <msup>
    <mrow>
      <mn>x</mn>
      <mo>+</mo>
      <mn>y</mn>
    </mrow>
    <mi>2</mi>
  </msup>
</math>
</root>
`,
      latex: '\\left(x + y\\right)^{2}',
    },
    {
      name: 'converts msup joining its multi char contents with ^, wrap base in parenthesis and exponent in brackets',
      mathml: `
<root>
<math>
  <msup>
    <mrow>
      <mn>x</mn>
      <mo>+</mo>
      <mn>y</mn>
    </mrow>
    <mrow>
      <mn>2</mn>
      <mo>+</mo>
      <mn>2</mn>
    </mrow>
  </msup>
</math>
</root>
`,
      latex: '\\left(x + y\\right)^{2 + 2}',
    },
  ])('$name', ({ mathml, latex }) => {
    expect(MathMLToLaTeX.convert(mathml)).toBe(latex);
  });

  it('throws InvalidNumberOfChildrenError', () => {
    const mathml = `
<root>
<math>
  <msup>
    <mi>x</mi>
    <mn>2</mn>
    <mn>3</mn>
  </msup>
</math>
</root>
`;
    expect(() => MathMLToLaTeX.convert(mathml)).toThrow(new InvalidNumberOfChildrenError('msup', 2, 3));
  });
});
