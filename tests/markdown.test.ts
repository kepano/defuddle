import { describe, test, expect } from 'vitest';
import { Defuddle } from '../src/node';
import { parseDocument } from './helpers';

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
});
