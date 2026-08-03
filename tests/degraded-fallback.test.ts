import { describe, test, expect, vi, beforeEach } from 'vitest';
import { parseDocument } from './helpers';

/**
 * When any pipeline step throws, parseInternal() catches it and returns the whole
 * <body> via the fallback path. That result carries a word count for the entire
 * page — nav, sidebars, footer — which is typically far larger than a real
 * extraction of the same page.
 *
 * Two things must not happen as a result:
 *   1. its inflated count must not satisfy the retry gates, skipping the retries
 *      that would have found real content
 *   2. it must not win a retry comparison against a real extraction
 *
 * These tests force a throw in standardizeContent on the first parse only, so the
 * first attempt degrades and the retry succeeds.
 */

const { throwOnNextCall } = vi.hoisted(() => ({ throwOnNextCall: { value: false } }));

vi.mock('../src/standardize', async (importOriginal) => {
	const actual = await importOriginal<typeof import('../src/standardize')>();
	return {
		...actual,
		standardizeContent: (...args: Parameters<typeof actual.standardizeContent>) => {
			if (throwOnNextCall.value) {
				throwOnNextCall.value = false;
				throw new Error('simulated pipeline failure');
			}
			return actual.standardizeContent(...args);
		}
	};
});

const PARA = '<p>This is a substantial paragraph of genuine article body text that a content '
	+ 'extractor should confidently identify as the main content of this page rather than '
	+ 'as surrounding navigation or boilerplate chrome.</p>';

const HTML = `<!doctype html><html><head><title>Test Article</title></head><body>
	<nav><a href="/">Home</a><a href="/a">Alpha</a><a href="/b">Beta</a><a href="/c">Gamma</a></nav>
	<div class="content-body"><h1>Test Article</h1>${PARA.repeat(8)}</div>
	<footer><p>Copyright 2026 Example Inc. All rights reserved. Privacy Policy. Terms of Service.</p></footer>
</body></html>`;

async function parseWithFirstParseThrowing() {
	const { Defuddle } = await import('../src/node');
	const doc = parseDocument(HTML, 'https://example.com/');
	throwOnNextCall.value = true;
	const res = await Defuddle(doc, 'https://example.com/');
	throwOnNextCall.value = false;
	return res;
}

describe('degraded whole-<body> fallback', () => {
	beforeEach(() => {
		throwOnNextCall.value = false;
		vi.restoreAllMocks();
	});

	test('a throwing first parse still retries and returns real content', async () => {
		const res = await parseWithFirstParseThrowing();

		// The retry succeeded, so boilerplate outside the content div must be gone.
		expect(res.content).not.toContain('Copyright 2026');
		expect(res.content).not.toContain('Gamma');
		expect(res.content).toContain('substantial paragraph');
	});

	test('control: without a throw, output is identical', async () => {
		const { Defuddle } = await import('../src/node');
		const doc = parseDocument(HTML, 'https://example.com/');
		const clean = await Defuddle(doc, 'https://example.com/');
		const degradedThenRetried = await parseWithFirstParseThrowing();

		expect(degradedThenRetried.content).toEqual(clean.content);
	});
});
