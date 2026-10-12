import { describe, test, expect, vi, afterEach, beforeEach } from 'vitest';
import { fetchPage, fetchPageWithRetry, BROWSER_UA, DEFAULT_UA } from '../src/fetch';

const HTML = '<html><head></head><body>hello</body></html>';

function response(status: number, options: { contentType?: string; contentLength?: string; html?: string } = {}) {
	const {
		contentType = 'text/html',
		contentLength,
		html = HTML,
	} = options;
	const buffer = new TextEncoder().encode(html).buffer;
	return {
		ok: status >= 200 && status < 300,
		status,
		statusText: status === 403 ? 'Forbidden' : status === 500 ? 'Internal Server Error' : 'OK',
		headers: {
			get: (header: string) => {
				if (header === 'content-type') return contentType;
				if (header === 'content-length') return contentLength || null;
				return null;
			},
		},
		arrayBuffer: () => Promise.resolve(buffer),
	};
}

function mockFetch(contentType: string) {
	vi.stubGlobal('fetch', vi.fn().mockResolvedValue(response(200, { contentType })));
}

beforeEach(() => {
	// Ensure fetchPage uses the mocked global fetch, not a real proxy
	vi.stubEnv('HTTPS_PROXY', undefined as any);
	vi.stubEnv('https_proxy', undefined as any);
	vi.stubEnv('HTTP_PROXY', undefined as any);
	vi.stubEnv('http_proxy', undefined as any);
	vi.stubEnv('ALL_PROXY', undefined as any);
	vi.stubEnv('all_proxy', undefined as any);
});

afterEach(() => {
	vi.unstubAllGlobals();
	vi.unstubAllEnvs();
});

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

describe('fetchPageWithRetry', () => {
	test('retries a 403 once with a browser user agent and preserves language', async () => {
		const fetchMock = vi.fn()
			.mockResolvedValueOnce(response(403))
			.mockResolvedValueOnce(response(200));
		vi.stubGlobal('fetch', fetchMock);

		await expect(fetchPageWithRetry('https://example.com', DEFAULT_UA, 'fr')).resolves.toContain('hello');

		expect(fetchMock).toHaveBeenCalledTimes(2);
		expect(fetchMock.mock.calls[0][1].headers).toMatchObject({
			'User-Agent': DEFAULT_UA,
			'Accept-Language': 'fr',
		});
		expect(fetchMock.mock.calls[1][1].headers).toMatchObject({
			'User-Agent': BROWSER_UA,
			'Accept-Language': 'fr',
		});
	});

	test('does not retry a successful response', async () => {
		const fetchMock = vi.fn().mockResolvedValue(response(200));
		vi.stubGlobal('fetch', fetchMock);

		await expect(fetchPageWithRetry('https://example.com', DEFAULT_UA)).resolves.toContain('hello');

		expect(fetchMock).toHaveBeenCalledOnce();
	});

	test('rejects after one browser user agent retry', async () => {
		const fetchMock = vi.fn().mockResolvedValue(response(403));
		vi.stubGlobal('fetch', fetchMock);

		await expect(fetchPageWithRetry('https://example.com', DEFAULT_UA)).rejects.toThrow(
			'Failed to fetch: 403 Forbidden'
		);
		expect(fetchMock).toHaveBeenCalledTimes(2);
	});

	test('does not retry unrelated HTTP failures', async () => {
		const fetchMock = vi.fn().mockResolvedValue(response(500));
		vi.stubGlobal('fetch', fetchMock);

		await expect(fetchPageWithRetry('https://example.com', DEFAULT_UA)).rejects.toThrow(
			'Failed to fetch: 500 Internal Server Error'
		);
		expect(fetchMock).toHaveBeenCalledOnce();
	});

	test('does not retry timeouts', async () => {
		const timeoutError = new Error('aborted');
		timeoutError.name = 'AbortError';
		const fetchMock = vi.fn().mockRejectedValue(timeoutError);
		vi.stubGlobal('fetch', fetchMock);

		await expect(fetchPageWithRetry('https://example.com', DEFAULT_UA)).rejects.toThrow(
			'Timed out fetching page after 10s'
		);
		expect(fetchMock).toHaveBeenCalledOnce();
	});

	test('does not retry invalid content types', async () => {
		const fetchMock = vi.fn().mockResolvedValue(response(200, { contentType: 'application/json' }));
		vi.stubGlobal('fetch', fetchMock);

		await expect(fetchPageWithRetry('https://example.com', DEFAULT_UA)).rejects.toThrow(
			'Not an HTML page (content-type: application/json)'
		);
		expect(fetchMock).toHaveBeenCalledOnce();
	});

	test('does not retry oversized responses', async () => {
		const fetchMock = vi.fn().mockResolvedValue(response(200, { contentLength: String(6 * 1024 * 1024) }));
		vi.stubGlobal('fetch', fetchMock);

		await expect(fetchPageWithRetry('https://example.com', DEFAULT_UA)).rejects.toThrow(
			'Page too large (6MB, max 5MB)'
		);
		expect(fetchMock).toHaveBeenCalledOnce();
	});
});
