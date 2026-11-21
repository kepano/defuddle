import { describe, it, expect } from 'vitest';
import { MathMLToLaTeX } from './shim';

describe('mfenced (integration)', () => {
  it.each([
    {
      name: 'converts mfenced wrapping it content in dots',
      mathml: `
<root>
<math>
<mfenced>
  <mn>3</mn>
</mfenced>
</math>
</root>
`,
      latex: '\\left(3\\right)',
    },
    {
      name: 'converts mfenced wrapping it content between bracket and parenthesis',
      mathml: `
<root>
<math>
<mfenced open="{">
  <mn>3</mn>
</mfenced>
</math>
</root>
`,
      latex: '\\left\\{3\\right)',
    },
    {
      name: 'converts mfenced wrapping it content between parenthesis',
      mathml: `
<root>
<math>
<mfenced open="(" close=")">
  <mn>3</mn>
</mfenced>
</math>
</root>
`,
      latex: '\\left(3\\right)',
    },
    {
      name: 'converts mfenced wrapping it content between bracket and parenthesis',
      mathml: `
<root>
<math>
<mfenced open="{" close>
  <mn>3</mn>
</mfenced>
</math>
</root>
`,
      latex: '\\left\\{3\\right)',
    },
    {
      name: 'escapes brace fences to valid \\left\\{ ... \\right\\} delimiters (issue #66)',
      mathml: `
<root>
<math>
<mfenced open="{" close="}">
  <mn>3</mn>
</mfenced>
</math>
</root>
`,
      latex: '\\left\\{3\\right\\}',
    },
    {
      name: 'converts mfenced wrapping it content inside parenthesis and joining using commas',
      mathml: `
<root>
<math>
<mfenced>
  <mn>3</mn>
  <mn>2</mn>
  <mn>1</mn>
</mfenced>
</math>
</root>
`,
      latex: '\\left(3,2,1\\right)',
    },
    {
      name: 'converts mfenced wrapping it content inside parentheses and joining using commas',
      mathml: `
<root>
<math>
<mfenced>
  <mn>3</mn>
  <mn>2</mn>
  <mn>1</mn>
  <mn>7</mn>
</mfenced>
</math>
</root>
`,
      latex: '\\left(3,2,1,7\\right)',
    },
    {
      name: "parse mfenced wrapping it content inside parentheses and joining using ';'",
      mathml: `
<root>
<math>
<mfenced separators=';;;'>
  <mn>3</mn>
  <mn>2</mn>
  <mn>1</mn>
</mfenced>
</math>
</root>
`,
      latex: '\\left(3;2;1\\right)',
    },
    {
      name: "converts mfenced wrapping it content inside parentheses and joining using ';' for the first, '.' for the second and on",
      mathml: `
<root>
<math>
<mfenced separators=';.'>
  <mn>3</mn>
  <mn>2</mn>
  <mn>1</mn>
  <mn>7</mn>
</mfenced>
</math>
</root>
`,
      latex: '\\left(3;2.1.7\\right)',
    },
    {
      name: 'converts mfenced wrapping it content inside parentheses and joining using empty string',
      mathml: `
<root>
<math>
<mfenced separators=''>
  <mn>3</mn>
  <mn>2</mn>
  <mn>1</mn>
  <mn>7</mn>
</mfenced>
</math>
</root>
`,
      latex: '\\left(3217\\right)',
    },
    {
      name: 'should not add comma to pmatrix based on mfenced',
      mathml: `
<math xmlns="http://www.w3.org/1998/Math/MathML">
<mfenced open="(" close=")" separators="">
  <mtable>
    <mtr>
      <mtd><msub><mi>x</mi><mn>1</mn></msub></mtd>
      <mtd><mi>A</mi></mtd>
    </mtr>
    <mtr>
      <mtd><msub><mi>x</mi><mn>2</mn></msub></mtd>
      <mtd><mi>B</mi></mtd>
    </mtr>
  </mtable>
</mfenced>
</math>
`,
      latex: '\\begin{pmatrix} x_{1} & A \\\\ x_{2} & B \\end{pmatrix}',
    },
    {
      name: 'should not add comma to linear system based on mfenced',
      mathml: `
<math xmlns="http://www.w3.org/1998/Math/MathML" display="block">
<mrow data-mjx-texclass="INNER">
  <mo data-mjx-texclass="OPEN">{</mo>
  <mtable columnalign="left left" columnspacing="1em" rowspacing=".2em">
    <mtr>
      <mtd>
        <mi>x</mi>
        <mo>+</mo>
        <mi>y</mi>
        <mo>=</mo>
        <mn>1</mn>
      </mtd>
    </mtr>
    <mtr>
      <mtd>
        <mi>x</mi>
        <mo>−</mo>
        <mi>y</mi>
        <mo>=</mo>
        <mn>3</mn>
      </mtd>
    </mtr>
  </mtable>
  <mo data-mjx-texclass="CLOSE" fence="true" stretchy="true" symmetric="true"></mo>
</mrow>
</math>
`,
      latex: '\\begin{cases} x + y = 1 \\\\ x - y = 3 \\end{cases}',
    },
    {
      name: 'returns a bmatrix representation in latex',
      mathml: `
<root>
<math xmlns = "http://www.w3.org/1998/Math/MathML">
  <mrow>
    <mi>A</mi>
    <mo>=</mo>
    <mfenced open = "[" close="]">
      <mtable>
        <mtr>
          <mtd><mi>x</mi></mtd>
          <mtd><mi>y</mi></mtd>
        </mtr>
        <mtr>
          <mtd><mi>z</mi></mtd>
          <mtd><mi>w</mi></mtd>
        </mtr>
      </mtable>
    </mfenced>
  </mrow>
</math>
</root>
`,
      latex: 'A = \\begin{bmatrix}\n x & y \\\\\n z & w \n\\end{bmatrix}'.replace(/\n/g, ''),
    },
    {
      name: 'returns a pmatrix representation in latex',
      mathml: `
<root>
<math xmlns = "http://www.w3.org/1998/Math/MathML">
  <mrow>
    <mi>A</mi>
    <mo>=</mo>
    <mfenced open = "(" close=")">
      <mtable>
        <mtr>
          <mtd><mi>x</mi></mtd>
          <mtd><mi>y</mi></mtd>
        </mtr>
        <mtr>
          <mtd><mi>z</mi></mtd>
          <mtd><mi>w</mi></mtd>
        </mtr>
      </mtable>
    </mfenced>
  </mrow>
</math>
</root>
`,
      latex: 'A = \\begin{pmatrix}\n x & y \\\\\n z & w \n\\end{pmatrix}'.replace(/\n/g, ''),
    },
    {
      name: 'returns a vmatrix representation in latex',
      mathml: `
<root>
<math xmlns = "http://www.w3.org/1998/Math/MathML">
  <mrow>
    <mi>A</mi>
    <mo>=</mo>
    <mfenced open = "|" close="|">
      <mtable>
        <mtr>
          <mtd><mi>x</mi></mtd>
          <mtd><mi>y</mi></mtd>
        </mtr>
        <mtr>
          <mtd><mi>z</mi></mtd>
          <mtd><mi>w</mi></mtd>
        </mtr>
      </mtable>
    </mfenced>
  </mrow>
</math>
</root>
`,
      latex: 'A = \\begin{vmatrix}\n x & y \\\\\n z & w \n\\end{vmatrix}'.replace(/\n/g, ''),
    },
    {
      name: 'returns a Bmatrix representation in latex',
      mathml: `
<root>
<math xmlns = "http://www.w3.org/1998/Math/MathML">
  <mrow>
    <mi>A</mi>
    <mo>=</mo>
    <mfenced open = "{" close="}">
      <mtable>
        <mtr>
          <mtd><mi>x</mi></mtd>
          <mtd><mi>y</mi></mtd>
        </mtr>
        <mtr>
          <mtd><mi>z</mi></mtd>
          <mtd><mi>w</mi></mtd>
        </mtr>
      </mtable>
    </mfenced>
  </mrow>
</math>
</root>
`,
      latex: 'A = \\begin{Bmatrix}\n x & y \\\\\n z & w \n\\end{Bmatrix}'.replace(/\n/g, ''),
    },
    {
      name: 'returns a Vmatrix representation in latex',
      mathml: `
<root>
<math xmlns = "http://www.w3.org/1998/Math/MathML">
  <mrow>
    <mi>A</mi>
    <mo>=</mo>
    <mfenced open = "||" close="||">
      <mtable>
        <mtr>
          <mtd><mi>x</mi></mtd>
          <mtd><mi>y</mi></mtd>
        </mtr>
        <mtr>
          <mtd><mi>z</mi></mtd>
          <mtd><mi>w</mi></mtd>
        </mtr>
      </mtable>
    </mfenced>
  </mrow>
</math>
</root>
`,
      latex: 'A = \\begin{Vmatrix}\n x & y \\\\\n z & w \n\\end{Vmatrix}'.replace(/\n/g, ''),
    },
    {
      name: 'returns a matrix representation in latex',
      mathml: `
<root>
<math xmlns = "http://www.w3.org/1998/Math/MathML">
  <mrow>
    <mi>A</mi>
    <mo>=</mo>
    <mfenced>
      <mtable>
        <mtr>
          <mtd><mi>x</mi></mtd>
          <mtd><mi>y</mi></mtd>
        </mtr>
        <mtr>
          <mtd><mi>z</mi></mtd>
          <mtd><mi>w</mi></mtd>
        </mtr>
      </mtable>
    </mfenced>
  </mrow>
</math>
</root>
`,
      latex: 'A = \\begin{bmatrix}\n x & y \\\\\n z & w \n\\end{bmatrix}'.replace(/\n/g, ''),
    },
  ])('$name', ({ mathml, latex }) => {
    expect(MathMLToLaTeX.convert(mathml)).toBe(latex);
  });

  it.each([
    { name: 'curly fences as a Bmatrix', open: '{', close: '}', env: 'Bmatrix' },
    { name: 'pipe fences as a vmatrix', open: '|', close: '|', env: 'vmatrix' },
    { name: 'double-pipe fences as a Vmatrix', open: '||', close: '||', env: 'Vmatrix' },
  ])('renders an mtable with $name', ({ open, close, env }) => {
    const mathml = `<math><mfenced open="${open}" close="${close}"><mtable><mtr><mtd><mn>1</mn></mtd><mtd><mn>2</mn></mtd></mtr><mtr><mtd><mn>3</mn></mtd><mtd><mn>4</mn></mtd></mtr></mtable></mfenced></math>`;
    expect(MathMLToLaTeX.convert(mathml)).toBe(`\\begin{${env}} 1 & 2 \\\\ 3 & 4 \\end{${env}}`);
  });

  it('renders an mtable with mismatched fences as a wrapped generic matrix', () => {
    const mathml = `<math><mfenced open="[" close="}"><mtable><mtr><mtd><mn>1</mn></mtd><mtd><mn>2</mn></mtd></mtr><mtr><mtd><mn>3</mn></mtd><mtd><mn>4</mn></mtd></mtr></mtable></mfenced></math>`;
    expect(MathMLToLaTeX.convert(mathml)).toBe('\\left[\\begin{matrix} 1 & 2 \\\\ 3 & 4 \\end{matrix}\\right\\}');
  });
});
