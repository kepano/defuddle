import { describe, test, expect, vi, afterEach } from 'vitest';
import { readFileSync } from 'fs';
import { join } from 'path';
import { Defuddle } from '../src/defuddle';
import { ExtractorRegistry } from '../src/extractor-registry';
import { parseDocument } from './helpers';

afterEach(() => {
	vi.restoreAllMocks();
});

describe('Parse retries', () => {
	test('removes the cover image on every parse of the same document', () => {
		const words = Array.from({ length: 30 }, (_, i) => `word${i}`).join(' ');
		const doc = parseDocument(`<html><head><title>Post</title>
			<meta property="og:image" content="https://cdn.example.com/w_400/cover.jpg">
			</head><body><article><h1>Post</h1>
			<img src="https://cdn.example.com/w_400/cover.jpg" srcset="https://cdn.example.com/w_400/cover.jpg 400w, https://cdn.example.com/w_1600/cover.jpg 1600w" alt="">
			<p>${words}.</p><p>${words}.</p>
			</article></body></html>`, 'https://example.com/post');
		const defuddle = new Defuddle(doc, { url: 'https://example.com/post' });

		for (const result of [defuddle.parse(), defuddle.parse()]) {
			expect(result.image).toBe('https://cdn.example.com/w_1600/cover.jpg');
			expect(result.content).not.toContain('cover.jpg');
		}
	});

	test('runs a site extractor once for a short post', () => {
		const html = readFileSync(join(__dirname, 'fixtures', 'comments--mastodon.social-@user-12345678.html'), 'utf8');
		const doc = parseDocument(html, 'https://mastodon.social/@user/12345678');
		const findExtractor = vi.spyOn(ExtractorRegistry, 'findExtractor');

		const result = new Defuddle(doc, { url: 'https://mastodon.social/@user/12345678' }).parse();

		expect(result.extractorType).toBe('mastodon');
		expect(result.wordCount).toBeLessThan(200);
		expect(findExtractor).toHaveBeenCalledTimes(1);
	});
});
