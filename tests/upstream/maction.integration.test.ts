import { describe, it, expect } from 'vitest';
import { MathMLToLaTeX } from './shim';

describe('maction (integration)', () => {
  it.each([
    {
      name: 'converts maction just joining its content separating them by =>',
      mathml: `
<root>
<math>
  <maction>
    <mrow>
      <mi>a</mi>
      <mo>+</mo>
      <mi>2</mi>
    </mrow>
    <mrow>
      <mi>b</mi>
      <mo>-</mo>
      <mi>3</mi>
    </mrow>
  </maction>
</math>
</root>
`,
      latex: 'a + 2 \\Longrightarrow b - 3',
    },
    {
      name: 'converts maction just joining its content separating them by =>',
      mathml: `
<root>
<math>
  <maction>
    <mrow>
      <mi>a</mi>
      <mo>+</mo>
      <mi>2</mi>
    </mrow>
    <mrow>
      <mi>b</mi>
      <mo>-</mo>
      <mi>3</mi>
    </mrow>
    <mrow>
      <mi>a</mi>
      <mo>+</mo>
      <mi>b</mi>
    </mrow>
  </maction>
</math>
</root>
`,
      latex: 'a + 2 \\Longrightarrow b - 3 \\Longrightarrow a + b',
    },
    {
      name: 'converts maction just joining its content separating them by =>',
      mathml: `
<root>
<math>
  <maction actiontype="toggle">
    <mrow>
      <mi>a</mi>
      <mo>+</mo>
      <mi>2</mi>
    </mrow>
    <mrow>
      <mi>b</mi>
      <mo>-</mo>
      <mi>3</mi>
    </mrow>
    <mrow>
      <mi>a</mi>
      <mo>+</mo>
      <mi>b</mi>
    </mrow>
  </maction>
</math>
</root>
`,
      latex: 'a + 2 \\Longrightarrow b - 3 \\Longrightarrow a + b',
    },
    {
      name: 'converts maction just taking the first child',
      mathml: `
<root>
<math>
  <maction actiontype="statusline">
    <mrow>
      <mi>a</mi>
      <mo>+</mo>
      <mi>2</mi>
    </mrow>
    <mrow>
      <mi>b</mi>
      <mo>-</mo>
      <mi>3</mi>
    </mrow>
    <mrow>
      <mi>a</mi>
      <mo>+</mo>
      <mi>b</mi>
    </mrow>
  </maction>
</math>
</root>
`,
      latex: 'a + 2',
    },
    {
      name: 'converts maction just taking the first child',
      mathml: `
<root>
<math>
  <maction actiontype="tooltip">
    <mrow>
      <mi>a</mi>
      <mo>+</mo>
      <mi>2</mi>
    </mrow>
    <mrow>
      <mi>b</mi>
      <mo>-</mo>
      <mi>3</mi>
    </mrow>
    <mrow>
      <mi>a</mi>
      <mo>+</mo>
      <mi>b</mi>
    </mrow>
  </maction>
</math>
</root>
`,
      latex: 'a + 2',
    },
  ])('$name', ({ mathml, latex }) => {
    expect(MathMLToLaTeX.convert(mathml)).toBe(latex);
  });
});
