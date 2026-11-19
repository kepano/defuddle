import { describe, test, expect, vi } from 'vitest';
import { Defuddle } from '../src/node';
import { parseLinkedomHTML } from '../src/utils/linkedom-compat';

/**
 * TwitterExtractor resilience tests.
 *
 * Two bugs disabled the extractor entirely, so every X page fell through to the
 * generic extractor:
 *
 * 1. The boundary scan referenced the bare `Node` global
 *    (`Node.DOCUMENT_POSITION_FOLLOWING`). `Node` exists in browsers but not
 *    under linkedom, so the constructor threw `ReferenceError: Node is not
 *    defined` inside ExtractorRegistry.findByPredicate's try/catch, which
 *    swallowed it and returned null. Broke the CLI and the Worker.
 *
 * 2. X started rendering a "Post" heading above the timeline and wrapping the
 *    conversation in a `<section>`. The boundary was taken as the first
 *    `section`/`h2`, so one of those became the boundary, every cell counted as
 *    past it, and the walk broke before reading a single tweet. Broke the
 *    browser extension.
 *
 * These cover both markup generations plus the degraded paths.
 */

const tweet = (handle: string, name: string, text: string, id: string, date = '2026-01-02T03:04:05.000Z') => `
	<article data-testid="tweet">
		<div data-testid="User-Name">
			<a href="/${handle}"><span>${name}</span></a>
			<a href="/${handle}"><span>@${handle}</span></a>
			<a href="/${handle}/status/${id}"><time datetime="${date}">Jan 2</time></a>
		</div>
		<div data-testid="tweetText">${text}</div>
	</article>`;

const cell = (...args: Parameters<typeof tweet>) => `<div data-testid="cellInnerDiv">${tweet(...args)}</div>`;

const MAIN = cell('examplename', 'Example Name', 'Durable formats outlast the apps that read them.', '1001');
const SELF_REPLY = cell('examplename', 'Example Name', 'A follow-up in the same thread.', '1002');
const REPLY = cell('otherperson', 'Other Person', 'A reply from someone else.', '1003');
const DISCOVER = cell('unrelated', 'Unrelated Account', 'Promoted content past the boundary.', '1004');

const page = (body: string) => `<!doctype html><html><body>${body}</body></html>`;
const url = 'https://x.com/examplename/status/1001';

// Keep these tests hermetic: for /status/<id> URLs the async X extractors
// otherwise hit publish.twitter.com/api.fxtwitter.com over the live network,
// which is slow and nondeterministic — a placeholder id can collide with a real
// tweet (see #272). Failing the fetch forces the DOM-extraction path under test.
const offlineFetch = (() => Promise.reject(new Error('network disabled in tests'))) as unknown as typeof fetch;

async function parse(body: string) {
	const doc = parseLinkedomHTML(page(body), url);
	const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
	try {
		const result = await Defuddle(doc, url, { markdown: false, fetch: offlineFetch });
		return { result, errors: errorSpy.mock.calls.flat().map(String) };
	} finally {
		errorSpy.mockRestore();
	}
}

