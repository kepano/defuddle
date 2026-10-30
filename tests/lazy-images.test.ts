import { describe, expect, test } from 'vitest';
import { Defuddle } from '../src/node';
import { escapeHtml } from '../src/utils/dom';
import { parseDocument } from './helpers';

const url = 'https://example.com/article';
const text = '<p>This article describes the photograph and provides enough surrounding text to retain the image during extraction.</p>';

async function extractImage(attributes: string) {
	const doc = parseDocument(`<html><head><title>Images</title></head><body><article>${text}<p><img ${attributes} alt="Photo"></p>${text}</article></body></html>`, url);
	const result = await Defuddle(doc, url, { contentSelector: 'article' });
	return parseDocument(`<html><body>${result.content}</body></html>`, url).querySelector('img')!;
}

describe('explicit lazy image sources', () => {
	test.each(['data-src', 'data-original', 'data-lazy-src'])('%s replaces an external preview without inspecting its filename', async attr => {
		const img = await extractImage(`src="/opaque-preview" ${attr}="photo" resource="/wiki/File:wrong.jpg"`);
		expect(img.getAttribute('src')).toBe('https://example.com/photo');
	});

	test.each(['data-srcset', 'data-lazy-srcset'])('%s replaces a preview srcset', async attr => {
		const img = await extractImage(`src="/preview" srcset="/preview 1x" ${attr}="/photo 1x, /large 2x"`);
		expect(img.getAttribute('srcset')).toBe('https://example.com/photo 1x, https://example.com/large 2x');
	});

	test.each([
		'data-original="/second" data-src="/first" data-lazy-src="/third"',
		'data-lazy-src="/third" data-src="/first" data-original="/second"'
	])('source precedence is independent of attribute order: %s', async attrs => {
		expect((await extractImage(attrs)).getAttribute('src')).toBe('https://example.com/first');
	});

	test('uses data-image-loader for inline previews without requiring an extension', async () => {
		const img = await extractImage('src="data:image/svg+xml,%3Csvg/%3E" data-image-loader="/photo" data-image-path="/wrong.jpg"');
		expect(img.getAttribute('src')).toBe('https://example.com/photo');
	});

	test('preserves both Wikipedia-style src and srcset in HTML', async () => {
		const img = await extractImage('resource="https://example.com/wiki/File:photo.jpg" src="//images.example.com/photo.jpg" srcset="//images.example.com/large.jpg 2x" loading="lazy"');
		expect(img.getAttribute('src')).toBe('https://images.example.com/photo.jpg');
		expect(img.getAttribute('srcset')).toBe('https://images.example.com/large.jpg 2x');
	});

	test('does not promote metadata when src is missing', async () => {
		const img = await extractImage('resource="/wiki/File:photo.jpg" data-backup="/wrong.jpg" loading="lazy"');
		expect(img?.getAttribute('src')).toBeFalsy();
	});

	test('does not promote metadata to srcset when only src exists', async () => {
		const img = await extractImage('src="/photo.jpg" data-metadata="/wrong.jpg 2x" loading="lazy"');
		expect(img.getAttribute('src')).toBe('https://example.com/photo.jpg');
		expect(img.hasAttribute('srcset')).toBe(false);
	});

	for (const attr of ['data-src', 'data-original', 'data-lazy-src', 'data-srcset', 'data-lazy-srcset', 'data-image-loader']) {
		test.each(['javascript:alert(1)', 'blob:https://example.com/id', 'data:text/html,<script>alert(1)</script>'])(`${attr} ignores unsafe source %s`, async value => {
			const img = await extractImage(`src="/safe.jpg" srcset="/safe.jpg 2x" ${attr}="${escapeHtml(value)}" onerror="alert(1)"`);
			expect(img.getAttribute('src')).toBe('https://example.com/safe.jpg');
			expect(img.getAttribute('srcset')).toBe('https://example.com/safe.jpg 2x');
			expect(img.hasAttribute('onerror')).toBe(false);
		});
	}
});
