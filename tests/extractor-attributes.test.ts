import { describe, test, expect } from 'vitest';
import Defuddle from '../src/index';
import { parseDocument } from './helpers';
import { isExtractorClass, SITE_TOKENS } from '../src/utils/comments';

// Covers standardizeExtractorOutput: page-authored styling has to go, but the
// markup the extractors emit themselves is a downstream contract that survives.

const GMAIL_URL = 'https://mail.google.com/mail/u/0/#inbox/thread-f:1';

// A Gmail body as Outlook writes it: every paragraph is its own div repeating
// the sender's font stack, wrapped in Gmail's own .im / .adM chrome classes.
const GMAIL_HTML = `
<html>
<head><title>Styled thread - jane@example.com - Gmail</title></head>
<body>
<div role="main">
	<h2 class="hP">Styled thread</h2>
	<div class="adn ads">
		<div class="gE">
			<span email="alex@example.com" name="Alex Rivera" class="gD"><span>Alex Rivera</span></span>
			<span class="g3" title="May 13, 2026, 11:02 PM"><span>May 13, 2026, 11:02 PM</span></span>
		</div>
		<div class="ii gt">
			<div class="a3s aiL">
				<div dir="ltr"><div class="adM"></div>
					<div id="m_123divBody" style="font-family:Aptos,Calibri,sans-serif;font-size:12pt;color:rgb(0,0,0)">Interesting</div>
					<div style="font-family:Aptos,Calibri,sans-serif"><br></div>
					<div class="im" style="color:rgb(80,0,80)" data-legacy-id="xyz">This really is a trial and error process</div>
					<div style="font-family:Aptos,Calibri,sans-serif"><br></div>
					<div style="font-family:Aptos,Calibri,sans-serif"><br></div>
					<div style="font-family:Aptos,Calibri,sans-serif">Do you recall the dosage?</div>
				</div>
			</div>
		</div>
	</div>
</div>
</body>
</html>
`;

describe('extractor output attributes', () => {
	const doc = parseDocument(GMAIL_HTML, GMAIL_URL);
	const content = new Defuddle(doc, { url: GMAIL_URL }).parse().content;

	test('strips page-authored style, class, id, and data attributes', () => {
		expect(content).not.toContain('style=');
		expect(content).not.toContain('Aptos');
		expect(content).not.toContain('class="im"');
		expect(content).not.toContain('adM');
		expect(content).not.toContain('m_123divBody');
		expect(content).not.toContain('data-legacy-id');
	});

	test('keeps the extractor comment markup the reader depends on', () => {
		for (const cls of ['comment', 'comment-metadata', 'comment-author', 'comment-content']) {
			expect(content).toContain(`class="${cls}"`);
		}
		// The site identifier travels with the marker, and both survive.
		expect(content).toContain('class="gmail comments"');
		expect(content).toContain('data-defuddle');
	});

	test('keeps allowed attributes on message content', () => {
		expect(content).toContain('dir="ltr"');
		expect(content).toContain('Interesting');
		expect(content).toContain('This really is a trial and error process');
	});

	// Rich-text composers write a paragraph break as its own <div><br></div>, so a
	// message body arrives as alternating content and spacer divs.
	test('drops the empty spacer divs between paragraphs', () => {
		expect(content).not.toMatch(/<div[^>]*>\s*<br\s*\/?>\s*<\/div>/);
		expect(content).not.toContain('<br>');
		// The lines they separated are still there, still in order, and still
		// separate blocks rather than run together into one.
		expect(content).toMatch(
			/<div>Interesting<\/div>\s*<div>This really is a trial and error process<\/div>\s*<div>Do you recall the dosage\?<\/div>/
		);
	});

	test('debug mode leaves extractor output untouched', () => {
		const debugDoc = parseDocument(GMAIL_HTML, GMAIL_URL);
		const debugContent = new Defuddle(debugDoc, { url: GMAIL_URL, debug: true }).parse().content;
		expect(debugContent).toContain('class="im"');
	});
});

const REDDIT_URL = 'https://www.reddit.com/r/test/comments/abc123/test_post/';

// buildContentHtml wraps the post in `<site> post` and the thread in
// `<site> comments`, so the site identifier has to survive alongside the marker.
const REDDIT_HTML = `
<html>
<head><title>Test Post : test</title></head>
<body>
<h1>Test Post Title</h1>
<shreddit-post
  author="original_poster"
  subreddit-prefixed-name="r/test"
  post-title="Test Post Title"
  score="42"
  created-timestamp="2025-01-15T10:00:00Z"
  permalink="/r/test/comments/abc123/test_post/">
  <div slot="text-body"><p style="color:#111" class="md">The post body.</p>
  <div class="post entry sponsored">Page markup using the marker word.</div></div>
</shreddit-post>
<shreddit-comment author="commenter" score="7" depth="0" permalink="/r/test/comments/abc123/c1/">
  <div slot="comment"><p class="richtext" style="font-size:14px">A reply.</p></div>
</shreddit-comment>
</body>
</html>
`;

describe('site wrapper classes', () => {
	const doc = parseDocument(REDDIT_HTML, REDDIT_URL);
	const content = new Defuddle(doc, { url: REDDIT_URL }).parse().content;

	test('keeps the site identifier paired with post and comments markers', () => {
		expect(content).toContain('class="reddit post"');
		expect(content).toContain('class="reddit comments"');
		expect(content).toContain('class="post-content"');
	});

	test('still strips page styling inside the wrappers', () => {
		expect(content).not.toContain('style=');
		expect(content).not.toContain('richtext');
	});

	// `post` and `comments` are ordinary CMS class names, and extractor bodies are
	// lifted verbatim from the page, so matching on the marker word alone would let
	// a page div keep all of its classes. Only the enumerated site tokens qualify.
	test('does not let page markup borrow the wrapper markers', () => {
		expect(content).toContain('Page markup using the marker word.');
		expect(content).not.toContain('sponsored');
		expect(content).not.toContain('entry');
	});
});

// Guards the tokens no fixture happens to exercise. These are emitted by
// hackernews.ts (post-text), buildQuotedPost (quoted-post), and x-article.ts /
// x-oembed.ts (x-article). If the allowlist stops matching them, the classes
// vanish silently and no other test notices.
describe('isExtractorClass', () => {
	test('accepts every class the extractors emit', () => {
		for (const token of [
			'comment', 'comments', 'comment-author', 'comment-content', 'comment-date',
			'comment-link', 'comment-metadata', 'comment-points',
			'post', 'post-content', 'post-text', 'quoted-post', 'x-article',
			...SITE_TOKENS,
		]) {
			expect(isExtractorClass(token), token).toBe(true);
		}
	});

	test('rejects page markup, including the CMS words the markers share', () => {
		for (const token of [
			'entry', 'sponsored', 'md', 'richtext', 'im', 'adM', 'CToWUd',
			'highlight', 'postscript', 'commentary', 'x-articles',
		]) {
			expect(isExtractorClass(token), token).toBe(false);
		}
	});
});
