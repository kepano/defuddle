import { describe, test, expect } from 'vitest';
import { Defuddle } from '../src/node';
import { parseLinkedomHTML } from '../src/utils/linkedom-compat';

/**
 * Tests for FxTwitter facet index adjustment in XOembedExtractor.
 *
 * FxTwitter returns facet indices in Unicode code points (emoji = 1),
 * but JavaScript string operations use UTF-16 code units (emoji = 2
 * for surrogate-pair characters such as 🦞, 🩺, 🔌, 🌐).
 *
 * When a tweet contains emoji before a url/mention facet, the indices
 * are off by the number of preceding surrogate pairs, producing broken
 * HTML like:
 *   <p>Small maintenance relea<a href="...">se:<br>...</a>oy7V</p>
 */

// Real FxTwitter API response for:
// https://x.com/openclaw/status/2052096219233587451
// This tweet contains 4 emoji (🦞, 🩺, 🔌, 🌐) before the t.co URL,
// causing a 4-unit offset between code-point and UTF-16 indices.
const TWEET_WITH_EMOJI = {
	code: 200,
	message: 'OK',
	tweet: {
		url: 'https://x.com/openclaw/status/2052096219233587451',
		id: '2052096219233587451',
		text: 'OpenClaw 2026.5.6 🦞\n\n🩺 doctor leaves Codex OAuth routes alone\n🔌 plugin fetch handles odd headers\n🌐 web_fetch cleans up timeouts\n\nSmall maintenance release:\nhttps://github.com/openclaw/openclaw/releases/tag/v2026.5.6',
		raw_text: {
			text: 'OpenClaw 2026.5.6 🦞\n\n🩺 doctor leaves Codex OAuth routes alone\n🔌 plugin fetch handles odd headers\n🌐 web_fetch cleans up timeouts\n\nSmall maintenance release:\nhttps://t.co/VkjTYkoy7V',
			display_text_range: [0, 179],
			facets: [
				{
					type: 'url',
					indices: [156, 179],
					original: 'https://t.co/VkjTYkoy7V',
					replacement: 'https://github.com/openclaw/openclaw/releases/tag/v2026.5.6',
					display: 'github.com/openclaw/openc…',
				},
			],
		},
		author: {
			screen_name: 'openclaw',
			name: 'OpenClaw🦞',
		},
		created_at: '2026-05-06T18:40:39.000Z',
	},
};

// A tweet WITHOUT emoji — indices should remain unchanged.
// Text: "Hello world!\n\nCheck this out:\nhttps://example.com/page"
// URL "https://example.com/page" occupies UTF-16 positions [30, 54).
const TWEET_NO_EMOJI = {
	code: 200,
	tweet: {
		url: 'https://x.com/testuser/status/999',
		id: '999',
		text: 'Hello world!\n\nCheck this out:\nhttps://example.com/page',
		raw_text: {
			text: 'Hello world!\n\nCheck this out:\nhttps://example.com/page',
			facets: [
				{
					type: 'url',
					indices: [30, 54],
					original: 'https://example.com/page',
					display: 'example.com/page',
				},
			],
		},
		author: {
			screen_name: 'testuser',
			name: 'Test User',
		},
		created_at: '2026-01-01T00:00:00.000Z',
	},
};

function mockFetchForTweet(tweetData: any) {
	return async (input: RequestInfo | URL, _init?: RequestInit) => {
		const url = typeof input === 'string' ? input : input instanceof URL ? input.toString() : input.url;
		if (url.includes('api.fxtwitter.com')) {
			return new Response(JSON.stringify(tweetData), {
				status: 200,
				headers: { 'Content-Type': 'application/json' },
			});
		}
		// Fall back to oEmbed for any other URL
		return new Response(JSON.stringify({ html: '' }), {
			status: 404,
			headers: { 'Content-Type': 'application/json' },
		});
	};
}

describe('XOembedExtractor — FxTwitter surrogate-pair index adjustment', () => {
	test('renders URL facet correctly when tweet contains emoji before the URL', async () => {
		const doc = parseLinkedomHTML(
			'<!DOCTYPE html><html><head><title>Test</title></head><body></body></html>',
			TWEET_WITH_EMOJI.tweet.url,
		);

		const result = await Defuddle(doc, TWEET_WITH_EMOJI.tweet.url, {
			fetch: mockFetchForTweet(TWEET_WITH_EMOJI),
		});

		// The content HTML must NOT contain the broken pattern
		// "relea<a ...>se:" (link splitting the word "release")
		expect(result.content).not.toMatch(/relea<a /);

		// The link must wrap the COMPLETE URL text
		expect(result.content).toMatch(
			/<a href="https:\/\/t\.co\/VkjTYkoy7V">https:\/\/t\.co\/VkjTYkoy7V<\/a>/,
		);
	});

	test('renders URL facet correctly when tweet contains no emoji', async () => {
		const doc = parseLinkedomHTML(
			'<!DOCTYPE html><html><head><title>Test</title></head><body></body></html>',
			TWEET_NO_EMOJI.tweet.url,
		);

		const result = await Defuddle(doc, TWEET_NO_EMOJI.tweet.url, {
			fetch: mockFetchForTweet(TWEET_NO_EMOJI),
		});

		expect(result.content).toMatch(
			/<a href="https:\/\/example\.com\/page">https:\/\/example\.com\/page<\/a>/,
		);
	});

	test('markdown output is clean when tweet has emoji before URL', async () => {
		const doc = parseLinkedomHTML(
			'<!DOCTYPE html><html><head><title>Test</title></head><body></body></html>',
			TWEET_WITH_EMOJI.tweet.url,
		);

		const result = await Defuddle(doc, TWEET_WITH_EMOJI.tweet.url, {
			fetch: mockFetchForTweet(TWEET_WITH_EMOJI),
			separateMarkdown: true,
		});

		// After fix, Turndown should produce valid markdown
		expect(result.contentMarkdown).not.toContain('relea[');
		expect(result.contentMarkdown).toContain(
			'[https://t.co/VkjTYkoy7V](https://t.co/VkjTYkoy7V)',
		);
	});
});

