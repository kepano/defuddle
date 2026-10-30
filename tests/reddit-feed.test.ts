import { describe, test, expect, vi } from 'vitest';
import { parseLinkedomHTML } from '../src/utils/linkedom-compat';
import { RedditExtractor } from '../src/extractors/reddit';

// old.reddit.com serves anonymous clients a login wall instead of content, so
// the extractor falls back to Reddit's Atom feed. These cover that fallback,
// the login-wall detection that triggers it, and the request cache that keeps
// the pipeline's repeated extractor construction from tripping Reddit's rate
// limit. The extractor caches by URL at module scope, so each test uses a
// distinct post id to stay isolated.

function feed(postId: string, comments: Array<{ id: string; author: string; body: string }>): string {
	const entries = comments.map(c => `
	<entry>
		<author><name>/u/${c.author}</name><uri>https://www.reddit.com/user/${c.author}</uri></author>
		<content type="html">&lt;!-- SC_OFF --&gt;&lt;div class="md"&gt;&lt;p&gt;${c.body}&lt;/p&gt;&lt;/div&gt;&lt;!-- SC_ON --&gt;</content>
		<id>t1_${c.id}</id>
		<link href="https://www.reddit.com/r/testsub/comments/${postId}/a_post/${c.id}/"/>
		<updated>2026-07-20T10:00:00+00:00</updated>
		<title>/u/${c.author} on A post title</title>
	</entry>`).join('');

	return `<?xml version="1.0" encoding="UTF-8"?>
<feed xmlns="http://www.w3.org/2005/Atom">
	<title>A post title : testsub</title>
	<entry>
		<author><name>/u/postauthor</name><uri>https://www.reddit.com/user/postauthor</uri></author>
		<content type="html">&lt;!-- SC_OFF --&gt;&lt;div class="md"&gt;&lt;p&gt;The original post body.&lt;/p&gt;&lt;/div&gt;&lt;!-- SC_ON --&gt;</content>
		<id>t3_${postId}</id>
		<link href="https://www.reddit.com/r/testsub/comments/${postId}/a_post/"/>
		<updated>2026-07-20T09:00:00+00:00</updated>
		<title>A post title</title>
	</entry>${entries}
</feed>`;
}

const LOGIN_HTML = '<html><head><title>Welcome to Reddit</title></head><body><form id="login"></form></body></html>';

function page(body: string, init: { ok?: boolean; status?: number; url?: string } = {}) {
	return {
		ok: init.ok ?? true,
		status: init.status ?? 200,
		url: init.url ?? '',
		text: () => Promise.resolve(body),
	};
}

// Mirrors Reddit today: old.reddit.com redirects to /login/, the feed serves content.
function redditFetch(postId: string, comments: Array<{ id: string; author: string; body: string }> = []) {
	return vi.fn(async (url: string) => {
		if (url.includes('old.reddit.com')) {
			return page(LOGIN_HTML, { url: 'https://old.reddit.com/login/?reason=lor2' });
		}
		if (url.includes('.rss')) return page(feed(postId, comments));
		throw new Error(`unexpected request: ${url}`);
	});
}

function extractorFor(postId: string, fetch: any) {
	const document = parseLinkedomHTML('<html><body><shreddit-post></shreddit-post></body></html>');
	const url = `https://www.reddit.com/r/testsub/comments/${postId}/a_post/`;
	return new RedditExtractor(document, url, undefined, { fetch });
}

