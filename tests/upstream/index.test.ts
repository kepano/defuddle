import { describe, it, expect } from 'vitest';
import { MathMLToLaTeX } from './shim';
import * as mathmlStrings from './mathmlStrings';

describe('#convert', () => {
  describe('long char and glyph convertion', () => {
    it('should convert ϵ properly to \\epsilon', () => {
      const mathml = mathmlStrings.mathWithEpsilonGlyph;

      const result = MathMLToLaTeX.convert(mathml);

      expect(result).toBe('d = \\left(\\frac{q^{2} L}{2 \\pi \\epsilon_{0} m g}\\right)^{1 / 3}');
    });

    it('should convert µ properly to \\mu', () => {
      const mathml = mathmlStrings.mathWithMuGlyph;

      const result = MathMLToLaTeX.convert(mathml);

      expect(result).toBe('2 \\mu s');
    });

    it('should convert ⋅ properly to \\cdot on text', () => {
      const mathml = mathmlStrings.mathWithCdotGlyph;

      const result = MathMLToLaTeX.convert(mathml);

      expect(result).toBe('\\text{kg}\\cdot\\text{m}^{2}');
    });

    it('should convert alternative ı to \\imath', () => {
      const mathml = mathmlStrings.mathWithAlternative1;

      const result = MathMLToLaTeX.convert(mathml);

      expect(result).toBe('E \\left(W_{\\imath}\\right) = \\mu');
    });

    it('should convert alternative square to \\blacksquare', () => {
      const mathml = mathmlStrings.mathWithAlternativeSquare;

      const result = MathMLToLaTeX.convert(mathml);

      expect(result).toBe('2 \\blacksquare s');
    });

    for (const inputExpectedPair of mathmlStrings.inputExpectedPairs) {
      const { input, expected, op } = inputExpectedPair;

      it(`should convert ${input} to ${expected} for tag ${op}`, () => {
        const mathml = `<math xmlns="http://www.w3.org/1998/Math/MathML"><${op}>${input}</${op}></math>`;

        const result = MathMLToLaTeX.convert(mathml);

        expect(result).toBe(expected);
      });
    }
  });

  it('should remove ms word prefixes and convert tags as expected', () => {
    const result = MathMLToLaTeX.convert(mathmlStrings.msWordInput);

    expect(result).toBe(
      'V_{i} \\frac{\\Delta C_{A , i}^{t}}{\\Delta t} = \\sum_{j = k}^{N} G_{i , j}^{D} \\left(C_{A , j} - C_{A , i}\\right)',
    );
  });

  it('should convert MathML without unnecessary delimiters and handle mtext spacing correctly', () => {
    const mathml = `
    <math xmlns="http://www.w3.org/1998/Math/MathML" display="block">
      <semantics>
        <mrow>
          <msub>
            <mtext>Required Value</mtext>
            <mtext>other</mtext>
          </msub>
          <mo>≥</mo>
          <mfrac>
            <mrow>
              <mn>21</mn>
              <mi>f</mi>
              <msup>
                <mi>t</mi>
                <mn>3</mn>
              </msup>
            </mrow>
            <mrow>
              <mi>A</mi>
              <mi>C</mi>
              <mi>H</mi>
            </mrow>
          </mfrac>
          <mo>⋅</mo>
          <mo fence="true">(</mo>
          <mfrac>
            <msub>
              <mi>I</mi>
              <mi>o</mi>
            </msub>
            <mrow>
              <mn>1000</mn>
              <msub>
                <mi>B</mi>
                <mrow>
                  <mtext>Btu</mtext>
                  <mi mathvariant="normal">/</mi>
                  <mtext>h</mtext>
                </mrow>
              </msub>
            </mrow>
          </mfrac>
          <mo fence="true">)</mo>
        </mrow>
      </semantics>
    </math>
    `;

    const expectedLatex = `\\text{Required Value}_{\\text{other}} \\geq \\frac{21 f t^{3}}{A C H} \\cdot \\left(\\frac{I_{o}}{1000 B_{\\text{Btu} / \\text{h}}}\\right)`;

    const result = MathMLToLaTeX.convert(mathml);

    expect(result).toBe(expectedLatex);
  });

  describe('invisible operators (U+2061-U+2064)', () => {
    it.each([
      {
        name: 'function application (U+2061)',
        mathml: '<math><mi>sin</mi><mo>&#x2061;</mo><mi>x</mi></math>',
        expected: 'sin x',
      },
      {
        name: 'function application before fences',
        mathml: '<math><mi>f</mi><mo>&#x2061;</mo><mo>(</mo><mi>x</mi><mo>)</mo></math>',
        expected: 'f \\left(x\\right)',
      },
      {
        name: 'invisible times (U+2062)',
        mathml: '<math><mn>2</mn><mo>&#x2062;</mo><mi>x</mi></math>',
        expected: '2 x',
      },
      {
        name: 'invisible separator (U+2063)',
        mathml: '<math><mn>1</mn><mo>&#x2063;</mo><mn>2</mn></math>',
        expected: '1 2',
      },
      {
        name: 'invisible plus (U+2064)',
        mathml: '<math><mn>1</mn><mo>&#x2064;</mo><mn>2</mn></math>',
        expected: '1 2',
      },
      {
        name: 'invisible operator inside mtext',
        mathml: '<math><mtext>f&#x2061;x</mtext></math>',
        expected: '\\text{f}\\text{x}',
      },
    ])('should drop $name instead of leaking the raw character', ({ mathml, expected }) => {
      const result = MathMLToLaTeX.convert(mathml);

      expect(result).toBe(expected);
      expect(result).not.toMatch(/[⁡-⁤]/);
    });
  });

  it('should correctly convert mmultiscripts with empty mprescripts', () => {
    const mathml = `
      <math xmlns="http://www.w3.org/1998/Math/MathML">
        <mmultiscripts>
          <mi mathvariant="normal">U</mi>
          <mprescripts></mprescripts>
          <mn>238</mn>
        </mmultiscripts>
      </math>
    `;

    const result = MathMLToLaTeX.convert(mathml);

    expect(result).toBe('{}_{238}U');
  });
});
