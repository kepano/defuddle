import { describe, it, expect } from 'vitest';
import { MathMLToLaTeX } from './shim';

describe('munder (integration)', () => {
  it.each([
    {
      name: 'wrap it content inside underbrace command',
      mathml: `
<root>
<math>
  <munder accent="true">
    <mrow>
      <mi> x </mi>
      <mo> + </mo>
      <mi> y </mi>
      <mo> + </mo>
      <mi> z </mi>
    </mrow>
    <mo>⏟</mo>
  </munder>
</math>
</root>
`,
      latex: '\\underbrace{x + y + z}',
    },
    {
      name: 'wrap it content inside underset making generic char on bottom',
      mathml: `
<root>
<math>
  <munder accent="true">
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
  </munder>
</math>
</root>
`,
      latex: '\\underset{a + b}{x + y + z}',
    },
    {
      name: 'parces wrapping it content inside underbrace command',
      mathml: `
<root>
<math>
  <munder accent="true">
    <mrow>
      <mi> x </mi>
      <mo> + </mo>
      <mi> y </mi>
      <mo> + </mo>
      <mi> z </mi>
    </mrow>
    <mo>&#x23DF;</mo>
  </munder>
</math>
</root>
`,
      latex: '\\underbrace{x + y + z}',
    },
  ])('$name', ({ mathml, latex }) => {
    expect(MathMLToLaTeX.convert(mathml)).toBe(latex);
  });
});