describe('XOembedExtractor — FxTwitter thread support and fallback', () => {
	const THREAD_API_RESPONSE = {
		code: 200,
		thread: [
			{
				url: 'https://x.com/testuser/status/123',
				id: '123',
				text: 'This is the first tweet of the thread.',
				author: {
					screen_name: 'testuser',
					name: 'Test User',
				},
				created_at: '2026-01-01T00:00:00.000Z',
			},
			{
				url: 'https://x.com/testuser/status/124',
				id: '124',
				text: 'This is the second tweet of the thread.',
				author: {
					screen_name: 'testuser',
					name: 'Test User',
				},
				created_at: '2026-01-01T00:01:00.000Z',
			},
		],
	};

	const SINGLE_TWEET_API_RESPONSE = {
		code: 200,
		tweet: {
			url: 'https://x.com/testuser/status/123',
			id: '123',
			text: 'This is the first tweet of the thread.',
			author: {
				screen_name: 'testuser',
				name: 'Test User',
			},
			created_at: '2026-01-01T00:00:00.000Z',
		},
	};

	function mockFetchForThreadFallback(threadData: any, tweetData: any, shouldThreadFail: boolean) {
		return async (input: RequestInfo | URL, _init?: RequestInit) => {
			const url = typeof input === 'string' ? input : input instanceof URL ? input.toString() : input.url;
			if (url.includes('/2/thread/')) {
				if (shouldThreadFail) {
					return new Response('Rate Limited', { status: 429 });
				}
				return new Response(JSON.stringify(threadData), {
					status: 200,
					headers: { 'Content-Type': 'application/json' },
				});
			}
			if (url.includes('/status/')) {
				return new Response(JSON.stringify(tweetData), {
					status: 200,
					headers: { 'Content-Type': 'application/json' },
				});
			}
			return new Response(JSON.stringify({ html: '<blockquote>oEmbed fallback</blockquote>', author_name: 'testuser', author_url: 'https://x.com/testuser' }), {
				status: 200,
				headers: { 'Content-Type': 'application/json' },
			});
		};
	}

	test('successfully fetches and renders full thread via v2 API', async () => {
		const doc = parseLinkedomHTML(
			'<!DOCTYPE html><html><head><title>Test</title></head><body></body></html>',
			'https://x.com/testuser/status/123',
		);

		const result = await Defuddle(doc, 'https://x.com/testuser/status/123', {
			fetch: mockFetchForThreadFallback(THREAD_API_RESPONSE, SINGLE_TWEET_API_RESPONSE, false),
		});

		expect(result.content).toContain('This is the first tweet of the thread.');
		expect(result.content).toContain('This is the second tweet of the thread.');
		expect(result.content).toContain('<hr>');
	});

	test('cascades to v1 single tweet when v2 rate limited (429)', async () => {
		const doc = parseLinkedomHTML(
			'<!DOCTYPE html><html><head><title>Test</title></head><body></body></html>',
			'https://x.com/testuser/status/123',
		);

		const result = await Defuddle(doc, 'https://x.com/testuser/status/123', {
			fetch: mockFetchForThreadFallback(THREAD_API_RESPONSE, SINGLE_TWEET_API_RESPONSE, true),
		});

		expect(result.content).toContain('This is the first tweet of the thread.');
		expect(result.content).not.toContain('This is the second tweet of the thread.');
	});

	test('cascades to oEmbed when both v2 and v1 fail', async () => {
		const doc = parseLinkedomHTML(
			'<!DOCTYPE html><html><head><title>Test</title></head><body></body></html>',
			'https://x.com/testuser/status/123',
		);

		const failingFetch = async (input: RequestInfo | URL, _init?: RequestInit) => {
			const url = typeof input === 'string' ? input : input instanceof URL ? input.toString() : input.url;
			if (url.includes('api.fxtwitter.com')) {
				return new Response('Fail', { status: 500 });
			}
			return new Response(JSON.stringify({
				html: '<blockquote><p>oEmbed fallback text</p></blockquote>',
				author_name: 'Test User',
				author_url: 'https://twitter.com/testuser',
				provider_name: 'Twitter'
			}), {
				status: 200,
				headers: { 'Content-Type': 'application/json' },
			});
		};

		const result = await Defuddle(doc, 'https://x.com/testuser/status/123', {
			fetch: failingFetch,
		});

		expect(result.content).toContain('oEmbed fallback text');
	});
});