describe('TwitterExtractor markup resilience', () => {
	test('current markup: "Post" heading above a conversation <section>', async () => {
		const { result, errors } = await parse(`
			<div aria-label="Timeline: Conversation">
				<div><h2>Post</h2></div>
				<section>
					<div>${MAIN}${SELF_REPLY}${REPLY}</div>
				</section>
			</div>`);

		expect(errors.some(e => e.includes('Node is not defined'))).toBe(false);
		expect(result.content).toContain('twitter post');
		expect(result.author).toBe('@examplename');

		// Main tweet and self-reply are post content; the other person is a reply.
		expect(result.content).toContain('Durable formats outlast the apps that read them.');
		expect(result.content).toContain('A follow-up in the same thread.');
		expect(result.content).toContain('A reply from someone else.');
	});

	test('legacy markup: trailing "Discover more" section is excluded', async () => {
		const { result } = await parse(`
			<div aria-label="Timeline: Conversation">
				${MAIN}${SELF_REPLY}${REPLY}
				<div>
					<section><h2>Discover more</h2>${DISCOVER}</section>
				</div>
			</div>`);

		expect(result.content).toContain('twitter post');
		expect(result.content).toContain('Durable formats outlast the apps that read them.');
		expect(result.content).toContain('A reply from someone else.');
		expect(result.content).not.toContain('Promoted content past the boundary.');
	});

	test('no boundary section at all: every tweet is kept', async () => {
		const { result } = await parse(`
			<div aria-label="Timeline: Conversation">${MAIN}${SELF_REPLY}${REPLY}</div>`);

		expect(result.content).toContain('Durable formats outlast the apps that read them.');
		expect(result.content).toContain('A follow-up in the same thread.');
		expect(result.content).toContain('A reply from someone else.');
	});

	test('handle survives a reordered name block', async () => {
		// Verified badge link first, handle as plain text rather than a link:
		// `links[1]` would have returned the badge and broken thread detection.
		const reordered = `
			<div data-testid="cellInnerDiv">
				<article data-testid="tweet">
					<div data-testid="User-Name">
						<a href="/i/verified-badge"><span>Verified</span></a>
						<a href="/examplename"><span>Example Name</span></a>
						<span>@examplename</span>
						<a href="/examplename/status/1005"><time datetime="2026-01-02T05:04:05.000Z">Jan 2</time></a>
					</div>
					<div data-testid="tweetText">Second post in the thread.</div>
				</article>
			</div>`;

		const { result } = await parse(`
			<div aria-label="Timeline: Conversation">${MAIN}${reordered}${REPLY}</div>`);

		expect(result.author).toBe('@examplename');
		// Must land in post content, not in the comments block: with `links[1]`
		// the handle read as "Example Name", the self-reply looked like a
		// stranger's reply, and the thread was demoted into the comments.
		const body = String(result.content);
		expect(body.indexOf('Second post in the thread.')).toBeLessThan(body.indexOf('twitter comments'));
	});

	test('DOM thread wins over the async single-tweet path, even detached', async () => {
		// Regression: a reader view parses the page into a detached document
		// (defaultView !== window), which used to flip XOembedExtractor to
		// prefer the async oEmbed/FxTwitter path. That path returns only the
		// single main tweet, so the thread self-replies and the replies were
		// silently dropped — the popup showed the whole thread but the reader
		// showed just the first post. Here the async fetch SUCCEEDS (unlike the
		// other hermetic tests): the DOM still has to win because it is richer.
		const singleTweetFetch = (async (input: string | URL) => {
			const target = String(input);
			if (target.includes('api.fxtwitter.com')) {
				return {
					ok: true,
					status: 200,
					json: async () => ({
						code: 200,
						tweet: {
							text: 'Durable formats outlast the apps that read them.',
							author: { name: 'Example Name', screen_name: 'examplename' },
						},
					}),
				};
			}
			return { ok: false, status: 404, json: async () => ({}) };
		}) as unknown as typeof fetch;

		const doc = parseLinkedomHTML(page(`
			<div aria-label="Timeline: Conversation">${MAIN}${SELF_REPLY}${REPLY}</div>`), url);
		const result = await Defuddle(doc, url, { markdown: false, fetch: singleTweetFetch });

		// The self-reply (thread) and the stranger's reply only exist in the DOM
		// path — the async single-tweet result has neither.
		expect(result.content).toContain('A follow-up in the same thread.');
		expect(result.content).toContain('A reply from someone else.');
		expect(result.content).toContain('twitter comments');
	});

	test('falls back to a single tweet when there is no timeline', async () => {
		const { result } = await parse(`
			<div>${tweet('examplename', 'Example Name', 'A single tweet with no surrounding timeline.', '1001')}</div>`);

		expect(result.content).toContain('twitter post');
		expect(result.content).toContain('A single tweet with no surrounding timeline.');
		expect(result.author).toBe('@examplename');
	});
});

