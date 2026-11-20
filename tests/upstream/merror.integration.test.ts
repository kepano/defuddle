import { describe, it, expect } from 'vitest';
import { MathMLToLaTeX } from './shim';

describe('merror (integration)', () => {
  it.each([
    {
      name: 'converts merror placing its content inside \\\\color{red}',
      mathml: `
<root>
<math>
  <merror>
    <mi>2</mi>
    <mo>+</mo>
    <mi>2</mi>
  </merror>
</math>
</root>
`,
      latex: '\\color{red}{2 + 2}',
    },
  ])('$name', ({ mathml, latex }) => {
    expect(MathMLToLaTeX.convert(mathml)).toBe(latex);
  });
});
