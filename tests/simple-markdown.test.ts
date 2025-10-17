import { describe, it, expect } from 'vitest';
import { JSDOM } from 'jsdom';
import { Defuddle } from '../src/node';
import DefuddleMarkdown from '../src/index.markdown';

describe('Markdown Processing', () => {
	it('should convert content to markdown when markdown option is enabled', async () => {
		const html = `
			<html>
				<body>
					<article>
						<h1>Test Heading 1</h1>
						<p>This is a test paragraph with <strong>bold</strong> text.</p>
            <h2>Test Heading 2</h2>
            <p>This is a test paragraph with <em>italic</em> text.</p>
					</article>
				</body>
			</html>
		`;

		const result = await Defuddle(html, 'https://example.com', {
			markdown: true
		});

		// Should have markdown output (not the original HTML)
		expect(result.content).toContain('# Test Heading 1');
		expect(result.content).toContain('**bold**');
		expect(result.content).toContain('## Test Heading 2');
		expect(result.content).toContain('*italic*');
	});

	it('should work with separateMarkdown option', async () => {
		const html = `
			<html>
				<body>
					<article>
						<h1>Test Article</h1>
						<p>This is a test paragraph with <strong>bold</strong> text.</p>
					</article>
				</body>
			</html>
		`;

		const result = await Defuddle(html, 'https://example.com', {
			separateMarkdown: true
		});

		// Should have both HTML and markdown
		expect(result.content).toContain('<h2>Test Article</h2>');
		expect(result.contentMarkdown).toContain('# Test Article');
		expect(result.contentMarkdown).toContain('**bold**');
	});
});

describe('Markdown Bundle', () => {
	it('should enable separateMarkdown by default', async () => {
		const html = `
			<html>
				<body>
					<article>
						<h1>Test Article</h1>
						<p>This is a test paragraph with <strong>bold</strong> text.</p>
					</article>
				</body>
			</html>
		`;

		const dom = new JSDOM(html, { url: 'https://example.com' });
		const result = new DefuddleMarkdown(dom.window.document).parse();

		// Should have both HTML and markdown by default
		expect(result.content).toContain('<h2>Test Article</h2>');
		expect(result.contentMarkdown).toBeDefined();
		expect(result.contentMarkdown).toContain('# Test Article');
		expect(result.contentMarkdown).toContain('**bold**');
	});

	it('should allow overriding separateMarkdown option', async () => {
		const html = `
			<html>
				<body>
					<article>
						<h1>Test Article</h1>
						<p>This is a test paragraph with <strong>bold</strong> text.</p>
					</article>
				</body>
			</html>
		`;

		const dom = new JSDOM(html, { url: 'https://example.com' });
		const result = new DefuddleMarkdown(dom.window.document, {
			separateMarkdown: false
		}).parse();

		// Should not have contentMarkdown when disabled
		expect(result.contentMarkdown).toBeUndefined();
	});
});

