import { describe, expect, test } from 'vitest';
import { RedditExtractor } from '../src/extractors/reddit';
import { parseDocument } from './helpers';

describe('Reddit extractor applicability', () => {
	const markup = [
		'<shreddit-post><div slot="text-body"><p>A post body.</p></div></shreddit-post>',
		'<div class="thing link"><div class="usertext-body"><p>A post body.</p></div></div>',
	];
	test.each(['/', '/r/example/', '/user/example/', '/u/example/', '/r/example/comments/', '/?next=/r/example/comments/abc/'])('declines listing %s in both layouts', path => {
		for (const html of markup) {
			const url = 'https://www.reddit.com' + path;
			const extractor = new RedditExtractor(parseDocument(html, url), url);
			expect(extractor.canExtract()).toBe(false);
			expect(extractor.canExtractAsync()).toBe(false);
		}
	});

	test.each(['/r/example/comments/abc/post/', '/comments/abc/', '/user/example/comments/abc/post/', '/u/example/comments/abc/post/'])('accepts individual post %s in both layouts', path => {
		for (const html of markup) {
			const url = 'https://www.reddit.com' + path;
			expect(new RedditExtractor(parseDocument(html, url), url).canExtract()).toBe(true);
		}
	});
	test.each(['www', 'old', 'sh', 'new'])('accepts rendered share links on %s.reddit.com', host => {
		for (const html of markup) {
			const url = `https://${host}.reddit.com/r/example/s/abc123`;
			const extractor = new RedditExtractor(parseDocument(html, url), url);
			expect(extractor.canExtract()).toBe(true);
			// Share tokens are not post IDs for the comments/feed API.
			expect(extractor.canExtractAsync()).toBe(false);
		}
	});

	test('keeps a post page eligible when recommendations contain another post', () => {
		const url = 'https://www.reddit.com/r/example/comments/abc/post/';
		const doc = parseDocument(markup[0] + markup[0], url);
		expect(new RedditExtractor(doc, url).canExtract()).toBe(true);
	});

});
