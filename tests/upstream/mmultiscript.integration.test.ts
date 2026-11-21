import { describe, it, expect } from 'vitest';
import { MathMLToLaTeX } from './shim';
import { InvalidNumberOfChildrenError } from './shim';

describe('mmultiscript (integration)', () => {
  it.each([
    {
      name: 'handles it as it were a subsup tag',
      mathml: `<math xmlns="http://www.w3.org/1998/Math/MathML" display="block">
<mmultiscripts>
<mrow>
  <mi>N</mi>
  <mi>a</mi>
</mrow>
<mrow>
  <mn>11</mn>
</mrow>
<mrow>
  <mi>+</mi>
</mrow>
</mmultiscripts>
</math>`,
      latex: '{N a}_{11}^{+}',
    },
    {
      name: 'handles it as it were a subsup tag',
      mathml: `<math xmlns="http://www.w3.org/1998/Math/MathML" display="block">
<mmultiscripts>
<mrow>
  <mi>N</mi>
  <mi>a</mi>
</mrow>
<mrow>
  <mn>11</mn>
</mrow>
<none/>
</mmultiscripts>
</math>`,
      latex: '{N a}_{11}',
    },
    {
      name: 'handles it as it were a subsup tag',
      mathml: `<math xmlns="http://www.w3.org/1998/Math/MathML" display="block">
<mmultiscripts>
<mrow>
  <mi>N</mi>
  <mi>a</mi>
</mrow>
<none/>
<mrow>
  <mn>+</mn>
</mrow>
</mmultiscripts>
</math>`,
      latex: '{N a}^{+}',
    },
    {
      name: 'adds prescript to latex subsup expression',
      mathml: `<math xmlns="http://www.w3.org/1998/Math/MathML" display="block">
<mmultiscripts>

<mi>X</mi>      <!-- base expression -->  

<mi>d</mi>      <!-- postsubscript -->
<mi>c</mi>      <!-- postsuperscript -->

<mprescripts />
<mi>b</mi>      <!-- presubscript -->
<mi>a</mi>      <!-- presuperscript -->

</mmultiscripts>
</math>`,
      latex: '{}_{b}^{a}X_{d}^{c}',
    },
    {
      name: 'adds prescript to latex subsup expression',
      mathml: `<math xmlns="http://www.w3.org/1998/Math/MathML" display="block">
<mmultiscripts>

<mi>X</mi>      <!-- base expression -->

<none />        <!-- postsubscript -->
<mi>c</mi>      <!-- postsuperscript -->

<mprescripts />
<mi>b</mi>      <!-- presubscript -->
<none />        <!-- presuperscript -->

</mmultiscripts>
</math>`,
      latex: '{}_{b}X^{c}',
    },
    {
      name: 'adds prescript and ignore subsup',
      mathml: `<math xmlns="http://www.w3.org/1998/Math/MathML" display="block">
<mmultiscripts>
<mi>X</mi>      <!-- base expression -->
<mprescripts />
<mi>b</mi>      <!-- presubscript -->
<none />        <!-- presuperscript -->

</mmultiscripts>
</math>`,
      latex: '{}_{b}X',
    },
    {
      name: 'should trim empty spaces at the start and end',
      mathml: `
<math xmlns="http://www.w3.org/1998/Math/MathML">
<mi></mi>
<mi>x</mi>
<mi></mi>
<mi></mi>
</math>`,
      latex: 'x',
    },
  ])('$name', ({ mathml, latex }) => {
    expect(MathMLToLaTeX.convert(mathml)).toBe(latex);
  });

  it('renders an odd trailing script as a lone subscript', () => {
    const mathml = `<math xmlns="http://www.w3.org/1998/Math/MathML" display="block">
<mmultiscripts>
<mrow>
  <mi>N</mi>
  <mi>a</mi>
</mrow>
<mrow>
  <mn>11</mn>
</mrow>
</mmultiscripts>
</math>`;
    expect(MathMLToLaTeX.convert(mathml)).toBe('{N a}_{11}');
  });

  it('keeps every script pair, separating pairs with empty atoms (no double subscript)', () => {
    const mathml = `<math>
<mmultiscripts>
  <mi>F</mi>
  <mn>1</mn><mn>2</mn>
  <mn>3</mn><mn>4</mn>
</mmultiscripts>
</math>`;
    expect(MathMLToLaTeX.convert(mathml)).toBe('F_{1}^{2}{}_{3}^{4}');
  });

  it('finds mprescripts after multiple postscript pairs', () => {
    const mathml = `<math>
<mmultiscripts>
  <mi>X</mi>
  <mn>5</mn><mn>6</mn>
  <mn>7</mn><mn>8</mn>
  <mprescripts/>
  <mn>9</mn><mn>3</mn>
</mmultiscripts>
</math>`;
    expect(MathMLToLaTeX.convert(mathml)).toBe('{}_{9}^{3}X_{5}^{6}{}_{7}^{8}');
  });

  it('accepts a base-only element, as the spec allows', () => {
    expect(MathMLToLaTeX.convert('<math><mmultiscripts><mi>X</mi></mmultiscripts></math>')).toBe('X');
  });

  it('throws when the base is missing entirely', () => {
    expect(() => MathMLToLaTeX.convert('<math><mmultiscripts></mmultiscripts></math>')).toThrow(
      new InvalidNumberOfChildrenError('mmultiscripts', 1, 0, 'at least'),
    );
  });
});
