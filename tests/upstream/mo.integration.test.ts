import { describe, it, expect } from 'vitest';
import { MathMLToLaTeX } from './shim';

describe('mo (integration)', () => {
  it.each([
    {
      name: 'a simple operator as a string',
      mathml: `
<root>
<math>
  <mo>+</mo>
</math>
</root>
`,
      latex: '+',
    },
    {
      name: 'a divider, preserving it',
      mathml: `
<math>
<mi>x</mi>
<mo>=</mo>
<mn>4</mn>
<mrow>
  <mo>/</mo>
</mrow>
<mn>5</mn>
</math>
`,
      latex: 'x = 4 / 5',
    },
    {
      name: 'a glyph operator as a LaTeX command',
      mathml: `
<root>
<math>
  <mo>*</mo>
</math>
</root>
`,
      latex: '\\star',
    },
    {
      name: 'a char operator',
      mathml: `
<root>
<math>
  <mo>b</mo>
</math>
</root>
`,
      latex: 'b',
    },
    {
      name: 'a char operator command, spacing it from the next tag',
      mathml: `
<root>
<math xmlns="http://www.w3.org/1998/Math/MathML">
  <mstyle displaystyle="true">
    <mi>a</mi>
    <mo>&#x21D2;</mo>
    <mi>b</mi>
  </mstyle>
</math>
</root>
`,
      latex: 'a \\Rightarrow b',
    },
    {
      name: 'an opening brace operator into an escaped delimiter (issue #66)',
      mathml: `
<root>
<math>
  <mo>{</mo>
</math>
</root>
`,
      latex: '\\left\\{\\right.',
    },
    {
      name: 'a closing brace operator into an escaped delimiter (issue #66)',
      mathml: `
<root>
<math>
  <mo>}</mo>
</math>
</root>
`,
      latex: '\\left.\\right\\}',
    },
  ])('converts $name', ({ mathml, latex }) => {
    expect(MathMLToLaTeX.convert(mathml)).toBe(latex);
  });
});
