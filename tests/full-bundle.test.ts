import { describe, test, expect } from 'vitest';
import { JSDOM } from 'jsdom';
import Defuddle from '../src/index.full';

function createDocument(html: string): Document {
	const dom = new JSDOM(html);
	return dom.window.document;
}

const simpleHTML = `
<!DOCTYPE html>
<html>
<head><title>Test Page</title></head>
<body>
	<article>
		<h1>Test Article</h1>
		<p>This is a <strong>test</strong> paragraph with some content.</p>
		<p>Another paragraph here.</p>
	</article>
</body>
</html>
`;

describe('Full bundle markdown conversion', () => {
	test('markdown: true converts content to markdown', () => {
		const doc = createDocument(simpleHTML);
		const defuddle = new Defuddle(doc, { markdown: true });
		const result = defuddle.parse();

		// Content should be markdown (no HTML tags)
		expect(result.content).not.toContain('<p>');
		expect(result.content).not.toContain('<strong>');
		expect(result.content).toContain('**test**');
	});

	test('separateMarkdown: true populates contentMarkdown while keeping content as HTML', () => {
		const doc = createDocument(simpleHTML);
		const defuddle = new Defuddle(doc, { separateMarkdown: true });
		const result = defuddle.parse();

		// content should still be HTML
		expect(result.content).toContain('<p>');
		expect(result.content).toContain('<strong>');

		// contentMarkdown should be populated with markdown
		expect(result.contentMarkdown).toBeDefined();
		expect(result.contentMarkdown).not.toContain('<p>');
		expect(result.contentMarkdown).toContain('**test**');
	});

	test('without markdown options, no markdown conversion happens', () => {
		const doc = createDocument(simpleHTML);
		const defuddle = new Defuddle(doc);
		const result = defuddle.parse();

		// content should be HTML
		expect(result.content).toContain('<p>');
		expect(result.content).toContain('<strong>');

		// contentMarkdown should not be set
		expect(result.contentMarkdown).toBeUndefined();
	});
});
