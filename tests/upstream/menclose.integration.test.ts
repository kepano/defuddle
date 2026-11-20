import { describe, it, expect } from 'vitest';
import { MathMLToLaTeX } from './shim';

describe('menclose (integration)', () => {
  it.each([
    {
      name: 'converts menclose tag just joining its content inside long division latex equivalent commands',
      mathml: `
<root>
<math>
  <menclose>
    <mi>a</mi>
    <mo>+</mo>
    <mi>2</mi>
  </menclose>
</math>
</root>
`,
      latex: '\\overline{\\left.\\right)a + 2}',
    },
    {
      name: 'converts menclose tag just joining its content inside long division latex equivalent commands',
      mathml: `
<root>
<math>
  <menclose notation="longdiv">
    <mi>a</mi>
    <mo>+</mo>
    <mi>2</mi>
  </menclose>
</math>
</root>
`,
      latex: '\\overline{\\left.\\right)a + 2}',
    },
    {
      name: 'converts menclose tag just joining its content inside actuarial latex equivalent commands',
      mathml: `
<root>
<math>
  <menclose notation="actuarial">
    <mi>a</mi>
    <mo>+</mo>
    <mi>2</mi>
  </menclose>
</math>
</root>
`,
      latex: '\\overline{\\left.a + 2\\right|}',
    },
    {
      name: 'converts menclose tag just joining its content inside actuarial latex equivalent commands',
      mathml: `
<root>
<math>
  <menclose notation="radical">
    <mi>a</mi>
    <mo>+</mo>
    <mi>2</mi>
  </menclose>
</math>
</root>
`,
      latex: '\\sqrt{a + 2}',
    },
    {
      name: 'converts menclose tag just joining its content inside boxed command',
      mathml: `
<root>
<math>
  <menclose notation="box">
    <mrow>
      <mi>E</mi>
      <mo>=</mo>
      <mi>m</mi>
      <msup>
        <mi>c</mi>
        <mn>2</mn>
      </msup>
    </mrow>
  </menclose>
</math>
</root>
`,
      latex: '\\boxed{E = m c^{2}}',
    },
    {
      name: 'converts menclose tag just joining its content inside boxed command',
      mathml: `
<root>
<math>
  <menclose notation="roundedbox">
    <mrow>
      <mi>E</mi>
      <mo>=</mo>
      <mi>m</mi>
      <msup>
        <mi>c</mi>
        <mn>2</mn>
      </msup>
    </mrow>
  </menclose>
</math>
</root>
`,
      latex: '\\boxed{E = m c^{2}}',
    },
    {
      name: 'converts menclose tag just joining its content inside boxed command',
      mathml: `
<root>
<math>
  <menclose notation="circle">
    <mrow>
      <mi>E</mi>
      <mo>=</mo>
      <mi>m</mi>
      <msup>
        <mi>c</mi>
        <mn>2</mn>
      </msup>
    </mrow>
  </menclose>
</math>
</root>
`,
      latex: '\\boxed{E = m c^{2}}',
    },
    {
      name: 'converts menclose tag just joining its content with left bar',
      mathml: `
<root>
<math>
  <menclose notation="left">
    <mrow>
      <mi>E</mi>
      <mo>=</mo>
      <mi>m</mi>
      <msup>
        <mi>c</mi>
        <mn>2</mn>
      </msup>
    </mrow>
  </menclose>
</math>
</root>
`,
      latex: '\\left|E = m c^{2}',
    },
    {
      name: 'converts menclose tag just joining its content with right bar',
      mathml: `
<root>
<math>
  <menclose notation="right">
    <mrow>
      <mi>E</mi>
      <mo>=</mo>
      <mi>m</mi>
      <msup>
        <mi>c</mi>
        <mn>2</mn>
      </msup>
    </mrow>
  </menclose>
</math>
</root>
`,
      latex: 'E = m c^{2}\\right|',
    },
    {
      name: 'converts menclose tag just joining its content with overline command',
      mathml: `
<root>
<math>
  <menclose notation="top">
    <mrow>
      <mi>E</mi>
      <mo>=</mo>
      <mi>m</mi>
      <msup>
        <mi>c</mi>
        <mn>2</mn>
      </msup>
    </mrow>
  </menclose>
</math>
</root>
`,
      latex: '\\overline{E = m c^{2}}',
    },
    {
      name: 'converts menclose tag just joining its content with underline command',
      mathml: `
<root>
<math>
  <menclose notation="bottom">
    <mi>a</mi>
    <mo>+</mo>
    <mi>2</mi>
  </menclose>
</math>
</root>
`,
      latex: '\\underline{a + 2}',
    },
    {
      name: 'converts menclose tag just joining its content with left bottom to right top cross',
      mathml: `
<root>
<math>
  <menclose notation="updiagonalstrike">
    <mi>a</mi>
    <mo>+</mo>
    <mi>2</mi>
  </menclose>
</math>
</root>
`,
      latex: '\\cancel{a + 2}',
    },
    {
      name: 'converts menclose tag just joining its content with left top to right bottom cross',
      mathml: `
<root>
<math>
  <menclose notation="downdiagonalstrike">
    <mi>a</mi>
    <mo>+</mo>
    <mi>2</mi>
  </menclose>
</math>
</root>
`,
      latex: '\\bcancel{a + 2}',
    },
    {
      name: 'converts menclose tag just joining its content with horizontal cross',
      mathml: `
<root>
<math>
  <menclose notation="horizontalstrike">
    <mi>a</mi>
    <mo>+</mo>
    <mi>2</mi>
  </menclose>
</math>
</root>
`,
      latex: '\\hcancel{a + 2}',
    },
    {
      name: 'converts menclose tag just joining its content with horizontal cross',
      mathml: `
<root>
<math>
  <menclose notation="verticalstrike">
    <mi>a</mi>
    <mo>+</mo>
    <mi>2</mi>
  </menclose>
</math>
</root>
`,
      latex: '\\hcancel{a + 2}',
    },
    {
      name: 'converts menclose tag just joining its content with underline and right bar',
      mathml: `
<root>
<math>
  <menclose notation="updiagonalarrow">
    <mi>a</mi>
    <mo>+</mo>
    <mi>2</mi>
  </menclose>
</math>
</root>
`,
      latex: '\\cancelto{}{a + 2}',
    },
    {
      name: 'converts menclose tag just joining its content with underline and right bar',
      mathml: `
<root>
<math>
  <menclose notation="madruwb">
    <mi>a</mi>
    <mo>+</mo>
    <mi>2</mi>
  </menclose>
</math>
</root>
`,
      latex: '\\underline{a + 2\\right|}',
    },
    {
      name: 'converts menclose tag just joining its content with underline and right bar',
      mathml: `
<root>
<math>
  <menclose notation="phasorangle">
    <mi>a</mi>
    <mo>+</mo>
    <mi>2</mi>
  </menclose>
</math>
</root>
`,
      latex: '{\\angle \\underline{a + 2}}',
    },
  ])('$name', ({ mathml, latex }) => {
    expect(MathMLToLaTeX.convert(mathml)).toBe(latex);
  });
});