describe('reddit feed fallback', () => {
	test('falls back to the feed when old.reddit.com serves a login wall', async () => {
		const fetch = redditFetch('aaa001', [
			{ id: 'c1', author: 'commenter_one', body: 'MARKER_FIRST_COMMENT' },
			{ id: 'c2', author: 'commenter_two', body: 'MARKER_SECOND_COMMENT' },
		]);
		const result = await extractorFor('aaa001', fetch).extractAsync();

		expect(result.variables.title).toBe('A post title');
		expect(result.variables.author).toBe('postauthor');
		expect(result.variables.site).toBe('r/testsub');
		expect(result.content).toContain('The original post body.');
		expect(result.content).toContain('MARKER_FIRST_COMMENT');
		expect(result.content).toContain('MARKER_SECOND_COMMENT');
		expect(result.content).toContain('commenter_one');
		// The escaped markup in the feed must survive as real HTML, not text.
		expect(result.content).not.toContain('&lt;p&gt;');
	});

	test('includeReplies: false drops feed comments', async () => {
		const fetch = redditFetch('aaa002', [{ id: 'c1', author: 'commenter_one', body: 'MARKER_COMMENT' }]);
		const document = parseLinkedomHTML('<html><body><shreddit-post></shreddit-post></body></html>');
		const url = 'https://www.reddit.com/r/testsub/comments/aaa002/a_post/';
		const extractor = new RedditExtractor(document, url, undefined, { fetch, includeReplies: false });

		const result = await extractor.extractAsync();

		expect(result.content).toContain('The original post body.');
		expect(result.content).not.toContain('MARKER_COMMENT');
	});

	test('prefers old.reddit.com when it returns real content', async () => {
		// An authenticated options.fetch still reaches the post, which carries
		// scores and nesting the feed lacks.
		const fetch = vi.fn(async (url: string) => {
			if (url.includes('old.reddit.com')) {
				return page(`<html><body>
					<div class="thing link" data-author="postauthor" data-subreddit="testsub">
						<a class="title" href="/x">A post title</a>
						<div class="usertext-body"><div class="md"><p>OLD_REDDIT_BODY</p></div></div>
					</div>
				</body></html>`, { url });
			}
			throw new Error(`feed should not be requested: ${url}`);
		});

		const result = await extractorFor('aaa003', fetch).extractAsync();

		expect(result.content).toContain('OLD_REDDIT_BODY');
		expect(fetch).toHaveBeenCalledOnce();
	});

	test('repeated extraction issues one request per URL', async () => {
		// parseAsync() tries two finders and the CLI reparses with a bot UA, so
		// the extractor is constructed up to four times for one user-facing
		// parse. Reddit throttles the feed hard enough that the uncached retries
		// caused the very 429 they were retrying against. The cache only covers
		// the default path, so this drives it through the global fetch.
		const fetch = redditFetch('aaa004', [{ id: 'c1', author: 'commenter_one', body: 'MARKER' }]);
		vi.stubGlobal('fetch', fetch);

		try {
			for (let i = 0; i < 4; i++) {
				const document = parseLinkedomHTML('<html><body><shreddit-post></shreddit-post></body></html>');
				const url = 'https://www.reddit.com/r/testsub/comments/aaa004/a_post/';
				const result = await new RedditExtractor(document, url).extractAsync();
				expect(result.content).toContain('MARKER');
			}
		} finally {
			vi.unstubAllGlobals();
		}

		const requested = fetch.mock.calls.map(c => c[0] as string);
		expect(requested.filter(u => u.includes('.rss'))).toHaveLength(1);
		expect(requested.filter(u => u.includes('old.reddit.com'))).toHaveLength(1);
	});

	test('a caller-supplied fetch bypasses the shared cache', async () => {
		// The cache is keyed by URL alone, so reusing it across callers would
		// let an authenticated response and an anonymous one be served to each
		// other.
		const fetch = redditFetch('aaa008', [{ id: 'c1', author: 'commenter_one', body: 'MARKER' }]);

		await extractorFor('aaa008', fetch).extractAsync();
		await extractorFor('aaa008', fetch).extractAsync();

		const requested = fetch.mock.calls.map(c => c[0] as string);
		expect(requested.filter(u => u.includes('.rss'))).toHaveLength(2);
	});

	test('always sends a non-empty User-Agent', async () => {
		// Reddit 403s requests with no User-Agent. Node's fetch supplies one
		// implicitly but workerd does not, so the Worker got a login page until
		// the extractor set this itself.
		const fetch = redditFetch('aaa006', [{ id: 'c1', author: 'commenter_one', body: 'MARKER' }]);
		await extractorFor('aaa006', fetch).extractAsync();

		expect(fetch.mock.calls.length).toBeGreaterThan(0);
		for (const [, init] of fetch.mock.calls as unknown as Array<[string, RequestInit]>) {
			const headers = init?.headers as Record<string, string> | undefined;
			expect(headers?.['User-Agent']).toBeTruthy();
		}
	});

	test('asks the feed URL for a feed', async () => {
		const fetch = redditFetch('aaa007');
		await extractorFor('aaa007', fetch).extractAsync();

		const feedCall = (fetch.mock.calls as unknown as Array<[string, RequestInit]>)
			.find(([requested]) => requested.includes('.rss'));
		const headers = feedCall?.[1]?.headers as Record<string, string>;
		expect(headers['Accept']).toContain('atom');
	});

	test('surfaces the feed status when Reddit blocks the request', async () => {
		const fetch = vi.fn(async (url: string) => {
			if (url.includes('old.reddit.com')) {
				return page(LOGIN_HTML, { url: 'https://old.reddit.com/login/' });
			}
			return page('', { ok: false, status: 429 });
		});

		await expect(extractorFor('aaa005', fetch).extractAsync())
			.rejects.toThrow('Failed to fetch www.reddit.com: 429');
	});
});
