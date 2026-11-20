import { describe, it, expect } from 'vitest';
import { MathMLToLaTeX } from './shim';

describe('normalize-fences (integration)', () => {
  it.each([
    {
      name: 'bare parentheses collapse to a single stretchy pair',
      mathml: '<math><mrow><mo>(</mo><mi>x</mi><mo>+</mo><mi>y</mi><mo>)</mo></mrow></math>',
      latex: '\\left(x + y\\right)',
    },
    {
      name: 'bare square brackets',
      mathml: '<math><mrow><mo>[</mo><mi>x</mi><mo>]</mo></mrow></math>',
      latex: '\\left[x\\right]',
    },
    {
      name: 'bare braces (valid escaped delimiters)',
      mathml: '<math><mrow><mo>{</mo><mi>x</mi><mo>}</mo></mrow></math>',
      latex: '\\left\\{x\\right\\}',
    },
    {
      name: 'mixed delimiters (half-open interval)',
      mathml: '<math><mrow><mo>(</mo><mi>a</mi><mo>,</mo><mi>b</mi><mo>]</mo></mrow></math>',
      latex: '\\left(a , b\\right]',
    },
    {
      name: 'nested pairs',
      mathml: '<math><mrow><mo>(</mo><mo>[</mo><mi>a</mi><mo>]</mo><mo>)</mo></mrow></math>',
      latex: '\\left(\\left[a\\right]\\right)',
    },
    {
      name: 'an unmatched opener stays self-balanced',
      mathml: '<math><mrow><mo>(</mo><mi>a</mi></mrow></math>',
      latex: '\\left(\\right. a',
    },
    {
      name: 'a matched vertical bar pair (absolute value)',
      mathml: '<math><mrow><mo>|</mo><mi>x</mi><mo>|</mo></mrow></math>',
      latex: '\\left|x\\right|',
    },
    {
      name: 'consecutive bar pairs do not cross',
      mathml: '<math><mrow><mo>|</mo><mi>a</mi><mo>|</mo><mo>+</mo><mo>|</mo><mi>b</mi><mo>|</mo></mrow></math>',
      latex: '\\left|a\\right| + \\left|b\\right|',
    },
    {
      name: 'a bar pair around a table becomes a vmatrix (determinant)',
      mathml: `
<math>
  <mrow>
    <mo>|</mo>
    <mtable>
      <mtr><mtd><mn>1</mn></mtd><mtd><mn>2</mn></mtd></mtr>
      <mtr><mtd><mn>3</mn></mtd><mtd><mn>4</mn></mtd></mtr>
    </mtable>
    <mo>|</mo>
  </mrow>
</math>
`,
      latex: '\\begin{vmatrix} 1 & 2 \\\\ 3 & 4 \\end{vmatrix}',
    },
    {
      name: 'an odd vertical bar stays self-balanced',
      mathml: '<math><mrow><mo>(</mo><mi>a</mi><mo>)</mo><mo>|</mo><mi>b</mi></mrow></math>',
      latex: '\\left(a\\right) \\left|\\right. b',
    },
    {
      name: 'a matched double bar pair (norm) renders with \\| delimiters',
      mathml: '<math><mrow><mo>||</mo><mi>a</mi><mo>||</mo></mrow></math>',
      latex: '\\left\\|a\\right\\|',
    },
    {
      name: 'a double bar pair around a table becomes a Vmatrix',
      mathml: `
<math>
  <mrow>
    <mo>||</mo>
    <mtable>
      <mtr><mtd><mn>1</mn></mtd><mtd><mn>2</mn></mtd></mtr>
      <mtr><mtd><mn>3</mn></mtd><mtd><mn>4</mn></mtd></mtr>
    </mtable>
    <mo>||</mo>
  </mrow>
</math>
`,
      latex: '\\begin{Vmatrix} 1 & 2 \\\\ 3 & 4 \\end{Vmatrix}',
    },
    {
      name: 'an unmatched double bar stays a valid self-balanced norm delimiter',
      mathml: '<math><mrow><mo>(</mo><mi>a</mi><mo>)</mo><mo>||</mo><mi>b</mi></mrow></math>',
      latex: '\\left(a\\right) \\left\\|\\right. b',
    },
    {
      name: 'a parallel-to glyph pair (norm, issue #43) renders with \\| delimiters',
      mathml: '<math><mrow><mo>∥</mo><mi>P</mi><mo>∥</mo></mrow></math>',
      latex: '\\left\\|P\\right\\|',
    },
    {
      name: 'a double-vertical-line glyph pair renders with \\| delimiters',
      mathml: '<math><mrow><mo>‖</mo><mi>P</mi><mo>‖</mo></mrow></math>',
      latex: '\\left\\|P\\right\\|',
    },
    {
      name: 'a lone parallel-to glyph keeps its relational meaning',
      mathml: '<math><mrow><mi>a</mi><mo>∥</mo><mi>b</mi></mrow></math>',
      latex: 'a \\parallel b',
    },
    {
      name: 'a lone double-vertical-line glyph keeps its standalone meaning',
      mathml: '<math><mrow><mi>a</mi><mo>‖</mo><mi>b</mi></mrow></math>',
      latex: 'a \\parallel b',
    },
    {
      name: 'a scripted norm closes through the script base (issue #43)',
      mathml: '<math><mo>∥</mo><mi>P</mi><msubsup><mrow><mo>∥</mo></mrow><mi>F</mi><mn>2</mn></msubsup></math>',
      latex: '\\left\\|P\\right\\|_{F}^{2}',
    },
    {
      name: 'a scripted norm with the double-vertical-line glyph closes through the script base',
      mathml: '<math><mo>‖</mo><mi>P</mi><msubsup><mrow><mo>‖</mo></mrow><mi>F</mi><mn>2</mn></msubsup></math>',
      latex: '\\left\\|P\\right\\|_{F}^{2}',
    },
    {
      name: 'two scripted norms do not cross-pair',
      mathml:
        '<math><mo>∥</mo><mi>P</mi><msubsup><mrow><mo>∥</mo></mrow><mi>F</mi><mn>2</mn></msubsup><mo>+</mo><mo>∥</mo><mi>Q</mi><msubsup><mrow><mo>∥</mo></mrow><mi>F</mi><mn>2</mn></msubsup></math>',
      latex: '\\left\\|P\\right\\|_{F}^{2} + \\left\\|Q\\right\\|_{F}^{2}',
    },
    {
      name: 'an evaluated-at bar closes through the msub base',
      mathml: '<math><mo>|</mo><mi>f</mi><msub><mrow><mo>|</mo></mrow><mi>a</mi></msub></math>',
      latex: '\\left|f\\right|_{a}',
    },
    {
      name: 'a scripted bar with no open frame stays untouched',
      mathml: '<math><msubsup><mrow><mo>∥</mo></mrow><mi>F</mi><mn>2</mn></msubsup></math>',
      latex: '\\parallel_{F}^{2}',
    },
    {
      name: 'a parallel-to glyph pair around a table becomes a Vmatrix',
      mathml: `
<math>
  <mrow>
    <mo>∥</mo>
    <mtable>
      <mtr><mtd><mn>1</mn></mtd><mtd><mn>2</mn></mtd></mtr>
      <mtr><mtd><mn>3</mn></mtd><mtd><mn>4</mn></mtd></mtr>
    </mtable>
    <mo>∥</mo>
  </mrow>
</math>
`,
      latex: '\\begin{Vmatrix} 1 & 2 \\\\ 3 & 4 \\end{Vmatrix}',
    },
    {
      // A single separator bar (divides, such-that, evaluated-at) never pairs,
      // so it stays exactly as it converts today.
      name: 'a lone separator bar stays untouched',
      mathml: '<math><mrow><mi>a</mi><mo>|</mo><mi>b</mi></mrow></math>',
      latex: 'a \\left|\\right. b',
    },
    {
      // Known limitation: an even count of separator bars in one row is paired
      // positionally (toggle), so such-that-style "x | y | z" gets a bar pair
      // around y. It still renders as bars, matching pre-existing behavior.
      name: 'an even count of separator bars is paired (known limitation)',
      mathml: '<math><mrow><mi>x</mi><mo>|</mo><mi>y</mi><mo>|</mo><mi>z</mi></mrow></math>',
      latex: 'x \\left|y\\right| z',
    },
    {
      name: 'bare parentheses around a table become a pmatrix',
      mathml: `
<math>
  <mrow>
    <mo>(</mo>
    <mtable>
      <mtr><mtd><mn>1</mn></mtd><mtd><mn>2</mn></mtd></mtr>
      <mtr><mtd><mn>3</mn></mtd><mtd><mn>4</mn></mtd></mtr>
    </mtable>
    <mo>)</mo>
  </mrow>
</math>
`,
      latex: '\\begin{pmatrix} 1 & 2 \\\\ 3 & 4 \\end{pmatrix}',
    },
  ])('converts $name', ({ mathml, latex }) => {
    expect(MathMLToLaTeX.convert(mathml)).toBe(latex);
  });
});
