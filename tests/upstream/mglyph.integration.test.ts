import { describe, it, expect } from 'vitest';
import { MathMLToLaTeX } from './shim';

describe('mglyph (integration)', () => {
  it.each([
    {
      name: 'ignores it',
      mathml: `
<root>
<math>
  <mi><mglyph src="my-glyph.png" alt="my glyph"/></mi>
</math>
</root>
`,
      latex: '',
    },
  ])('$name', ({ mathml, latex }) => {
    expect(MathMLToLaTeX.convert(mathml)).toBe(latex);
  });
});
