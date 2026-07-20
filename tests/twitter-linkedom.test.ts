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

	test('falls back to a single tweet when there is no timeline', async () => {
		const { result } = await parse(`
			<div>${tweet('examplename', 'Example Name', 'A single tweet with no surrounding timeline.', '1001')}</div>`);

		expect(result.content).toContain('twitter post');
		expect(result.content).toContain('A single tweet with no surrounding timeline.');
		expect(result.author).toBe('@examplename');
	});
});
