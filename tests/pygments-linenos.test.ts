import { describe, test, expect } from 'vitest';
import { Defuddle } from '../src/node';
import { parseDocument } from './helpers';

// Regression test for #526: Sphinx / Read the Docs render Pygments `:linenos:`
// as inline <span class="linenos">N</span> spans. Only `span.lineno` (singular,
// labml.ai's class) was skipped, so `linenos` fell through to the generic
// `span[class*="line"]` rule and each number landed on its own line in the code.
describe('Pygments inline line numbers (span.linenos) are not kept in code blocks', () => {
	test('Sphinx :linenos: code block drops the line-number digits', async () => {
		const html = `<!DOCTYPE html>
<html>
<head><title>Demo</title></head>
<body>
<article>
<h1>Emphasized lines with line numbers</h1>
<p>This documentation page shows a Python code sample rendered by Pygments with inline line numbers turned on, which is what Sphinx and Read the Docs produce for the linenos option on a code block.</p>
<div class="highlight-python notranslate"><div class="highlight"><pre><span></span><span class="linenos">1</span><span class="k">def</span> <span class="nf">some_function</span><span class="p">():</span>
<span class="linenos">2</span>    <span class="n">interesting</span> <span class="o">=</span> <span class="kc">False</span>
<span class="linenos">3</span>    <span class="n">print</span><span class="p">(</span><span class="n">interesting</span><span class="p">)</span>
</pre></div></div>
<p>The code block above should read as three clean lines of Python without the line-number digits merged into the code text.</p>
</article>
</body>
</html>`;

		const result = await Defuddle(
			parseDocument(html, 'https://example.com/demo'),
			'https://example.com/demo',
			{ separateMarkdown: true }
		);

		const doc = parseDocument(result.content, 'https://example.com/demo');
		const code = doc.querySelector('code');
		expect(code).not.toBeNull();
		const text = code?.textContent ?? '';

		expect(text).toContain('def some_function():');
		// The line-number digits must not survive as their own lines.
		expect(text).not.toMatch(/^\s*1\s*$/m);
		expect(text).not.toMatch(/^\s*2\s*$/m);
		expect(text).not.toMatch(/^\s*3\s*$/m);
	});
});
