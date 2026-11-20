import { describe, it, expect } from 'vitest';
import { MathMLToLaTeX } from './shim';
import { InvalidNumberOfChildrenError } from './shim';

describe('mfrac (integration)', () => {
  it.each([
    {
      name: 'single-char contents',
      mathml: `
<root>
<math>
  <mfrac>
    <mi>x</mi>
    <mn>3</mn>
  </mfrac>
</math>
</root>
`,
      latex: '\\frac{x}{3}',
    },
    {
      name: 'multi-char contents',
      mathml: `
<root>
<math>
  <mfrac>
    <mrow>
      <mi>a</mi>
      <mo>+</mo>
      <mi>2</mi>
    </mrow>
    <mrow>
      <mi>b</mi>
      <mo>-</mo>
      <mi>3</mi>
    </mrow>
  </mfrac>
</math>
</root>
`,
      latex: '\\frac{a + 2}{b - 3}',
    },
    {
      name: 'a bevelled fraction (joined with /)',
      mathml: `
<root>
<math>
  <mfrac bevelled="true">
    <mn>1</mn>
    <mrow>
      <msup>
        <mi>x</mi>
        <mn>3</mn>
      </msup>
      <mo>+</mo>
      <mn>3</mn>
    </mrow>
  </mfrac>
</math>
</root>
`,
      latex: '1/\\left(x^{3} + 3\\right)',
    },
    {
      name: 'a bar-less fraction (linethickness="0pt")',
      mathml: `
<root>
<math>
  <mfrac linethickness="0pt">
    <mrow>
      <mi>n</mi>
    </mrow>
    <mrow>
      <mi>k</mi>
    </mrow>
  </mfrac>
</math>
</root>
`,
      latex: '\\genfrac{}{}{0pt}{}{n}{k}',
    },
    {
      name: 'a binomial coefficient (bar-less fraction wrapped in bare mo parentheses)',
      mathml: `
<root>
<math>
  <mrow>
    <mo>(</mo>
    <mfrac linethickness="0pt">
      <mrow>
        <mi>n</mi>
      </mrow>
      <mrow>
        <mi>k</mi>
      </mrow>
    </mfrac>
    <mo>)</mo>
  </mrow>
</math>
</root>
`,
      latex: '\\left(\\genfrac{}{}{0pt}{}{n}{k}\\right)',
    },
    {
      name: 'a binomial coefficient (bar-less fraction wrapped in mfenced for auto-sizing parentheses)',
      mathml: `
<root>
<math>
  <mfenced open="(" close=")">
    <mfrac linethickness="0pt">
      <mrow>
        <mi>n</mi>
      </mrow>
      <mrow>
        <mi>k</mi>
      </mrow>
    </mfrac>
  </mfenced>
</math>
</root>
`,
      latex: '\\left(\\genfrac{}{}{0pt}{}{n}{k}\\right)',
    },
  ])('converts $name', ({ mathml, latex }) => {
    expect(MathMLToLaTeX.convert(mathml)).toBe(latex);
  });

  it('throws when it does not have exactly two children', () => {
    const mathml = `
<root>
<math>
  <mfrac>
    <mi>x</mi>
    <mn>3</mn>
    <mi>2</mi>
  </mfrac>
</math>
</root>
`;
    expect(() => MathMLToLaTeX.convert(mathml)).toThrow(new InvalidNumberOfChildrenError('mfrac', 2, 3));
  });
});
