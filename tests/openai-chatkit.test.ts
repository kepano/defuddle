import { readFileSync } from 'fs';
import { join } from 'path';
import { describe, expect, test } from 'vitest';
import { Defuddle } from '../src/node';
import { parseDocument } from './helpers';

const fixturePath = join(__dirname, 'fixtures', 'issues--openai-chatkit-tabs-and-next-steps.html');
const fixtureHtml = readFileSync(fixturePath, 'utf-8');
const fixtureUrl = 'https://developers.openai.com/api/docs/guides/chatkit';
const mintlifyFixturePath = join(__dirname, 'fixtures', 'codeblocks--mintlify.html');
const mintlifyFixtureHtml = readFileSync(mintlifyFixturePath, 'utf-8');
const mintlifyFixtureUrl = 'https://www.sanity.io/guides/modes';

async function extractMarkdown(html: string, url: string): Promise<string> {
	const result = await Defuddle(parseDocument(html, url), url, {
		separateMarkdown: true,
	});

	return result.contentMarkdown;
}

describe('OpenAI ChatKit regressions', () => {
	test('preserves hidden alternate code tabs and the final Next steps heading', async () => {
		const markdown = await extractMarkdown(fixtureHtml, fixtureUrl);

		expect(markdown).toContain("const chatkit = document.getElementById('my-chat');");
		expect(markdown).toContain('chatkit.setOptions({');
		expect(markdown).toContain('## Next steps');
		expect(markdown).toContain("When you’re happy with your ChatKit implementation, learn how to optimize it with [evals](https://developers.openai.com/api/docs/guides/agent-evals).");
	});

	test('preserves semantic headings even when their slug matches a partial selector token', async () => {
		const html = `
			<html>
				<head><title>Semantic heading</title></head>
				<body>
					<article>
						<p>This article explains how page sections can use nav-like IDs without becoming navigation chrome.</p>
						<h2 id="nav-patterns">Navigation patterns</h2>
						<p>This heading introduces real article prose and should stay in the extracted output.</p>
					</article>
				</body>
			</html>
		`;

		const markdown = await extractMarkdown(html, 'https://example.com/semantic-heading');

		expect(markdown).toContain('## Navigation patterns');
		expect(markdown).toContain('This heading introduces real article prose');
	});

	test('preserves hidden alternate code variants outside site-specific wrappers', async () => {
		const html = `
			<html>
				<head><title>Hidden variants</title></head>
				<body>
					<article>
						<p>This article compares alternate code variants in a shared sample group.</p>
						<div class="sample-group">
							<div class="sample-variant">
								<pre><code data-language="python">client = ChatKit()
client.run("hello")</code></pre>
							</div>
							<div class="sample-variant hidden">
								<pre><code data-language="javascript">const client = new ChatKit();
client.run('hello');</code></pre>
							</div>
						</div>
					</article>
				</body>
			</html>
		`;

		const markdown = await extractMarkdown(html, 'https://example.com/hidden-variants');

		expect(markdown).toContain('client = ChatKit()');
		expect(markdown).toContain('const client = new ChatKit();');
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

		const markdown = await extractMarkdown(html, 'https://example.com/hidden');

		expect(markdown).toContain('This paragraph has enough words');
		expect(markdown).not.toContain('Buy now');
	});

	test('does not preserve card-only tail sections that lack prose after the heading', async () => {
		const markdown = await extractMarkdown(mintlifyFixtureHtml, mintlifyFixtureUrl);

		expect(markdown).not.toContain('## Next Steps');
	});
});
