import { describe, test, expect } from 'vitest';
import { readFileSync } from 'fs';
import { join } from 'path';

describe('fetch charset robustness', () => {
	test('CLI does not crash on malformed charset values in content-type', async () => {
		const fixturePath = join(__dirname, 'fixtures', 'general--stephango.com-buy-wisely.html');
		const fixtureHtml = readFileSync(fixturePath, 'utf-8');

		const response = new Response(fixtureHtml, {
			headers: {
				'content-type': 'text/html; charset=utf-8,',
			},
		});

		const originalFetch = globalThis.fetch;
		globalThis.fetch = async () => response as any;

		try {
			const { fetchPage } = await import('../src/fetch');
			const html = await fetchPage('https://example.com/article', 'Mozilla/5.0');
			expect(html).toContain('Buy wisely');
		} finally {
			globalThis.fetch = originalFetch;
		}
	});
});
