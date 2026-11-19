import { describe, test, expect } from 'vitest';
import { Defuddle } from '../src/defuddle';
import { parseDocument } from './helpers';

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
});
