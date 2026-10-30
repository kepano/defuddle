import { describe, expect, it } from 'vitest';
import { tags, highlightTree } from '@lezer/highlight';
import { parser } from '@lezer/html';
import { htmlHighlightStyle } from '../src/client/html-highlighting';
import { highlightCode } from '../src/client/highlight';

describe('Flexoki syntax roles', () => {
	it('distinguishes HTML tags, attributes, strings, comments, and punctuation', () => {
		const source = '<!-- Note -->\n<article class="post">Hello &amp; goodbye</article>';
		const tokens: [string, string][] = [];
		highlightTree(parser.parse(source), htmlHighlightStyle, (from, to, style) => tokens.push([source.slice(from, to), style]));
		expect(tokens).toEqual(expect.arrayContaining([
			['<!-- Note -->', 'syn-comment'], ['<', 'syn-punctuation'], ['article', 'syn-tag'],
			['class', 'syn-variable'], ['=', 'syn-punctuation'], ['"post"', 'syn-string'], ['&amp;', 'syn-constant'],
		]));
	});
	it('keeps embedded code declarations green, imports red, and function calls orange', () => {
		for (const [tag, expected] of [
			[tags.definitionKeyword, 'syn-keyword'], [tags.moduleKeyword, 'syn-import'],
			[tags.function(tags.propertyName), 'syn-function'], [tags.function(tags.variableName), 'syn-function'],
			[tags.number, 'syn-number'], [tags.documentMeta, 'syn-language'],
			[tags.blockComment, 'syn-comment'], [tags.invalid, 'syn-invalid'],
		] as const) expect(htmlHighlightStyle.style([tag])).toBe(expected);
	});
	it('recognizes multiline and trailing comments without treating string URLs as comments', () => {
		const output = highlightCode('const url = "https://example.com"; // note\n/* start\nend */\nconst count = 2;', 'ts');
		expect(output).toContain('class="syn-string">https://example.com');
		for (const comment of ['// note', '/* start', 'end */']) expect(output).toContain(`class="syn-comment">${comment}</span>`);
		expect(output).toContain('class="syn-number">2</span>');
	});
});
