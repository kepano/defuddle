import { describe, it, expect } from 'vitest';
import { MathMLToLaTeX } from './shim';
import { InvalidNumberOfChildrenError } from './shim';

describe('mroot (integration)', () => {
  it('converts to a sqrt command with a root index', () => {
    const mathml = `
<root>
<math>
  <mroot>
    <mrow>
      <mi>x</mi>
      <mo>+</mo>
      <mi>2</mi>
    </mrow>
    <mn>3</mn>
  </mroot>
</math>
</root>
`;
    expect(MathMLToLaTeX.convert(mathml)).toBe('\\sqrt[3]{x + 2}');
  });

  it('throws when it does not have exactly two children', () => {
    const mathml = `
<root>
<math>
  <mroot>
    <mrow>
      <mi>x</mi>
      <mo>+</mo>
      <mi>2</mi>
    </mrow>
    <mn>3</mn>
    <mn>2</mn>
  </mroot>
</math>
</root>
`;
    expect(() => MathMLToLaTeX.convert(mathml)).toThrow(new InvalidNumberOfChildrenError('mroot', 2, 3));
  });
});
