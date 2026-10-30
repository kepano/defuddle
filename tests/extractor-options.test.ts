import { describe, test, expect, vi } from 'vitest';
import { Defuddle } from '../src/node';
import { parseLinkedomHTML } from '../src/utils/linkedom-compat';
import { BaseExtractor, ExtractorOptions } from '../src/extractors/_base';
import { RedditExtractor } from '../src/extractors/reddit';
import { TwitterExtractor } from '../src/extractors/twitter';
import { XArticleExtractor } from '../src/extractors/x-article';
import { HackerNewsExtractor } from '../src/extractors/hackernews';
import { GitHubExtractor } from '../src/extractors/github';
import { ChatGPTExtractor } from '../src/extractors/chatgpt';
import { ClaudeExtractor } from '../src/extractors/claude';
import { GeminiExtractor } from '../src/extractors/gemini';
import { GrokExtractor } from '../src/extractors/grok';

// Regression tests for #347: several extractors declared a narrower constructor
// than ExtractorRegistry calls, so `schemaOrgData` and `options` were dropped on
// the way to `super()` and `this.options` was permanently `{}`. The failure was
// silent — `includeReplies: false` was ignored and an injected `options.fetch`
// was never used.

type ExtractorConstructor = new (
	document: Document,
	url: string,
	schemaOrgData?: any,
	options?: ExtractorOptions
) => BaseExtractor;

// Every extractor the registry can construct with four arguments. A narrower
// constructor here means the caller's options are silently discarded.
const EXTRACTORS: [string, ExtractorConstructor][] = [
	['reddit', RedditExtractor],
	['twitter', TwitterExtractor],
	['x-article', XArticleExtractor],
	['hackernews', HackerNewsExtractor],
	['github', GitHubExtractor],
	['chatgpt', ChatGPTExtractor],
	['claude', ClaudeExtractor],
	['gemini', GeminiExtractor],
	['grok', GrokExtractor],
];

const REDDIT_URL = 'https://www.reddit.com/r/PKMS/comments/1uqti0c/x/';

// Old-Reddit DOM shape, so prefersAsync() stays false and no fetch is attempted.
const OLD_REDDIT_HTML = `<!doctype html><html><body>
<div class="thing link" data-author="alice" data-subreddit="PKMS">
  <a class="title" href="/x">A post title</a>
  <div class="usertext-body"><div class="md"><p>The original post body.</p></div></div>
</div>
<div class="commentarea"><div class="sitetable">
  <div class="thing comment"><div class="entry">
    <div class="tagline"><span class="score unvoted">412 points</span><time datetime="2026-07-18T10:00:00Z">1d</time></div>
    <div class="usertext-body"><div class="md"><p>MARKER_COMMENT_TEXT</p></div></div>
  </div></div>
</div></div>
</body></html>`;

describe('extractor constructors forward schemaOrgData and options', () => {
	test.each(EXTRACTORS)('%s', (_name, Extractor) => {
		const document = parseLinkedomHTML('<html><body></body></html>');
		const schemaOrgData = { '@type': 'Article' };
		const options: ExtractorOptions = { includeReplies: false, language: 'fr' };

		const instance = new Extractor(document, 'https://example.com/', schemaOrgData, options) as any;

		expect(instance.options).toEqual(options);
		expect(instance.schemaOrgData).toBe(schemaOrgData);
	});
});

describe('includeReplies', () => {
	test('comments are included by default', async () => {
		const document = parseLinkedomHTML(OLD_REDDIT_HTML);
		const result = await Defuddle(document, REDDIT_URL, {});

		expect(result.extractorType).toBe('reddit');
		expect(result.content).toContain('MARKER_COMMENT_TEXT');
	});

	test('includeReplies: false drops comments', async () => {
		const document = parseLinkedomHTML(OLD_REDDIT_HTML);
		const result = await Defuddle(document, REDDIT_URL, { includeReplies: false });

		expect(result.extractorType).toBe('reddit');
		expect(result.content).not.toContain('MARKER_COMMENT_TEXT');
	});
});

describe('options.fetch', () => {
	test('RedditExtractor routes its requests through an injected fetch', async () => {
		const document = parseLinkedomHTML('<html><body><shreddit-post></shreddit-post></body></html>');
		const fetch = vi.fn().mockResolvedValue({
			ok: false,
			status: 403,
			url: '',
			text: () => Promise.resolve(''),
		});

		const extractor = new RedditExtractor(document, REDDIT_URL, undefined, { fetch: fetch as any });

		// Both sources refuse, so extraction fails — the assertion is that the
		// injected fetch was reached at all rather than globalThis.fetch.
		await expect(extractor.extractAsync()).rejects.toThrow('403');

		const requested = fetch.mock.calls.map(call => call[0] as string);
		expect(requested).toContain('https://old.reddit.com/r/PKMS/comments/1uqti0c/x/');
		expect(requested.some(url => url.endsWith('.rss'))).toBe(true);
	});
});
