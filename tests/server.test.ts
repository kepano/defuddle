import { describe, test, expect, beforeAll } from 'vitest';
import { readFileSync } from 'fs';
import { join } from 'path';

const SERVER_URL = 'http://localhost:8787';

/**
 * Integration tests that hit the local wrangler dev server.
 * These are skipped automatically when the server isn't running.
 *
 * To run:
 *   1. cd website && npx wrangler dev --port 8787
 *   2. npm test
 */

let serverAvailable = false;

function loadExpected(name: string): string {
	return readFileSync(join(__dirname, 'expected', name), 'utf-8');
}

beforeAll(async () => {
	try {
		const res = await fetch(SERVER_URL, { signal: AbortSignal.timeout(2000) });
		serverAvailable = res.ok;
	} catch {
		serverAvailable = false;
	}
});

function serverTest(name: string, fn: () => Promise<void>) {
	test(name, async () => {
		if (!serverAvailable) {
			return; // silently skip
		}
		await fn();
	});
}

describe('Server integration tests', () => {
	test('server availability check', () => {
		if (!serverAvailable) {
			console.log('Wrangler dev server not running — skipping server tests');
		}
	});

	serverTest('x.com tweet extracts content', async () => {
		const res = await fetch(`${SERVER_URL}/x.com/kepano/status/1675626836821409792`);
		const text = await res.text();
		const expected = loadExpected('x.com-kepano-1675626836821409792.md');

		expect(res.status).toBe(200);
		expect(text.trim()).toEqual(expected.trim());
	});

serverTest('reddit post extracts content', async () => {
		const res = await fetch(`${SERVER_URL}/www.reddit.com/r/ObsidianMD/comments/1nvmgpp/obsidian_october_2025/`);
		const text = await res.text();
		const expected = loadExpected('reddit-obsidian-october-2025.md');

		expect(res.status).toBe(200);
		// Compare only the post body — comments are dynamic
		const bodyOnly = text.split('\n---\n\n## Comments')[0];
		expect(bodyOnly.trim()).toEqual(expected.trim());
	});
});
