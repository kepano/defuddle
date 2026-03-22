import { describe, test, expect } from 'vitest';
import { Defuddle } from '../src/node';
import { parseDocument } from './helpers';
import { createMarkdownContent } from '../src/markdown';

describe('Markdown conversion', () => {
	describe('exclamation mark before image', () => {
		test('should add space between ! and image syntax', async () => {
			const html = `<html><head><title>Test</title></head><body><article><p>Yey!<img src="https://example.com/img.png" alt="IMG"></p></article></body></html>`;
			const result = await Defuddle(parseDocument(html, 'https://example.com'), 'https://example.com', { separateMarkdown: true });

			// The ! from "Yey!" should be separated from ![IMG](...) with a space
			expect(result.contentMarkdown).toContain('! ![IMG]');
			expect(result.contentMarkdown).not.toMatch(/!!\[/);
		});

		test('should add space between ! and linked image', async () => {
			const html = `<html><head><title>Test</title></head><body><article><p>Hello!<a href="https://example.com"><img src="https://example.com/img.png" alt="photo"></a></p></article></body></html>`;
			const result = await Defuddle(parseDocument(html, 'https://example.com'), 'https://example.com', { separateMarkdown: true });

			expect(result.contentMarkdown).toContain('! [![photo]');
			expect(result.contentMarkdown).not.toMatch(/!\[!\[/);
		});

		test('should not affect normal image syntax', async () => {
			const html = `<html><head><title>Test</title></head><body><article><p>Hello world</p><img src="https://example.com/img.png" alt="photo"></article></body></html>`;
			const result = await Defuddle(parseDocument(html, 'https://example.com'), 'https://example.com', { separateMarkdown: true });

			// Normal image syntax should remain untouched
			expect(result.contentMarkdown).toContain('![photo](https://example.com/img.png)');
		});

		test('should not add space to ! that is not before image syntax', async () => {
			const html = `<html><head><title>Test</title></head><body><article><p>Hello! This is great!</p></article></body></html>`;
			const result = await Defuddle(parseDocument(html, 'https://example.com'), 'https://example.com', { separateMarkdown: true });

			expect(result.contentMarkdown).toContain('Hello! This is great!');
		});
	});

	describe('base href resolution', () => {
		test('should resolve relative URLs against base href', async () => {
			const html = `<html><head><title>Test</title><base href="/html/2312.00752v2/"></head><body><article><p>Content</p><img src="x1.png"></article></body></html>`;
			const result = await Defuddle(parseDocument(html, 'https://arxiv.org/html/2312.00752'), 'https://arxiv.org/html/2312.00752', { separateMarkdown: true });

			expect(result.content).toContain('https://arxiv.org/html/2312.00752v2/x1.png');
		});

		test('should fall back to document URL when no base href', async () => {
			const html = `<html><head><title>Test</title></head><body><article><p>Content</p><img src="x1.png"></article></body></html>`;
			const result = await Defuddle(parseDocument(html, 'https://arxiv.org/html/2312.00752'), 'https://arxiv.org/html/2312.00752', { separateMarkdown: true });

			expect(result.content).toContain('https://arxiv.org/html/x1.png');
		});
	});

	describe('wbr tag handling', () => {
		test('should remove wbr tags without adding spaces', async () => {
			const html = `<html><head><title>Test</title></head><body><article><p>Super<wbr>cali<wbr>fragilistic</p></article></body></html>`;
			const result = await Defuddle(parseDocument(html, 'https://example.com'), 'https://example.com', { separateMarkdown: true });

			expect(result.contentMarkdown).toContain('Supercalifragilistic');
		});

		test('should handle wbr inside links', async () => {
			const html = `<html><head><title>Test</title></head><body><article><p><a href="https://example.com">long<wbr>word</a></p></article></body></html>`;
			const result = await Defuddle(parseDocument(html, 'https://example.com'), 'https://example.com', { separateMarkdown: true });

			expect(result.contentMarkdown).toContain('longword');
		});
	});

	describe('line-number gutters and layout tables', () => {
		test('layout single-column table preserves row breaks', () => {
			const html =
				'<table><tbody><tr><td>alpha</td></tr><tr><td>beta</td></tr></tbody></table>';
			const md = createMarkdownContent(html, 'https://example.com');
			expect(md).toContain('alpha');
			expect(md).toContain('beta');
			expect(md.indexOf('beta')).toBeGreaterThan(md.indexOf('alpha'));
		});

		test('unwrap <code><pre> nesting so Turndown emits fenced block (not inline backticks)', () => {
			const html =
				'<div><code class="wrap"><pre><code>AGENTS.md\nARCHITECTURE.md</code></pre></code></div>';
			const md = createMarkdownContent(html, 'https://example.com');
			expect(md).toContain('AGENTS.md');
			expect(md).toContain('ARCHITECTURE.md');
			expect(md).toMatch(/^```\n/m);
			expect(md).not.toMatch(/`[^`\n]*AGENTS\.md[^`\n]*ARCHITECTURE/);
		});

		test('flex-row line gutters inside pre: Defuddle pipeline does not glue line numbers to text', async () => {
			const html = `<!DOCTYPE html><html><head><title>T</title></head><body><article>
<h4>Plain Text</h4>
<div><code class="snip"><pre class="flex flex-col">
<div class="gap-2xs flex flex-row"><span>1</span><div>AGENTS.md</div></div>
<div class="gap-2xs flex flex-row"><span>2</span><div>ARCHITECTURE.md</div></div>
<div class="gap-2xs flex flex-row"><span>3</span><div>docs/</div></div>
</pre></code></div>
</article></body></html>`;
			const result = await Defuddle(
				parseDocument(html, 'https://example.com'),
				'https://example.com',
				{ separateMarkdown: true }
			);
			expect(result.contentMarkdown).toBeTruthy();
			expect(result.contentMarkdown!).not.toContain('1AGENTS');
			expect(result.contentMarkdown!).toContain('AGENTS.md');
			expect(result.contentMarkdown!).toContain('ARCHITECTURE.md');
		});

		test('two-column line-number gutter table outputs content column only', () => {
			const html = `<table><tbody>
<tr><td>1</td><td>AGENTS.md</td></tr>
<tr><td>2</td><td>docs/</td></tr>
<tr><td>3</td><td>├── design-docs/</td></tr>
</tbody></table>`;
			const md = createMarkdownContent(html, 'https://example.com');
			expect(md).not.toMatch(/\|\s*1\s*\|/);
			expect(md).toContain('AGENTS.md');
			expect(md).toContain('docs/');
			expect(md).toContain('design-docs');
			expect(md).not.toMatch(/^1\s/m);
		});

		test('pre code strips line-number spans and keeps line breaks when present', () => {
			const html =
				'<pre><code><span class="line-number">1</span><span>AGENTS.md</span><br/>' +
				'<span class="line-number">2</span><span>docs/</span></code></pre>';
			const md = createMarkdownContent(html, 'https://example.com');
			expect(md).toContain('AGENTS.md');
			expect(md).toContain('docs/');
			expect(md).not.toContain('1AGENTS');
			const fence = md.match(/```[^\n]*\n([\s\S]*?)\n```/);
			expect(fence).toBeTruthy();
			const body = fence![1];
			expect(body).toContain('AGENTS.md');
			expect(body).toContain('docs/');
		});
	});
});
