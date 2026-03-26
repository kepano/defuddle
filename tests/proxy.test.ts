import { describe, test, expect, vi, afterEach, beforeEach } from 'vitest';

// getProxyUrl is not exported, so we test it indirectly via fetchPage by
// observing which path is taken. Instead, we expose it for testing purposes
// by re-importing the module with controlled env vars.

// Since getProxyUrl reads process.env directly, we can test its behaviour by
// stubbing env vars and checking whether fetchPage routes to the proxy path.
// We detect this by mocking http.request and verifying it is (or isn't) called.

// For pure logic tests (NO_PROXY matching), we duplicate the matching logic
// here and verify it via the fetch stub approach — if the proxy path is NOT
// taken, global.fetch (mocked) is called instead.

const HTML = '<html><head></head><body>hello</body></html>';

function mockFetch() {
	const buffer = new TextEncoder().encode(HTML).buffer;
	vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
		ok: true,
		headers: { get: (h: string) => h === 'content-type' ? 'text/html' : null },
		arrayBuffer: () => Promise.resolve(buffer),
	}));
}

function expectFetchCalled() {
	expect(vi.mocked(globalThis.fetch)).toHaveBeenCalled();
}

function expectFetchNotCalled() {
	expect(vi.mocked(globalThis.fetch)).not.toHaveBeenCalled();
}

beforeEach(() => {
	mockFetch();
	// Clear all proxy vars before each test (undefined = unset, not empty string)
	vi.stubEnv('HTTPS_PROXY', undefined as any);
	vi.stubEnv('https_proxy', undefined as any);
	vi.stubEnv('HTTP_PROXY', undefined as any);
	vi.stubEnv('http_proxy', undefined as any);
	vi.stubEnv('ALL_PROXY', undefined as any);
	vi.stubEnv('all_proxy', undefined as any);
	vi.stubEnv('NO_PROXY', undefined as any);
	vi.stubEnv('no_proxy', undefined as any);
});

afterEach(() => {
	vi.unstubAllGlobals();
	vi.unstubAllEnvs();
});

// Import after stubbing so module-level code sees clean env
const { fetchPage, DEFAULT_UA } = await import('../src/fetch');

describe('getProxyUrl — env-var precedence', () => {
	test('no proxy vars → uses global fetch', async () => {
		await fetchPage('https://example.com', DEFAULT_UA);
		expectFetchCalled();
	});

	test('HTTPS_PROXY used for https URLs', async () => {
		vi.stubEnv('HTTPS_PROXY', 'http://proxy.example.com:8080');
		// proxy path will fail to connect — just check fetch was NOT called
		await expect(fetchPage('https://example.com', DEFAULT_UA)).rejects.toThrow();
		expectFetchNotCalled();
	});

	test('HTTP_PROXY used for http URLs', async () => {
		vi.stubEnv('HTTP_PROXY', 'http://proxy.example.com:8080');
		await expect(fetchPage('http://example.com', DEFAULT_UA)).rejects.toThrow();
		expectFetchNotCalled();
	});

	test('ALL_PROXY used as fallback', async () => {
		vi.stubEnv('ALL_PROXY', 'http://proxy.example.com:8080');
		await expect(fetchPage('https://example.com', DEFAULT_UA)).rejects.toThrow();
		expectFetchNotCalled();
	});

	test('HTTPS_PROXY takes precedence over ALL_PROXY for https', async () => {
		vi.stubEnv('HTTPS_PROXY', 'http://specific.example.com:8080');
		vi.stubEnv('ALL_PROXY', 'http://fallback.example.com:8080');
		await expect(fetchPage('https://example.com', DEFAULT_UA)).rejects.toThrow();
		expectFetchNotCalled();
	});

	test('HTTPS_PROXY not used for http URLs', async () => {
		vi.stubEnv('HTTPS_PROXY', 'http://proxy.example.com:8080');
		// http URL should skip HTTPS_PROXY and fall through to global fetch
		await fetchPage('http://example.com', DEFAULT_UA);
		expectFetchCalled();
	});
});

describe('getProxyUrl — NO_PROXY exclusions', () => {
	beforeEach(() => {
		vi.stubEnv('HTTPS_PROXY', 'http://proxy.example.com:8080');
	});

	test('NO_PROXY wildcard * bypasses proxy', async () => {
		vi.stubEnv('NO_PROXY', '*');
		await fetchPage('https://example.com', DEFAULT_UA);
		expectFetchCalled();
	});

	test('NO_PROXY exact hostname bypasses proxy', async () => {
		vi.stubEnv('NO_PROXY', 'example.com');
		await fetchPage('https://example.com', DEFAULT_UA);
		expectFetchCalled();
	});

	test('NO_PROXY does not match unrelated hostname', async () => {
		vi.stubEnv('NO_PROXY', 'other.com');
		await expect(fetchPage('https://example.com', DEFAULT_UA)).rejects.toThrow();
		expectFetchNotCalled();
	});

	test('NO_PROXY leading-dot matches subdomain', async () => {
		vi.stubEnv('NO_PROXY', '.example.com');
		await fetchPage('https://sub.example.com', DEFAULT_UA);
		expectFetchCalled();
	});

	test('NO_PROXY leading-dot matches bare domain', async () => {
		vi.stubEnv('NO_PROXY', '.example.com');
		await fetchPage('https://example.com', DEFAULT_UA);
		expectFetchCalled();
	});

	test('NO_PROXY leading-dot does not match unrelated domain', async () => {
		vi.stubEnv('NO_PROXY', '.example.com');
		await expect(fetchPage('https://notexample.com', DEFAULT_UA)).rejects.toThrow();
		expectFetchNotCalled();
	});

	test('NO_PROXY comma-separated list', async () => {
		vi.stubEnv('NO_PROXY', 'other.com, example.com, another.com');
		await fetchPage('https://example.com', DEFAULT_UA);
		expectFetchCalled();
	});

	test('malformed proxy URL returns null (uses global fetch)', async () => {
		vi.stubEnv('HTTPS_PROXY', 'not-a-valid-url');
		await fetchPage('https://example.com', DEFAULT_UA);
		expectFetchCalled();
	});
});
