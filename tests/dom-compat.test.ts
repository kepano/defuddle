import { describe, expect, test } from 'vitest';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { Defuddle } from '../src/node';
import { isAboveContentStart } from '../src/content-boundary';
import { parseDocument } from './helpers';

describe('DOM compatibility', () => {
	test('uses the document URL for metadata without URL meta tags', async () => {
		const url = 'https://www.example.com/posts/article';
		const doc = parseDocument('<html><head><title>An article</title></head><body><article><p>Article text.</p></article></body></html>', url);
		const result = await Defuddle(doc);
		expect(result).toMatchObject({ site: 'example.com', domain: 'example.com', favicon: 'https://www.example.com/favicon.ico' });
	});

	test('uses an explicit page URL for metadata', async () => {
		const doc = parseDocument('<html><head><title>An article</title></head><body><article><p>Article text.</p></article></body></html>', 'https://old.example/');
		const result = await Defuddle(doc, 'https://new.example/posts/article');
		expect(result).toMatchObject({ site: 'new.example', domain: 'new.example', favicon: 'https://new.example/favicon.ico' });
	});

	test('falls back to canonical metadata when the document URL is about:blank', async () => {
		const doc = parseDocument('<html><head><title>An article</title><link rel="canonical" href="https://example.com/post"></head><body><article><p>Article text.</p></article></body></html>');
		expect(await Defuddle(doc)).toMatchObject({ domain: 'example.com', favicon: 'https://example.com/favicon.ico' });
	});

	test.each([
		'<div><span id="before">Before</span></div><section><p id="body">Body.</p></section><div><span id="after">After</span></div>',
		'<div><div><span id="before">Before</span></div></div><p id="body">Body.</p><div><div><span id="after">After</span></div></div>',
	])('compares document order across separate containers: %s', html => {
		const doc = parseDocument(`<html><body><article>${html}</article></body></html>`);
		const before = doc.getElementById('before')!;
		const body = doc.getElementById('body')!;
		const after = doc.getElementById('after')!;
		expect(isAboveContentStart(before, body)).toBe(true);
		expect(isAboveContentStart(after, body)).toBe(false);
		expect(isAboveContentStart(body, body)).toBe(false);
		expect(isAboveContentStart(before, null)).toBe(false);
		expect(isAboveContentStart(doc.createElement('p'), body)).toBe(false);
		expect(isAboveContentStart(doc.querySelector('article')!, body)).toBe(true);
		expect(isAboveContentStart(body, doc.querySelector('article')!)).toBe(false);
	});

	test('preserves dates inside labeled email header rows', async () => {
		const html = readFileSync(join(__dirname, 'fixtures/metadata--email-style-header-block.html'), 'utf8');
		const result = await Defuddle(parseDocument(html), 'https://example.com/posts/announcement-reflection/', { separateMarkdown: true });
		expect(result.contentMarkdown).toContain('Date: Wed, 08 Apr 2026');
	});
});
