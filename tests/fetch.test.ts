import { describe, test, expect, vi, afterEach } from 'vitest';
import { fetchPage, DEFAULT_UA } from '../src/fetch';

const HTML = '<html><head></head><body>hello</body></html>';

function mockFetch(contentType: string) {
	const buffer = new TextEncoder().encode(HTML).buffer;
	vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
		ok: true,
		headers: { get: (h: string) => h === 'content-type' ? contentType : null },
		arrayBuffer: () => Promise.resolve(buffer),
	}));
}

afterEach(() => vi.unstubAllGlobals());

describe('fetchPage charset handling', () => {
	test('handles trailing comma in charset (charset=utf-8,)', async () => {
		mockFetch('text/html; charset=utf-8,');
		await expect(fetchPage('https://example.com', DEFAULT_UA)).resolves.toContain('hello');
	});

	test('handles quoted charset (charset="utf-8")', async () => {
		mockFetch('text/html; charset="utf-8"');
		await expect(fetchPage('https://example.com', DEFAULT_UA)).resolves.toContain('hello');
	});
});
