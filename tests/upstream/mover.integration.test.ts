import { describe, it, expect } from 'vitest';
import { MathMLToLaTeX } from './shim';
import { InvalidNumberOfChildrenError } from './shim';

describe('mover (integration)', () => {
  it.each([
    {
      name: 'wrap it content inside overbrace command',
      mathml: `
<root>
<math>
  <mover accent="true">
    <mrow>
      <mi> x </mi>
      <mo> + </mo>
      <mi> y </mi>
      <mo> + </mo>
      <mi> z </mi>
    </mrow>
    <mo>⏞</mo>
  </mover>
</math>
</root>
`,
      latex: '\\overbrace{x + y + z}',
    },
    {
      name: 'wrap it content inside hat command',
      mathml: `
<root>
<math>
  <mover accent="true">
    <mrow>
      <mi> x </mi>
      <mo> + </mo>
      <mi> y </mi>
      <mo> + </mo>
      <mi> z </mi>
    </mrow>
    <mo>^</mo>
  </mover>
</math>
</root>
`,
      latex: '\\hat{x + y + z}',
    },
    {
      name: 'wrap it content inside hat command',
      mathml: `
<root>
<math>
  <mover accent="true">
    <mrow>
      <mi> x </mi>
      <mo> + </mo>
      <mi> y </mi>
      <mo> + </mo>
      <mi> z </mi>
    </mrow>
    <mo>&#x2C6;</mo>
  </mover>
</math>
</root>
`,
      latex: '\\hat{x + y + z}',
    },
    {
      name: 'wrap it content inside overset making generic char on top',
      mathml: `
<root>
<math>
  <mover accent="true">
    <mrow>
      <mi> x </mi>
      <mo> + </mo>
      <mi> y </mi>
      <mo> + </mo>
      <mi> z </mi>
    </mrow>
    <mrow>
      <mi> a </mi>
      <mo> + </mo>
      <mi> b </mi>
    </mrow>
  </mover>
</math>
</root>
`,
      latex: '\\overset{a + b}{x + y + z}',
    },
  ])('$name', ({ mathml, latex }) => {
    expect(MathMLToLaTeX.convert(mathml)).toBe(latex);
  });

  it('throws InvalidNumberOfChildrenError', () => {
    const mathml = `
<root>
<math>
  <mover accent="true">
    <mrow>
      <mi> x </mi>
      <mo> + </mo>
      <mi> y </mi>
      <mo> + </mo>
      <mi> z </mi>
    </mrow>
    <mo> + </mo>
    <mi> z </mi>
  </mover>
</math>
</root>
`;
    expect(() => MathMLToLaTeX.convert(mathml)).toThrow(new InvalidNumberOfChildrenError('mover', 2, 3));
  });
});
