import { describe, it, expect } from 'vitest';
import { MathMLToLaTeX } from './shim';

describe('mtable (integration)', () => {
  it('wraps a bare table in a matrix environment (issue #74)', () => {
    const mathml = `
<math>
  <mtable>
    <mtr>
      <mtd><mn>1</mn></mtd>
      <mtd><mn>2</mn></mtd>
    </mtr>
    <mtr>
      <mtd><mn>3</mn></mtd>
      <mtd><mn>4</mn></mtd>
    </mtr>
  </mtable>
</math>
`;
    expect(MathMLToLaTeX.convert(mathml)).toBe('\\begin{matrix}1 & 2 \\\\ 3 & 4\\end{matrix}');
  });

  it('wraps a nested mtable in a matrix environment', () => {
    const mathml = `
<math>
  <mtable>
    <mtr>
      <mtd>
        <mtable>
          <mtr><mtd><mn>1</mn></mtd></mtr>
        </mtable>
      </mtd>
    </mtr>
  </mtable>
</math>
`;
    expect(MathMLToLaTeX.convert(mathml)).toBe('\\begin{matrix}\\begin{matrix}1\\end{matrix}\\end{matrix}');
  });

  it('wraps a bare table declaring right/left column alignment in an aligned environment', () => {
    const mathml = `
<math display="block">
  <mtable columnalign="right left">
    <mtr>
      <mtd><msub><mi>a</mi><mn>1</mn></msub></mtd>
      <mtd><mo>=</mo><mi>b</mi></mtd>
    </mtr>
    <mtr>
      <mtd><msub><mi>a</mi><mn>2</mn></msub></mtd>
      <mtd><mo>=</mo><mi>c</mi></mtd>
    </mtr>
  </mtable>
</math>
`;
    expect(MathMLToLaTeX.convert(mathml)).toBe('\\begin{aligned}a_{1} & = b \\\\ a_{2} & = c\\end{aligned}');
  });

  it('keeps a bare table without columnalign on matrix, even when rows start with relations', () => {
    const mathml = `
<math>
  <mtable>
    <mtr>
      <mtd><mi>x</mi></mtd>
      <mtd><mo>=</mo><mn>1</mn></mtd>
    </mtr>
    <mtr>
      <mtd><mi>y</mi></mtd>
      <mtd><mo>&#x2264;</mo><mn>2</mn></mtd>
    </mtr>
  </mtable>
</math>
`;
    expect(MathMLToLaTeX.convert(mathml)).toBe('\\begin{matrix}x & = 1 \\\\ y & \\leq 2\\end{matrix}');
  });

  it('wraps an orphan mtr (no mtable ancestor) in a matrix environment', () => {
    const mathml = `
<math>
  <mrow>
    <mi>y</mi>
    <mtr>
      <mtd><mi>a</mi></mtd>
      <mtd><mi>b</mi></mtd>
    </mtr>
  </mrow>
</math>
`;
    expect(MathMLToLaTeX.convert(mathml)).toBe('y \\begin{matrix}a & b\\end{matrix}');
  });

  it('keeps a fenced table on its matrix environment without double wrapping', () => {
    const mathml = `
<math>
  <mo>(</mo>
  <mtable>
    <mtr>
      <mtd><mn>1</mn></mtd>
      <mtd><mn>2</mn></mtd>
    </mtr>
  </mtable>
  <mo>)</mo>
</math>
`;
    expect(MathMLToLaTeX.convert(mathml)).toBe('\\begin{pmatrix} 1 & 2 \\end{pmatrix}');
  });
});
