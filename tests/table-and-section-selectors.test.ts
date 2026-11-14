import { describe, expect, test } from 'vitest';
import { JSDOM } from 'jsdom';
import { Defuddle } from '../src/node';
import { parseLinkedomHTML } from '../src/utils/linkedom-compat';

const URL_ = 'https://example.com/guide';

describe.each(['linkedom', 'jsdom'])('Table and section selector preservation (%s)', implementation => {
	function parse(html: string): Document {
		if (implementation === 'jsdom') {
			return new JSDOM(html, { url: URL_ }).window.document as unknown as Document;
		}
		return parseLinkedomHTML(html, URL_);
	}

	test('preserves table header rows and cells with clutter-like class names', async () => {
		const html = `<!doctype html><html><head><title>Tables</title></head><body><article>
			<h1>Tables</h1>
			<p>This guide documents table output across Pandoc, Quarto, and technical documentation sites with enough prose for extraction.</p>
			<table>
				<thead><tr class="header"><th>Default</th><th>Date</th><th>Timestamp</th></tr></thead>
				<tbody>
					<tr><td>Row 1</td><td class="date">2026-01-01</td><td class="timestamp">12:00</td></tr>
					<tr><td>Row 2</td><td class="date">2026-01-02</td><td class="timestamp">13:00</td></tr>
				</tbody>
			</table>
		</article></body></html>`;

		const result = await Defuddle(parse(html), URL_, { markdown: true });
		expect(result.content).toContain('Default');
		expect(result.content).toContain('Date');
		expect(result.content).toContain('Timestamp');
		expect(result.content).toContain('2026-01-01');
		expect(result.content).toContain('12:00');
	});

	test('still removes td.gutter inside code block tables', async () => {
		const html = `<!doctype html><html><head><title>Code</title></head><body><article>
			<h1>Code example</h1>
			<p>This article contains a Hexo-style highlighted code block with a line-number table alongside regular prose. It explains the code in detail so content extraction keeps the main article body intact.</p>
			<figure class="highlight"><table><tbody><tr>
				<td class="gutter"><pre><span>1</span><br><span>2</span></pre></td>
				<td class="code"><pre><span>const a = 1;</span><br><span>const b = 2;</span></pre></td>
			</tr></tbody></table></figure>
		</article></body></html>`;

		const result = await Defuddle(parse(html), URL_, { markdown: true });
		expect(result.content).toContain('const a = 1;');
		expect(result.content).not.toContain('gutter');
	});

	test('preserves Pandoc/Quarto level sections whose id is a sec- label or heading slug while still removing clutter sections', async () => {
		const prose = '<p>This chapter introduces forecasting concepts with meaningful prose about practical experiments. It explains the methods used to collect observations and the reasoning behind the conclusions so readers understand how the results were obtained.</p>'.repeat(3);
		const html = `<!doctype html><html><head><title>Sections</title></head><body><article>
			<h1>Forecasting</h1>
			${prose}
			<section id="two-types-of-errors" class="level2">
				<h2><span class="header-section-number">11.2</span> Two types of errors</h2>
				<p>Training errors and test errors behave differently when evaluating forecasting accuracy across horizons.</p>
			</section>
			<section id="sec-taxonomy" class="level2">
				<h2>Taxonomy</h2>
				<p>Classification of forecasting models by structure and assumptions.</p>
			</section>
			<section id="related-posts">
				<h2>Related Posts</h2>
				<p>More articles you might like.</p>
			</section>
		</article></body></html>`;

		const result = await Defuddle(parse(html), URL_, { markdown: true });
		expect(result.content).toContain('Two types of errors');
		expect(result.content).toContain('Training errors and test errors');
		expect(result.content).toContain('Taxonomy');
		expect(result.content).toContain('Classification of forecasting models');
		expect(result.content).not.toContain('More articles you might like');
	});
});