// The X web app released in late 2026: no data-testid attributes, no <time>,
// and one list item per conversation entry. Snowflake IDs carry the date.
const post = (handle: string, name: string, text: string, id: string, inner = '') => `
	<article>
		<div data-post-avatar="true"><a href="/${handle}"><img alt="@${handle}" src="https://pbs.twimg.com/profile_images/1/a_normal.jpg"></a></div>
		<div>
			<span><a href="/${handle}"><div dir="auto">${name}</div></a></span>
			<span><a href="/${handle}"><span>@${handle}</span></a></span>
			<span><a href="/${handle}/status/${id}">Nov 11</a></span>
		</div>
		<div dir="auto" lang="en"><span>${text}</span></div>
		${inner}
		<div role="group" aria-label="1 reply, 2 likes, 1000 views">
			<div data-engagement-action="reply"><a href="/compose/post?in_reply_to=${id}"><span>1</span></a></div>
		</div>
	</article>`;

const quoted = (handle: string, name: string, text: string, id: string) => `
	<div role="link" data-href="/${handle}/status/${id}" data-slot="embedded-tweet-frame">
		<a href="/${handle}/status/${id}" tabindex="-1"></a>
		${post(handle, name, text, id)}
	</div>`;

const redesignUrl = 'https://x.com/examplename/status/2120597035028255136';

async function parseRedesign(items: string[]) {
	const doc = parseLinkedomHTML(page(`
		<main>
			<section aria-labelledby="conversation">
				<h2 id="conversation">Conversation</h2>
				<div><ul>${items.map(item => `<li>${item}</li>`).join('')}</ul></div>
			</section>
		</main>`), redesignUrl);
	return Defuddle(doc, redesignUrl, { markdown: true, fetch: offlineFetch });
}

describe('TwitterExtractor on the redesigned X', () => {
	test('main post, quoted post, thread and nested replies', async () => {
		const result = await parseRedesign([
			`<div tabindex="-1">${post('examplename', 'Example Name', 'Durable formats outlast the apps that read them.', '2120597035028255136',
				quoted('olderaccount', 'Older Account', 'The original quoted post.', '1688610782509211648'))}</div>`,
			`<div><div role="link">${post('examplename', 'Example Name', 'A follow-up in the same thread.', '2120597400000000000')}</div></div>`,
			`<div><div role="link">${post('otherperson', 'Other Person', 'A reply from someone else.', '2120605895327367229')}</div>
			<div><div role="link">${post('examplename', 'Example Name', 'An answer to that reply.', '2120607651264647225')}</div></div>`,
			`<div><div role="link">${post('thirdperson', 'Third Person', 'A separate reply.', '2120612584806302007')}</div></div>`,
		]);

		const md = String(result.content);
		expect(result.author).toBe('@examplename');
		expect(md).toContain('> **Older Account @olderaccount** · 2023-08-07');
		expect(md.indexOf('A follow-up in the same thread.')).toBeLessThan(md.indexOf('## Comments'));
		expect(md).toContain('> **Other Person @otherperson** · [2026-11-11](https://x.com/otherperson/status/2120605895327367229)');
		expect(md).toContain('> > **Example Name @examplename** · [2026-11-11](https://x.com/examplename/status/2120607651264647225)');
		expect(md).toContain('> **Third Person @thirdperson**');
		// Engagement counts and the reply composer link stay out.
		expect(md).not.toContain('in_reply_to');
		expect(md).not.toContain('Nov 11');
	});

	test('mentions in the text are not read as the author', async () => {
		const result = await parseRedesign([
			post('examplename', 'Example Name', 'Durable formats.', '2120597035028255136'),
			post('otherperson', 'Other Person', '<span>Thanks </span><span><a href="/examplename">@examplename</a></span>', '2120605895327367229'),
		]);

		expect(String(result.content)).toContain('**Other Person @otherperson**');
		expect(String(result.content)).toContain('Thanks @examplename');
	});
});
