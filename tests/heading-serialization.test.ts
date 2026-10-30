import { describe, expect, it } from 'vitest';
import { JSDOM } from 'jsdom';
import { parseLinkedomHTML } from '../src/utils/linkedom-compat';
import { headingRules } from '../src/elements/headings';

describe.each(['linkedom', 'jsdom'])('heading serialization with %s', implementation => {
	it.each([1, 2, 3, 4, 5, 6])('serializes cleaned h%i tags in lowercase', level => {
		const html = `<!doctype html><html><body><h${level} id="section"><a href="#section">#</a> Keep what matters</h${level}></body></html>`;
		const dom = implementation === 'jsdom' ? new JSDOM(html) : null;
		const doc = dom?.window.document ?? parseLinkedomHTML(html);
		const heading = headingRules[0].transform(doc.querySelector(`h${level}`)!);
		expect(heading.outerHTML).toBe(`<h${level}>Keep what matters</h${level}>`);
		dom?.window.close();
	});
});
