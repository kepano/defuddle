import { describe, it, expect } from 'vitest';
import { MathMLToLaTeX } from './shim';

describe('mi (integration)', () => {
  it.each([
    { name: 'a single identifier', mathml: '<root><math><mi>a</mi></math></root>', latex: 'a' },
    { name: 'an identifier without a root wrapper', mathml: '<math><mi>b</mi></math>', latex: 'b' },
    {
      name: 'spaced identifiers, honoring the mathvariant',
      mathml: `
<math xmlns="http://www.w3.org/1998/Math/MathML">
<mi mathvariant="normal">Δ</mi>
<mi>x</mi>
</math>`,
      latex: '\\Delta x',
    },
    {
      name: 'a double-struck identifier raised to a power',
      mathml: `
<math>
<msup>
  <mrow>
    <mi mathvariant="double-struck">R</mi>
  </mrow>
  <mrow>
    <mi>n</mi>
  </mrow>
</msup>
</math>
`,
      latex: '\\mathbb{R}^{n}',
    },
    {
      name: 'an identifier with surrounding spaces (trimmed)',
      mathml: '<root><math><mi> a </mi></math></root>',
      latex: 'a',
    },
    {
      name: 'a special character as a LaTeX command',
      mathml: '<root><math><mi> &#x221E; </mi></math></root>',
      latex: '\\infty',
    },
    {
      name: 'a blank identifier as a spaced textrm',
      mathml: '<root><math><mi>  </mi></math></root>',
      latex: '\\textrm{ }',
    },
  ])('converts $name', ({ mathml, latex }) => {
    expect(MathMLToLaTeX.convert(mathml)).toBe(latex);
  });

  it.each([
    { variant: 'bold', latex: '\\mathbf{x}' },
    { variant: 'italic', latex: '\\mathit{x}' },
    { variant: 'bold-italic', latex: '\\mathbf{\\mathit{x}}' },
    { variant: 'bold-fraktur', latex: '\\mathbf{\\mathfrak{x}}' },
    { variant: 'script', latex: '\\mathcal{x}' },
    { variant: 'bold-script', latex: '\\mathbf{\\mathcal{x}}' },
    { variant: 'fraktur', latex: '\\mathfrak{x}' },
    { variant: 'sans-serif', latex: '\\mathsf{x}' },
    { variant: 'bold-sans-serif', latex: '\\mathbf{\\mathsf{x}}' },
    { variant: 'sans-serif-italic', latex: '\\mathsf{\\mathit{x}}' },
    { variant: 'sans-serif-bold-italic', latex: '\\mathbf{\\mathsf{\\mathit{x}}}' },
    { variant: 'monospace', latex: '\\mathtt{x}' },
  ])('applies the $variant mathvariant', ({ variant, latex }) => {
    expect(MathMLToLaTeX.convert(`<math><mi mathvariant="${variant}">x</mi></math>`)).toBe(latex);
  });

  it.each([
    { name: 'an accented character', mathml: '<math><mi>á</mi></math>', latex: '\\acute{a}' },
    { name: 'a unicode math-alphanumeric character', mathml: '<math><mi>𝐀</mi></math>', latex: '\\mathbf{A}' },
  ])('converts $name to its LaTeX command', ({ mathml, latex }) => {
    expect(MathMLToLaTeX.convert(mathml)).toBe(latex);
  });
});
