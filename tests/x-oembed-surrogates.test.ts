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
