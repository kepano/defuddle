import { describe, test, expect } from 'vitest';
import { Defuddle } from '../src/node';
import { parseLinkedomHTML } from '../src/utils/linkedom-compat';

// Regression test for GHSA-jg4p-g6xj-4qmf: XSS via unescaped attribute
// interpolation in site extractors. Extractor output is built from template
// strings and previously bypassed DOM-based sanitization, so attacker-
// controlled attribute values (e.g. an image alt read off the page) could
// close the attribute and inject an event handler or a javascript: URL.

const X_URL = 'https://x.com/testuser/article/123456789';
const PERPLEXITY_URL = 'https://www.perplexity.ai/search/xss-test';

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

	test('does not emit executable attributes from Perplexity answer content or citations', async () => {
		const html = `
			<html><head><title>Perplexity XSS test</title></head>
			<body>
				<section>
					<span class="select-text">Summarize the source</span>
					<div id="markdown-content-0">
						<div data-renderer="lm">
							<p>
								Answer
								<span
									data-pplx-citation-url='https://example.com/%22%20onclick=%22alert(1)'
								>Source " onclick="alert(1)</span>
							</p>
							<img src="javascript:alert(1)" onerror="alert(1)" alt="unsafe">
							<a href="javascript:alert(1)" onclick="alert(1)">Unsafe link</a>
						</div>
					</div>
				</section>
			</body></html>
		`;
		const doc = parseLinkedomHTML(html, PERPLEXITY_URL);
		const response = await Defuddle(doc, PERPLEXITY_URL);

		assertNoExecutableAttributes(response.content);
	});
});
