import { describe, expect, test } from 'vitest';
import { createMarkdownContent } from '../src/markdown';

describe('Figure markdown conversion', () => {
	test('preserves linked text content nested alongside the image', () => {
		const html = `
			<figure>
				<a href="https://example.com/context">
					<img src="https://example.com/image.png" alt="Example image">
					<span>Related context</span>
				</a>
				<figcaption>Example caption</figcaption>
			</figure>
		`;

		const markdown = createMarkdownContent(html, 'https://example.com/article');

		expect(markdown).toContain('![Example image](https://example.com/image.png)');
		expect(markdown).toContain('Example caption');
		expect(markdown).toContain('[Related context](https://example.com/context)');
	});
});
