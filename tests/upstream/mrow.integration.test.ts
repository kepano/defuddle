import { describe, it, expect } from 'vitest';
import { MathMLToLaTeX } from './shim';

describe('mrow (integration)', () => {
  it('wraps its content', () => {
    const mathml = `
<root>
<math>
  <mrow>
    <mn>2</mn>
    <mo>+</mo>
    <mn>2</mn>
  </mrow>
</math>
</root>
`;
    expect(MathMLToLaTeX.convert(mathml)).toBe('2 + 2');
  });

  it('converts the MathJax piecewise shape (brace + table, no closing operator) to cases', () => {
    const mathml = `
<math>
  <mrow>
    <mo>{</mo>
    <mtable>
      <mtr><mtd><mi>x</mi></mtd></mtr>
      <mtr><mtd><mi>y</mi></mtd></mtr>
    </mtable>
  </mrow>
</math>
`;
    expect(MathMLToLaTeX.convert(mathml)).toBe('\\begin{cases} x \\\\ y \\end{cases}');
  });
});
