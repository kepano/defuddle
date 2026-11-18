import { describe, it, expect } from 'vitest';
import { Defuddle } from '../src/node';

describe('SubstackExtractor preloads-json support', () => {
	it('extracts metadata and body_html from script#preloads-json top-level post', async () => {
		const preload = {
			post: {
				title: 'Preloads JSON Post',
				subtitle: 'Subtitle from preloads-json',
				post_date: '2026-11-12T17:31:44.927Z',
				canonical_url: 'https://example.substack.com/p/preloads-json-post',
				publishedBylines: [{ name: 'Alice Writer' }],
				body_html: '<p>Hello from preloads-json body.</p>',
			},
		};

		const html = `<!doctype html>
<html>
<head>
	<title>Fallback Title</title>
	<meta property="og:description" content="Fallback og description" />
</head>
<body>
	<script id="preloads-json" type="application/json">${JSON.stringify(preload)}</script>
	<script>window._preloads = JSON.parse(document.querySelector('script#preloads-json[type="application/json"]').textContent)</script>
</body>
</html>`;

		const result = await Defuddle(html, 'https://example.substack.com/p/preloads-json-post');
		expect(result.extractorType).toBe('substack');
		expect(result.title).toBe('Preloads JSON Post');
		expect(result.description).toBe('Subtitle from preloads-json');
		expect(result.published).toBe('2026-11-12T17:31:44.927Z');
		expect(result.author).toBe('Alice Writer');
		expect(result.content).toContain('Hello from preloads-json body.');
	});

	it('falls back to legacy inline window._preloads JSON.parse script', async () => {
		const legacyPayload = {
			feedData: {
				initialPost: {
					post: {
						title: 'Legacy Preloads Post',
						subtitle: 'Legacy subtitle',
						post_date: '2026-10-01T12:00:00.000Z',
						publishedBylines: [{ name: 'Bob Legacy' }],
						body_html: '<p>Hello from legacy preloads.</p>',
					},
				},
			},
		};
		const innerJson = JSON.stringify(JSON.stringify(legacyPayload));

		const html = `<!doctype html>
<html>
<body>
	<script>window._preloads = JSON.parse(${innerJson})</script>
</body>
</html>`;

		const result = await Defuddle(html, 'https://example.substack.com/p/legacy-post');
		expect(result.extractorType).toBe('substack');
		expect(result.title).toBe('Legacy Preloads Post');
		expect(result.description).toBe('Legacy subtitle');
		expect(result.published).toBe('2026-10-01T12:00:00.000Z');
		expect(result.author).toBe('Bob Legacy');
		expect(result.content).toContain('Hello from legacy preloads.');
	});

	it('ignores malformed preloads-json and falls back to DOM body.markup', async () => {
		const html = `<!doctype html>
<html>
<head><title>DOM Fallback Title</title></head>
<body>
	<script id="preloads-json" type="application/json">{not valid json</script>
	<div class="body markup"><p>Fallback DOM body content.</p></div>
</body>
</html>`;

		const result = await Defuddle(html, 'https://example.substack.com/p/malformed');
		expect(result.extractorType).toBe('substack');
		expect(result.content).toContain('Fallback DOM body content.');
	});
});
