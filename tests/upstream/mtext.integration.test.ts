import { describe, it, expect } from 'vitest';
import { MathMLToLaTeX } from './shim';

describe('mtext (integration)', () => {
  it.each([
    {
      name: 'wrap its content inside text command',
      mathml: `
<root>
<math xmlns = "http://www.w3.org/1998/Math/MathML">
  <mtext> Theorem of Pythagoras </mtext>
</math>
</root>
`,
      latex: '\\text{ Theorem of Pythagoras }',
    },
    {
      name: 'wrap its content inside text command',
      mathml: `
<root>
<math xmlns = "http://www.w3.org/1998/Math/MathML">
  <mtext mathvariant="normal"> Theorem of Pythagoras </mtext>
</math>
</root>
`,
      latex: '\\text{ Theorem of Pythagoras }',
    },
    {
      name: 'wrap its content inside text command',
      mathml: `
<root>
<math xmlns = "http://www.w3.org/1998/Math/MathML">
  <mtext mathvariant="bold"> Theorem of Pythagoras </mtext>
</math>
</root>
`,
      latex: '\\textbf{ Theorem of Pythagoras }',
    },
    {
      name: 'wrap its content inside text command',
      mathml: `
<root>
<math xmlns = "http://www.w3.org/1998/Math/MathML">
  <mtext mathvariant="italic"> Theorem of Pythagoras </mtext>
</math>
</root>
`,
      latex: '\\textit{ Theorem of Pythagoras }',
    },
    {
      name: 'wrap its content inside text command',
      mathml: `
<root>
<math xmlns = "http://www.w3.org/1998/Math/MathML">
  <mtext mathvariant="bold-italic"> Theorem of Pythagoras </mtext>
</math>
</root>
`,
      latex: '\\textbf{\\textit{ Theorem of Pythagoras }}',
    },
    {
      name: 'wrap its content inside text command',
      mathml: `
<root>
<math xmlns = "http://www.w3.org/1998/Math/MathML">
  <mtext mathvariant="double-struck">R</mtext>
</math>
</root>
`,
      latex: '\\mathbb{R}',
    },
    {
      name: 'wrap its content inside text command',
      mathml: `
<root>
<math xmlns = "http://www.w3.org/1998/Math/MathML">
  <mtext mathvariant="fraktur">Creepy</mtext>
</math>
</root>
`,
      latex: '\\mathfrak{Creepy}',
    },
    {
      name: 'wrap its content inside text command',
      mathml: `
<root>
<math xmlns = "http://www.w3.org/1998/Math/MathML">
  <mtext mathvariant="bold-fraktur">Creepy</mtext>
</math>
</root>
`,
      latex: '\\mathfrak{Creepy}',
    },
    {
      name: 'wrap its content inside text command',
      mathml: `
<root>
<math xmlns = "http://www.w3.org/1998/Math/MathML">
  <mtext mathvariant="monospace">simple text</mtext>
</math>
</root>
`,
      latex: '\\mathtt{simple text}',
    },
    {
      name: 'wrap its content inside text command',
      mathml: `
<root>
<math xmlns = "http://www.w3.org/1998/Math/MathML">
  <mtext mathvariant="script">Creepy</mtext>
</math>
</root>
`,
      latex: '\\text{Creepy}',
    },
    {
      name: 'wrap its content inside text command',
      mathml: `
<root>
<math xmlns = "http://www.w3.org/1998/Math/MathML">
  <mtext mathvariant="bold-script">Creepy</mtext>
</math>
</root>
`,
      latex: '\\text{Creepy}',
    },
  ])('$name', ({ mathml, latex }) => {
    expect(MathMLToLaTeX.convert(mathml)).toBe(latex);
  });
});
