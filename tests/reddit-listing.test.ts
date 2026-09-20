import { describe, expect, test } from 'vitest';
import { RedditExtractor } from '../src/extractors/reddit';
import { parseDocument } from './helpers';

describe('Reddit extractor applicability', () => {
	const markup = [
		'<shreddit-post><div slot="text-body"><p>A post body.</p></div></shreddit-post>',
		'<div class="thing link"><div class="usertext-body"><p>A post body.</p></div></div>',
	];
	test.each(['/', '/r/example/', '/user/example/', '/r/example/comments/', '/?next=/r/example/comments/abc/'])('declines listing %s in both layouts', path => {
		for (const html of markup) {
			const url = 'https://www.reddit.com' + path;
			const extractor = new RedditExtractor(parseDocument(html, url), url);
			expect(extractor.canExtract()).toBe(false);
			expect(extractor.canExtractAsync()).toBe(false);
		}
	});

	test.each(['/r/example/comments/abc/post/', '/comments/abc/', '/user/example/comments/abc/post/'])('accepts individual post %s in both layouts', path => {
		for (const html of markup) {
			const url = 'https://www.reddit.com' + path;
			expect(new RedditExtractor(parseDocument(html, url), url).canExtract()).toBe(true);
		}
	});
});
