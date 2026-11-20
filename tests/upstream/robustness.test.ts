import { describe, it, expect } from 'vitest';
import { MathMLToLaTeX } from './shim';

/**
 * Security/robustness tests derived from issue #44 (vulnerable @xmldom/xmldom).
 *
 * The injection CVEs reported against xmldom 0.8.x live in its *serializer*
 * (XMLSerializer.serializeToString), which this library never calls — it only
 * parses. The tests below therefore focus on what is actually reachable through
 * the public `convert` API:
 *
 *  - hostile XML nodes (processing instructions) must not crash the converter;
 *  - injected markup inside CDATA / comments / doctype must not leak into the
 *    LaTeX output;
 *  - deeply nested input must not take down the process with an uncontrolled
 *    stack overflow (DoS).
 */
describe('#convert security and robustness', () => {
  describe('given hostile XML nodes', () => {
    it('does not crash on a processing instruction inside math', () => {
      const mathml = `<math><?foo bar?><mn>5</mn></math>`;

      expect(() => MathMLToLaTeX.convert(mathml)).not.toThrow();
    });

    it('still converts the surrounding math when a processing instruction is present', () => {
      const mathml = `<math><mrow><?foo bar?><mn>1</mn><mo>+</mo><mn>2</mn></mrow></math>`;

      const result = MathMLToLaTeX.convert(mathml);

      expect(result).toBe('1 + 2');
    });
  });

  describe('given injected markup that must not leak into the output', () => {
    it('does not leak markup smuggled through a CDATA section', () => {
      const mathml = `<math><mtext><![CDATA[]]><mn>9</mn>]]></mtext></math>`;

      const result = MathMLToLaTeX.convert(mathml);

      expect(result).not.toContain('<mn>');
      expect(result).not.toContain('9');
    });

    it('does not leak markup smuggled through a comment', () => {
      const mathml = `<math><mrow><!-- --><mn>1</mn> --><mo>+</mo><mn>2</mn></mrow></math>`;

      const result = MathMLToLaTeX.convert(mathml);

      expect(result).toBe('1 + 2');
    });

    it('does not leak markup smuggled through a doctype declaration', () => {
      const mathml = `<!DOCTYPE math [ <!ENTITY x "INJECTED"> ]><math><mn>7</mn></math>`;

      const result = MathMLToLaTeX.convert(mathml);

      expect(result).toBe('7');
    });
  });

  describe('given deeply nested input (denial of service)', () => {
    // Defuddle: JSDOM's own HTML parser overflows the stack at this depth, before any converter runs.
    it.skipIf(process.env.DOM === 'jsdom')('converts deeply nested input without overflowing the call stack', () => {
      const depth = 20000;
      const inner = '<mrow>'.repeat(depth) + '<mn>1</mn>' + '</mrow>'.repeat(depth);
      const mathml = `<math>${inner}</math>`;

      // The conversion is fully iterative, so even pathologically deep nesting
      // is converted instead of crashing with a RangeError.
      expect(() => MathMLToLaTeX.convert(mathml)).not.toThrow();
      expect(MathMLToLaTeX.convert(mathml)).toBe('1');
    });
  });

  describe('given element text that collides with Object.prototype keys', () => {
    // The symbol/operator lookup tables are plain object literals, so a token
    // such as "constructor" or "toString" resolves through the prototype chain
    // instead of missing. An unknown token must instead fall through to its
    // literal text, exactly like any other unrecognized token (e.g. "foo").
    const prototypeKeys = ['constructor', 'hasOwnProperty', 'toString', 'valueOf', '__proto__'];

    it.each(prototypeKeys)('converts <mo>%s</mo> to its literal text', (token) => {
      const result = MathMLToLaTeX.convert(`<math><mo>${token}</mo></math>`);

      expect(result).toBe(token);
      expect(result).not.toContain('[native code]');
    });

    it.each(prototypeKeys)('converts <mi>%s</mi> to its literal text', (token) => {
      expect(() => MathMLToLaTeX.convert(`<math><mi>${token}</mi></math>`)).not.toThrow();
      expect(MathMLToLaTeX.convert(`<math><mi>${token}</mi></math>`)).toBe(token);
    });
  });

  describe('given input with no recoverable math', () => {
    it.each([
      ['unparseable garbage', 'garbage <<< not xml'],
      ['markup without a math element', '<div><span>no math here</span></div>'],
    ])('returns an empty string for %s', (_name, input) => {
      expect(() => MathMLToLaTeX.convert(input)).not.toThrow();
      expect(MathMLToLaTeX.convert(input)).toBe('');
    });
  });
});
