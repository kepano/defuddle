import { readFileSync } from 'fs';
import { join } from 'path';
import { describe, expect, test } from 'vitest';
import { Defuddle } from '../src/node';
import { parseDocument } from './helpers';

const fixturePath = join(__dirname, 'fixtures', 'issues--openai-chatkit-tabs-and-next-steps.html');
const fixtureHtml = readFileSync(fixturePath, 'utf-8');
const fixtureUrl = 'https://developers.openai.com/api/docs/guides/chatkit';

describe('OpenAI ChatKit regressions', () => {
	test('preserves hidden alternate code tabs and the final Next steps heading', async () => {
		const result = await Defuddle(parseDocument(fixtureHtml, fixtureUrl), fixtureUrl, {
			separateMarkdown: true,
		});

		expect(result.contentMarkdown).toContain("const chatkit = document.getElementById('my-chat');");
		expect(result.contentMarkdown).toContain('chatkit.setOptions({');
		expect(result.contentMarkdown).toContain('## Next steps');
		expect(result.contentMarkdown).toContain("When you’re happy with your ChatKit implementation, learn how to optimize it with [evals](https://developers.openai.com/api/docs/guides/agent-evals).");
	});

	test('still removes ordinary hidden junk outside code samples', async () => {
		const html = `
			<html>
				<head><title>Hidden junk</title></head>
				<body>
					<article>
						<p>This paragraph has enough words to make the article content count as meaningful prose for the extractor to keep it in place.</p>
						<div class="hidden">
							<p>Buy now</p>
						</div>
					</article>
				</body>
			</html>
		`;

		const result = await Defuddle(parseDocument(html, 'https://example.com/hidden'), 'https://example.com/hidden', {
			separateMarkdown: true,
		});

		expect(result.contentMarkdown).toContain('This paragraph has enough words');
		expect(result.contentMarkdown).not.toContain('Buy now');
	});
});
