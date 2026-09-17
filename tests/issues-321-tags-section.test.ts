import { describe, test, expect } from 'vitest';
import { Defuddle } from '../src/node';
import { parseDocument } from './helpers';

const html = `
<!DOCTYPE html>
<html>
<head><title>Tags section test</title></head>
<body>
	<article>
		<h1>Article title</h1>
		<h2>Intro heading</h2>
		<p>Intro paragraph with enough text to be treated as content.</p>

		<section id="tags">
			<h2>Content heading</h2>
			<p>Content paragraph that should remain in the extracted output.</p>
		</section>

		<footer id="tags">
			<a href="/tags/alpha">alpha</a>
			<a href="/tags/beta">beta</a>
		</footer>
	</article>
</body>
</html>
`;

describe('issue #321', () => {
	test('keeps substantive content sections with id="tags"', async () => {
		const result = await Defuddle(parseDocument(html, 'https://example.com/tags-section'), 'https://example.com/tags-section', {
			separateMarkdown: true,
		});

		expect(result.contentMarkdown).toContain('## Intro heading');
		expect(result.contentMarkdown).toContain('Intro paragraph with enough text');
		expect(result.contentMarkdown).toContain('## Content heading');
		expect(result.contentMarkdown).toContain('Content paragraph that should remain');
		expect(result.contentMarkdown).not.toContain('/tags/alpha');
		expect(result.contentMarkdown).not.toContain('/tags/beta');
	});
});
