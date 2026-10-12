import { describe, test, expect } from 'vitest';
import { Defuddle } from '../src/node';
import { parseDocument } from './helpers';

/**
 * These tests cover two defects in how the "section breadcrumb" pattern in
 * removeByContentPattern decided that a short element linked to a parent section of the
 * current page. It tested urlPath.startsWith(linkPath), which checked neither:
 *
 *   - the host, so a link to another site was eligible
 *   - a segment boundary, so /acme counted as a parent of /acmelabs
 *
 * The last case checks the opposite direction: genuine parent links must still be removed,
 * so the boundary check cannot be tightened until it never matches. It covers one and two
 * segments up, with and without a trailing slash, because those compare differently.
 *
 * Two details of the markup are deliberate. The link is wrapped in a <span>, because a
 * bare <a> among other prose is exempted by the rule's closest('p') guard. The paragraph
 * runs past ten words, because a shorter one would itself be matched and removed whole,
 * making the symptom a missing paragraph rather than a missing link. The link's text is
 * never inspected.
 */

const FILLER = '<p>Lorem ipsum dolor sit amet consectetur adipiscing elit sed do eiusmod tempor incididunt ut labore et dolore magna aliqua ut enim ad minim veniam quis nostrud exercitation ullamco laboris.</p>';

const PAGE_URL = 'https://pages.example.com/acmelabs/posts/12345';

function buildPage(href: string): string {
	return `
	<!DOCTYPE html>
	<html>
	<head><title>Prefixed Path</title></head>
	<body>
		<article>
			<h1>Prefixed Path</h1>
			${FILLER}
			<p>This paragraph runs past the ten word guard so the rule reaches the wrapper
			around the link rather than the paragraph itself, and it ends with a link to
			<span><a href="${href}">our profile</a></span>.</p>
			${FILLER}
		</article>
	</body>
	</html>`;
}

async function parse(href: string, url: string = PAGE_URL) {
	return Defuddle(parseDocument(buildPage(href), url), url, { separateMarkdown: true });
}

describe('Section breadcrumb removal', () => {
	test('keeps a link to another host whose path prefixes the page path', async () => {
		const href = 'https://social.example.net/acme';

		const result = await parse(href);

		expect(result.content).toContain(href);
		expect(result.contentMarkdown).toContain(`(${href})`);
	});

	test('keeps a same-site link whose path prefixes the page path mid-segment', async () => {
		const href = 'https://pages.example.com/acme';

		const result = await parse(href);

		expect(result.content).toContain(href);
		expect(result.contentMarkdown).toContain(`(${href})`);
	});

	test.each([
		'https://pages.example.com/blog',
		'https://pages.example.com/blog/',
		'https://pages.example.com/blog/2024',
		'https://pages.example.com/blog/2024/'
	])('removes a link to the parent path %s', async (href) => {
		const result = await parse(href, 'https://pages.example.com/blog/2024/post');

		expect(result.content).not.toContain(href);
		expect(result.content).not.toContain('our profile');
		// The rest of the article survives, so the assertions above are not passing vacuously
		expect(result.content).toContain('Lorem ipsum');
	});
});