import { afterEach, describe, expect, test, vi } from 'vitest';
import { readFileSync } from 'fs';
import { join } from 'path';
import { codeBlockRules } from '../src/elements/code';
import { parseDocument } from './helpers';

const LINE_SELECTOR = '[data-line], .line';

function lineScanCount(spy: ReturnType<typeof vi.spyOn>): number {
	return spy.mock.calls.filter(([selector]) => selector === LINE_SELECTOR).length;
}

describe('code block structured text', () => {
	afterEach(() => vi.restoreAllMocks());

	test('scans a highlighted table body at most once for line elements', () => {
		const html = readFileSync(join(__dirname, 'fixtures/codeblocks--highlight-table.html'), 'utf-8');
		const doc = parseDocument(html);
		const table = doc.querySelector('table')!;
		const scans = vi.spyOn(table.querySelector('tbody')!, 'querySelector');

		const result = codeBlockRules[0].transform(table, doc);

		expect(result.querySelector('code')?.textContent).toBe('const first = 1;\nconst second = 2;\nconsole.log(first + second);');
		expect(lineScanCount(scans)).toBeLessThanOrEqual(1);
	});

	test('does not repeat line searches as a gist-style table grows', () => {
		const rows = Array.from({ length: 1000 }, (_, i) =>
			`<tr><td>${i + 1}</td><td>const value${i} = ${i};</td></tr>`);
		const doc = parseDocument(`<html><body><table class="highlight"><tbody>\n${rows.join('\n')}\n</tbody></table></body></html>`);
		const table = doc.querySelector('table')!;
		const scans = vi.spyOn(table.querySelector('tbody')!, 'querySelector');

		const result = codeBlockRules[0].transform(table, doc);

		expect(result.textContent).toBe(rows.map((_, i) => `${i + 1}const value${i} = ${i};`).join('\n'));
		expect(lineScanCount(scans)).toBeLessThanOrEqual(1);
	});

	test('does not search for line elements for non-whitespace text nodes', () => {
		const doc = parseDocument('<html><body><pre></pre></body></html>');
		const pre = doc.querySelector('pre')!;
		for (let i = 0; i < 1000; i++) {
			pre.appendChild(doc.createTextNode(`value${i} `));
		}
		const scans = vi.spyOn(pre, 'querySelector');

		const result = codeBlockRules[0].transform(pre, doc);

		expect(result.textContent).toBe(pre.textContent!.trim());
		expect(lineScanCount(scans)).toBe(0);
	});

	test.each(['data-line=""', 'class="line"'])('skips separators but preserves blank lines with %s', (attribute) => {
		const doc = parseDocument(`<html><body><pre><code>
<span ${attribute}>first</span>
<span ${attribute}></span>
<span ${attribute}>  second</span>
</code></pre></body></html>`);
		const pre = doc.querySelector('pre')!;
		const scans = vi.spyOn(pre.querySelector('code')!, 'querySelector');

		const result = codeBlockRules[0].transform(pre, doc);

		expect(result.textContent).toBe('first\n\n  second');
		expect(lineScanCount(scans)).toBeLessThanOrEqual(1);
	});
});
