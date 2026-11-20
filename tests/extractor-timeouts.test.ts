import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';
import Defuddle from '../src/index';
import { parseDocument } from './helpers';

// A server that accepts the request and never answers, so only the fetch signal ends it.
function stalledFetch() {
	return vi.fn((_url: string, init?: RequestInit) => new Promise<Response>((_resolve, reject) => {
		const signal = init?.signal;
		if (!signal) return;
		if (signal.aborted) reject(signal.reason);
		signal.addEventListener('abort', () => reject(signal.reason));
	}));
}

describe('async extractors time out stalled fetches', () => {
	beforeEach(() => {
		vi.spyOn(AbortSignal, 'timeout').mockImplementation(() => AbortSignal.abort(new DOMException('Timed out', 'TimeoutError')));
		vi.spyOn(console, 'error').mockImplementation(() => {});
	});

	afterEach(() => {
		vi.restoreAllMocks();
	});

	test('C2 Wiki', async () => {
		const url = 'https://wiki.c2.com/?HarborPattern';
		const fetch = stalledFetch();
		const doc = parseDocument('<html><head><title>Harbor Pattern</title></head><body><p>Loading the page.</p></body></html>', url);

		await new Defuddle(doc, { url, fetch }).parseAsync();

		expect(fetch).toHaveBeenCalledWith(expect.stringContaining('c2.com/wiki/remodel/pages/HarborPattern'), expect.objectContaining({ signal: expect.any(AbortSignal) }));
	}, 2000);

	test('X FxTwitter and oEmbed', async () => {
		const url = 'https://x.com/sam/status/1234567890';
		const fetch = stalledFetch();
		const doc = parseDocument('<html><head><title>X</title></head><body><div id="react-root"></div></body></html>', url);

		await new Defuddle(doc, { url, fetch }).parseAsync();

		const urls = fetch.mock.calls.map(([requestUrl]) => requestUrl);
		expect(urls).toContainEqual(expect.stringContaining('api.fxtwitter.com'));
		expect(urls).toContainEqual(expect.stringContaining('publish.twitter.com/oembed'));
		for (const [, init] of fetch.mock.calls) {
			expect(init?.signal).toBeInstanceOf(AbortSignal);
		}
	}, 2000);
});
