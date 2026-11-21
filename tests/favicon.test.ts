import { describe, test, expect } from 'vitest';
import Defuddle from '../src/index';
import { parseDocument } from './helpers';

describe('Favicon URL resolution', () => {
	test('resolves root-relative link[rel=icon] against page URL', () => {
		const html = `
		<!DOCTYPE html>
		<html>
		<head>
			<title>Test</title>
			<link rel="icon" href="/favicon.ico?92d78bd9ef5ce825">
		</head>
		<body><article><p>Hello world content.</p></article></body>
		</html>`;
		const url = 'https://zuckerjagdwurst.com/some/page';
		const doc = parseDocument(html, url);
		const result = new Defuddle(doc, { url }).parse();
		expect(result.favicon).toBe('https://zuckerjagdwurst.com/favicon.ico?92d78bd9ef5ce825');
	});

	test('resolves relative link[rel="shortcut icon"] and og:image:favicon against page URL', () => {
		const htmlShortcut = `
		<!DOCTYPE html>
		<html>
		<head><link rel="shortcut icon" href="assets/icon.png"></head>
		<body><article><p>Hello</p></article></body>
		</html>`;
		const url = 'https://example.com/blog/post';
		const res1 = new Defuddle(parseDocument(htmlShortcut, url), { url }).parse();
		expect(res1.favicon).toBe('https://example.com/blog/assets/icon.png');

		const htmlMeta = `
		<!DOCTYPE html>
		<html>
		<head><meta property="og:image:favicon" content="/static/fav.svg"></head>
		<body><article><p>Hello</p></article></body>
		</html>`;
		const res2 = new Defuddle(parseDocument(htmlMeta, url), { url }).parse();
		expect(res2.favicon).toBe('https://example.com/static/fav.svg');
	});

	test('preserves already-absolute and data URLs', () => {
		const html = `
		<!DOCTYPE html>
		<html>
		<head><link rel="icon" href="https://cdn.example.com/fav.png"></head>
		<body><article><p>Hello</p></article></body>
		</html>`;
		const url = 'https://example.com/';
		const res = new Defuddle(parseDocument(html, url), { url }).parse();
		expect(res.favicon).toBe('https://cdn.example.com/fav.png');
	});
});
