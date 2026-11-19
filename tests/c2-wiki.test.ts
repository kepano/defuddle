import { describe, test, expect } from 'vitest';
import { C2WikiExtractor } from '../src/extractors/c2-wiki';

const render = (text: string): string =>
	(new C2WikiExtractor({} as Document, 'https://wiki.c2.com/?TestPage') as any).renderPage({ text });

describe('C2 wiki lists', () => {
	test('keeps items at the same depth as siblings after a jump of two levels', () => {
		expect(render('**First\n**Second\n**Third\nAfter')).toBe('<ul><ul><li>First\n<li>Second\n<li>Third\n</ul></ul>After');
	});

	test('nests one level at a time', () => {
		expect(render('*First\n**Nested\n*Second')).toBe('<ul><li>First\n<ul><li>Nested\n</ul><li>Second\n</ul>');
	});
});
