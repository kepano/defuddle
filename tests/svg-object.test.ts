import { describe, test, expect } from 'vitest';
import { Defuddle } from '../src/node';
import { parseDocument } from './helpers';

const FILLER = '<p>' + 'Lorem ipsum dolor sit amet consectetur adipiscing elit sed do eiusmod tempor. '.repeat(30) + '</p>';

function page(body: string): string {
	return `<!doctype html><html><head><title>Paper</title></head><body><article>${body}${FILLER}</article></body></html>`;
}

describe('SVG <object> figures (#502)', () => {
	test('converts <object type="image/svg+xml" data="..."> into <img> and resolves relative URLs', async () => {
		const html = page(
			'<figure><object type="image/svg+xml" data="figures/arch.svg" aria-label="Architecture diagram">Fallback</object><figcaption>Figure 1</figcaption></figure>'
		);
		const url = 'https://arxiv.org/html/2608.28188v1/';
		const result = await Defuddle(parseDocument(html, url), url, { separateMarkdown: true });

		expect(result.content).toContain('<img ');
		expect(result.content).toContain('src="https://arxiv.org/html/2608.28188v1/figures/arch.svg"');
		expect(result.content).not.toContain('<object');
		expect(result.contentMarkdown).toContain('![Architecture diagram](https://arxiv.org/html/2608.28188v1/figures/arch.svg)');
	});

	test('still removes non-SVG <object> elements', async () => {
		const html = page('<object type="application/x-shockwave-flash" data="movie.swf"></object>');
		const url = 'https://example.com/post';
		const result = await Defuddle(parseDocument(html, url), url);

		expect(result.content).not.toContain('<object');
		expect(result.content).not.toContain('movie.swf');
	});
});
