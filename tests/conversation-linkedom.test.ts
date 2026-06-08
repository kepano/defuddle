import { describe, test, expect, vi } from 'vitest';
import { Defuddle } from '../src/node';
import { parseLinkedomHTML } from '../src/utils/linkedom-compat';

/**
 * Regression test for #298.
 *
 * ConversationExtractor.extract() builds a scratch document to re-clean the
 * formatted message HTML. linkedom does not provide
 * `document.implementation.createHTMLDocument`, so the extractor must fall back
 * to `document.defaultView.DOMParser`. Before the fallback existed the extractor
 * threw `TypeError: undefined is not an object (evaluating
 * 'this.document.implementation.createHTMLDocument')`, logged a stack trace via
 * console.error, and silently fell back to the generic extractor.
 */
describe('ConversationExtractor on linkedom (#298)', () => {
	test('Claude share page extracts without crashing and uses the conversation extractor', async () => {
		const html = `<!doctype html><html><body>
			<div data-testid="user-message"><p>What is RAG?</p></div>
			<div class="font-claude-response"><div class="standard-markdown">
				<p>${'Retrieval augmented generation grounds the model. '.repeat(20)}</p>
			</div></div>
		</body></html>`;

		const doc = parseLinkedomHTML(html, 'https://claude.ai/share/abc');

		const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
		try {
			const result = await Defuddle(doc, 'https://claude.ai/share/abc', { markdown: false });

			// The extractor must not log a createHTMLDocument crash.
			const loggedCrash = errorSpy.mock.calls
				.flat()
				.some((arg) => String(arg).includes('createHTMLDocument'));
			expect(loggedCrash).toBe(false);

			// Conversation extractor output: both turns present, in order.
			expect(result.content).toContain('You');
			expect(result.content).toContain('Claude');
			expect(result.content).toContain('What is RAG?');
			expect(result.content).toContain('Retrieval augmented generation');
		} finally {
			errorSpy.mockRestore();
		}
	});
});
