import { describe, test, expect } from 'vitest';
import { Defuddle } from '../src/node';
import { parseLinkedomHTML } from '../src/utils/linkedom-compat';
import { ConversationExtractor } from '../src/extractors/_conversation';
import type { ConversationMessage, ConversationMetadata, Footnote } from '../src/types/extractors';

// Regression test for GHSA-jg4p-g6xj-4qmf: XSS via unescaped attribute
// interpolation in site extractors. Extractor output is built from template
// strings and previously bypassed DOM-based sanitization, so attacker-
// controlled attribute values (e.g. an image alt read off the page) could
// close the attribute and inject an event handler or a javascript: URL.

const X_URL = 'https://x.com/testuser/article/123456789';

// Header image lives in the read view but OUTSIDE the article container, so
// extractHeaderImage() emits it via a template string.
function makeXArticleHTML(headerImgAttrs: string): string {
	return `
		<html><head><title>Test Article</title></head>
		<body>
			<div data-testid="twitterArticleReadView">
				<div data-testid="tweetPhoto"><img ${headerImgAttrs}></div>
				<div data-testid="twitterArticleRichTextView">
					<h1 data-testid="twitter-article-title">Test Article</h1>
					<div class="public-DraftStyleDefault-block">Body text</div>
				</div>
			</div>
		</body></html>
	`;
}

// Re-parse the extractor output and assert no element carries an executable
// attribute. This is the true security property: an escaped "onerror" living
// inside an alt value is harmless; a real onerror attribute is not.
function assertNoExecutableAttributes(html: string) {
	const doc = parseLinkedomHTML(`<body>${html}</body>`, X_URL);
	for (const el of Array.from(doc.querySelectorAll('*'))) {
		for (const attr of Array.from((el as Element).attributes)) {
			expect(attr.name.toLowerCase().startsWith('on')).toBe(false);
			if (['src', 'href'].includes(attr.name.toLowerCase())) {
				expect(attr.value.toLowerCase().replace(/\s+/g, '')).not.toContain('javascript:');
			}
		}
	}
}

describe('Extractor output XSS sanitization (GHSA-jg4p-g6xj-4qmf)', () => {
	test('does not emit an event handler attribute from X header image alt', async () => {
		// alt contains a double-quote that, unescaped, would close the attribute
		// and turn the rest into a real onerror handler.
		const html = makeXArticleHTML('src="https://example.com/img.jpg" alt=\'x" onerror="alert(1)\'');
		const doc = parseLinkedomHTML(html, X_URL);
		const response = await Defuddle(doc, X_URL);

		assertNoExecutableAttributes(response.content);
	});

	test('strips javascript: URL injected via X header image src', async () => {
		const html = makeXArticleHTML('src="javascript:alert(1)" alt="ok"');
		const doc = parseLinkedomHTML(html, X_URL);
		const response = await Defuddle(doc, X_URL);

		assertNoExecutableAttributes(response.content);
	});
});

// ConversationExtractor.createContentHtml builds its markup from template
// literals, interpolating values read straight off the page: the author name
// (a sr-only heading's text), the timestamp, the metadata values behind
// data-* attributes, and footnote URLs. Per CLAUDE.md every one of those must
// be escaped at the point of interpolation.
//
// End-to-end this is currently masked. extract() re-parses the result through a
// nested Defuddle pass whose attribute strip removes anything injected. That
// backstop is not the guarantee (it can be reordered or bypassed by a future
// caller), so the property is asserted here, on the markup the method emits.
describe('ConversationExtractor markup escaping', () => {
	// Minimal concrete subclass: createContentHtml is protected and takes its
	// inputs directly, so no DOM is needed to exercise it.
	class TestConversationExtractor extends ConversationExtractor {
		protected extractMessages(): ConversationMessage[] { return []; }
		protected getMetadata(): ConversationMetadata {
			return { title: 'T', site: 'S', url: 'about:blank', messageCount: 0 };
		}
		build(messages: ConversationMessage[], footnotes: Footnote[] = []): string {
			return this.createContentHtml(messages, footnotes);
		}
	}

	const build = (messages: ConversationMessage[], footnotes: Footnote[] = []) =>
		new TestConversationExtractor({} as Document, 'about:blank').build(messages, footnotes);

	test('an author name cannot close the class attribute', () => {
		const html = build([{
			author: 'You" onclick="alert(1)',
			content: '<p>hi</p>',
			metadata: { role: 'user' },
		}]);
		assertNoExecutableAttributes(html);
		expect(html).not.toContain('onclick="alert(1)"');
	});

	test('a metadata value cannot close its data attribute', () => {
		const html = build([{
			author: 'You',
			content: '<p>hi</p>',
			metadata: { role: 'user" onmouseover="alert(1)' },
		}]);
		assertNoExecutableAttributes(html);
		expect(html).not.toContain('onmouseover="alert(1)"');
	});

	test('a timestamp cannot inject markup', () => {
		const html = build([{
			author: 'You',
			content: '<p>hi</p>',
			timestamp: '<img src=x onerror=alert(1)>',
			metadata: { role: 'user' },
		}]);
		assertNoExecutableAttributes(html);
	});

	test('a footnote url cannot close the href attribute', () => {
		const html = build([{ author: 'You', content: '<p>hi</p>', metadata: { role: 'user' } }], [
			{ url: 'https://example.com/" onmouseenter="alert(1)', text: 'example.com' },
		]);
		assertNoExecutableAttributes(html);
	});

	test('message content is still passed through as HTML', () => {
		const html = build([{
			author: 'You',
			content: '<p>Real <strong>markup</strong> survives.</p>',
			metadata: { role: 'user' },
		}]);
		expect(html).toContain('<p>Real <strong>markup</strong> survives.</p>');
	});
});
