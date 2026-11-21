import { describe, it, expect } from 'vitest';
import { MathMLToLaTeX } from './shim';

describe('mpadded (integration)', () => {
  it('just wraps its content', () => {
    const mathml = `
<root>
<math>
  <mpadded>
    <mn>2</mn>
    <mo>+</mo>
    <mn>2</mn>
  </mpadded>
</math>
</root>
`;
    expect(MathMLToLaTeX.convert(mathml)).toBe('2 + 2');
  });
});
