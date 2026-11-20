import { describe, expect, it } from 'vitest';
import { JSDOM } from 'jsdom';
import { docs, searchIndex } from '../website/src/docs-data';
import { getSearchHTML } from '../website/src/search';
import { searchDocumentation } from '../website/src/client/search-model';

describe('documentation search', () => {
	it('links every documentation result to a heading on the rendered page', () => {
		const dom = new JSDOM(docs.content);
		const entries = searchIndex.filter(item => item.href.startsWith('/docs#'));
		expect(entries.length).toBeGreaterThan(50);
		for (const item of entries) {
			expect(dom.window.document.getElementById(item.href.split('#')[1]), item.title).not.toBeNull();
		}
		dom.window.close();
	});
	it.each([
		['removeImages', 'removeImages', '/docs#options'],
		['SEPARATEMARKDOWN', 'separateMarkdown', '/docs#options'],
		['contentMarkdown', 'contentMarkdown', '/docs#response'],
		['--markdown', '--markdown', '/docs#cli-options'],
		['-o', '--output <file>', '/docs#cli-options'],
		['remove images', 'removeImages', '/docs#options'],
		['content selector', 'Content selector', '/docs#content-selector'],
	])('finds %s before broad mentions', (query, title, href) => {
		expect(searchDocumentation(searchIndex, query)[0]).toMatchObject({ title, href });
	});
	it('supports prose searches, empty queries, and no matches', () => {
		expect(searchDocumentation(searchIndex, 'DOM implementation').some(item => item.href === '/docs#installation')).toBe(true);
		expect(searchDocumentation(searchIndex, '   ')).toHaveLength(12);
		expect(searchDocumentation(searchIndex, 'not-a-real-option-xyz')).toEqual([]);
	});
	it('embeds the index as inert JSON while preserving HTML-like search text', () => {
		const dom = new JSDOM(getSearchHTML());
		expect(dom.window.document.querySelectorAll('script')).toHaveLength(1);
		const script = dom.window.document.querySelector('#search-index')!;
		expect(script.textContent).not.toContain('<');
		expect(JSON.parse(script.textContent!)).toEqual(searchIndex);
		expect(JSON.parse(script.textContent!).some((item: { title: string }) => item.title === '--output <file>')).toBe(true);
		dom.window.close();
	});
});
