import { describe, test, expect } from 'vitest';
import { Defuddle } from '../src/node';
import { parseLinkedomHTML } from '../src/utils/linkedom-compat';

// 🔄 (U+1F504) split into high surrogate \uD83D and low surrogate \uDD04
const HIGH = '\uD83D';
const LOW = '\uDD04';

function makeArticleHTML(paragraphInner: string): string {
	return `
		<html><head><title>Test Article</title></head>
		<body>
			<div data-testid="twitterArticleRichTextView">
				<h1 data-testid="twitter-article-title">Test Article</h1>
				<div class="public-DraftStyleDefault-block">${paragraphInner}</div>
			</div>
		</body></html>
	`;
}

const URL = 'https://x.com/testuser/article/123456789';

describe('X Article surrogate pair repair', () => {
	test('repairs emoji split across bold span boundary', async () => {
		// Draft.js splits 🔄 so the high surrogate is in a text node and the
		// low surrogate is inside the following bold span
		const html = makeArticleHTML(`Refresh ${HIGH}<span style="font-weight: bold">${LOW} updates</span> daily`);
		const doc = parseLinkedomHTML(html, URL);
		const response = await Defuddle(doc, URL);

		expect(response.content).toContain('\uD83D\uDD04'); // intact emoji 🔄
		expect(() => JSON.stringify(response.content)).not.toThrow();
		// No lone high surrogates in the JSON output
		expect(JSON.stringify(response.content)).not.toMatch(/\\ud83d(?!\\udd)/i);
	});

	test('repairs emoji split across link boundary', async () => {
		const html = makeArticleHTML(`See ${HIGH}<a href="https://example.com">${LOW}here</a>`);
		const doc = parseLinkedomHTML(html, URL);
		const response = await Defuddle(doc, URL);

		expect(() => JSON.stringify(response.content)).not.toThrow();
		expect(JSON.stringify(response.content)).not.toMatch(/\\ud83d(?!\\udd)/i);
	});

	test('preserves intact emojis unchanged', async () => {
		const html = makeArticleHTML(`Refresh \uD83D\uDD04 daily`);
		const doc = parseLinkedomHTML(html, URL);
		const response = await Defuddle(doc, URL);

		expect(response.content).toContain('\uD83D\uDD04');
		expect(() => JSON.stringify(response.content)).not.toThrow();
	});
});
