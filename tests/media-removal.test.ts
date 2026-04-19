import { describe, test, expect } from 'vitest';
import { Defuddle } from '../src/node';
import { parseDocument } from './helpers';

describe('Media removal', () => {
	test('preserves video elements that use source children', async () => {
		const html = `<!DOCTYPE html>
<html>
<head><title>Video With Source</title></head>
<body>
<article>
<h1>Video With Source</h1>
<p>This article includes a real video element that uses nested source tags instead of a src attribute on the video element itself.</p>
<video controls poster="https://example.com/poster.jpg">
	<source src="https://example.com/video.mp4" type="video/mp4">
</video>
<p>The video should remain in the extracted HTML because it has a valid media source.</p>
</article>
</body>
</html>`;

		const result = await Defuddle(
			parseDocument(html, 'https://example.com/video-with-source'),
			'https://example.com/video-with-source',
			{ separateMarkdown: true }
		);

		expect(result.content).toContain('<video');
		expect(result.content).toContain('<source');
		expect(result.content).toContain('https://example.com/video.mp4');
	});
});
