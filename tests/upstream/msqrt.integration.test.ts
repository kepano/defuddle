import { describe, it, expect } from 'vitest';
import { MathMLToLaTeX } from './shim';

describe('msqrt (integration)', () => {
  it.each([
    {
      name: 'a single child',
      mathml: `
<root>
<math>
  <msqrt>
    <mn>2</mn>
  </msqrt>
</math>
</root>
`,
      latex: '\\sqrt{2}',
    },
    {
      name: 'multiple children',
      mathml: `
<root>
<math>
  <msqrt>
    <mn>2</mn>
    <mo>+</mo>
    <mn>2</mn>
  </msqrt>
</math>
</root>
`,
      latex: '\\sqrt{2 + 2}',
    },
    {
      name: 'a single mrow child',
      mathml: `
<root>
<math>
  <msqrt>
    <mrow>
      <mn>2</mn>
      <mo>+</mo>
      <mn>2</mn>
    </mrow>
  </msqrt>
</math>
</root>
`,
      latex: '\\sqrt{2 + 2}',
    },
    {
      name: 'no content',
      mathml: `
<root>
<math>
  <msqrt>
  </msqrt>
</math>
</root>
`,
      latex: '\\sqrt{}',
    },
  ])('converts $name into a sqrt command', ({ mathml, latex }) => {
    expect(MathMLToLaTeX.convert(mathml)).toBe(latex);
  });
});
