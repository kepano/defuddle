import { describe, it, expect } from 'vitest';
import { MathMLToLaTeX } from './shim';
import { InvalidNumberOfChildrenError } from './shim';

describe('msub (integration)', () => {
  it.each([
    {
      name: 'converts msub joining its two char contents with _ and wrap subscript in brackets',
      mathml: `
<root>
<math>
  <msub>
    <mi>x</mi>
    <mn>2</mn>
  </msub>
</math>
</root>
`,
      latex: 'x_{2}',
    },
    {
      name: 'converts msub joining its two char contents with _ and wrap exponent in brackets',
      mathml: `
<root>
<math>
  <msub>
    <mi>x</mi>
    <mrow>
      <mn>a</mn>
      <mo>+</mo>
      <mn>b</mn>
    </mrow>
  </msub>
</math>
</root>
`,
      latex: 'x_{a + b}',
    },
    {
      name: 'converts msub joining its multi char contents with _ and wrap base in parenthesis',
      mathml: `
<root>
<math>
  <msub>
    <mrow>
      <mn>x</mn>
      <mo>+</mo>
      <mn>y</mn>
    </mrow>
    <mi>2</mi>
  </msub>
</math>
</root>
`,
      latex: '\\left(x + y\\right)_{2}',
    },
    {
      name: 'converts msub joining its multi char contents with _, wrap base in parenthesis and subscript in brackets',
      mathml: `
<root>
<math>
  <msub>
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
  </msub>
</math>
</root>
`,
      latex: '\\left(x + y\\right)_{2 + 2}',
    },
  ])('$name', ({ mathml, latex }) => {
    expect(MathMLToLaTeX.convert(mathml)).toBe(latex);
  });

  it('throws InvalidNumberOfChildrenError', () => {
    const mathml = `
<root>
<math>
  <msub>
    <mi>x</mi>
    <mn>2</mn>
    <mn>3</mn>
  </msub>
</math>
</root>
`;
    expect(() => MathMLToLaTeX.convert(mathml)).toThrow(new InvalidNumberOfChildrenError('msub', 2, 3));
  });
});
