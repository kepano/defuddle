import { describe, test, expect } from 'vitest';
import { Defuddle } from '../src/node';
import { parseDocument } from './helpers';

// Regression test for #531: the small-image check read inline dimensions with
// /width\s*:\s*(\d+)/ and /height\s*:\s*(\d+)/, which also match `stroke-width`,
// `border-width` and `line-height`. A large image or SVG carrying one of those
// properties was read as 1px and removed.
describe('Small image detection does not misread stroke-width/border-width/line-height', () => {
	test('keeps an SVG whose only size-like style is stroke-width', async () => {
		const html = `<!DOCTYPE html>
<html>
<head><title>Diagram</title></head>
<body>
<article>
<h1>Diagram</h1>
<p>This article embeds a hand-drawn diagram whose paths set stroke-width in an inline style, and the SVG itself declares its real size through its viewBox rather than width and height attributes.</p>
<svg viewBox="0 0 400 200" style="stroke-width:1px"><circle cx="50" cy="150" r="20" fill="#d97706"></circle><text x="50" y="150">Start</text></svg>
<p>The diagram above should be preserved because its real width is 400, not the 1px of its stroke-width.</p>
</article>
</body>
</html>`;

		const result = await Defuddle(
			parseDocument(html, 'https://example.com/diagram'),
			'https://example.com/diagram',
			{ separateMarkdown: true }
		);

		expect(result.content).toContain('<svg');
		expect(result.content).toContain('viewBox="0 0 400 200"');
	});

	test('keeps an image whose inline style has border-width before a large width', async () => {
		const html = `<!DOCTYPE html>
<html>
<head><title>Photo</title></head>
<body>
<article>
<h1>Photo</h1>
<p>This article includes a large photo whose inline style declares a one-pixel border width ahead of its real display width, and the small-image filter must read the real width.</p>
<img src="https://example.com/photo.jpg" alt="A photo" style="border-width: 1px; width: 600px; height: 400px">
<p>The photo above should be preserved because it is 600 by 400, not 1px.</p>
</article>
</body>
</html>`;

		const result = await Defuddle(
			parseDocument(html, 'https://example.com/photo'),
			'https://example.com/photo',
			{ separateMarkdown: true }
		);

		expect(result.content).toContain('https://example.com/photo.jpg');
	});
});
