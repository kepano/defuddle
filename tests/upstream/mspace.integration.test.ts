import { describe, it, expect } from 'vitest';
import { MathMLToLaTeX } from './shim';

describe('mspace (integration)', () => {
  it.each([
    {
      name: 'should convert mspace with linebreak="newline" to LaTeX line break',
      mathml: `<math xmlns="http://www.w3.org/1998/Math/MathML">
      <mfrac><mn>1</mn><mn>2</mn></mfrac>
      <mspace linebreak="newline"/>
      <msqrt><mn>10</mn></msqrt>
    </math>`,
      latex: '\\frac{1}{2} \\\\ \\sqrt{10}',
    },
    {
      name: 'should convert mspace without linebreak attribute to regular space',
      mathml: `<math xmlns="http://www.w3.org/1998/Math/MathML">
      <mi>a</mi>
      <mspace/>
      <mi>b</mi>
    </math>`,
      latex: 'a b',
    },
  ])('$name', ({ mathml, latex }) => {
    expect(MathMLToLaTeX.convert(mathml)).toBe(latex);
  });
});
