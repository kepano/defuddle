import { describe, test, expect } from 'vitest';
import { Defuddle } from '../src/node';
import { parseDocument } from './helpers';

/**
 * Code block language detection reads the block's own markup (<pre>, <code>)
 * and its close wrappers, never unrelated page ancestors.
 */

const URL = 'https://example.com/a';
const FILLER = '<p>' + 'Lorem ipsum dolor sit amet consectetur adipiscing elit sed do eiusmod tempor. '.repeat(30) + '</p>';

async function languages(body: string): Promise<string[]> {
	const html = `<!doctype html><html><head><title>T</title></head><body><article>${FILLER}${body}${FILLER}</article></body></html>`;
	const result = await Defuddle(parseDocument(html, URL), URL);
	const doc = parseDocument(`<html><body>${result.content}</body></html>`, URL);
	return Array.from(doc.querySelectorAll('pre > code')).map(code => code.getAttribute('data-lang') || '');
}

describe('code block language', () => {
	test.each([
		['language- on code', '<pre><code class="language-go">x := 1</code></pre>', 'go'],
		['lang- on pre', '<pre class="lang-go"><code>x := 1</code></pre>', 'go'],
		['a language name with symbols', '<pre><code class="language-c++">int x;</code></pre>', 'c++'],
		['language- on a wrapper div', '<div class="language-go"><pre><code>x := 1</code></pre></div>', 'go'],
		['language- on pre inside a wrapper', '<div class="highlight"><pre class="language-go"><code>x := 1</code></pre></div>', 'go'],
		['highlight-source- wrapper', '<div class="highlight highlight-source-go"><pre>x := 1</pre></div>', 'go'],
		['highlight- wrapper', '<div class="highlight-go"><div class="highlight"><pre>x := 1</pre></div></div>', 'go'],
		['data-lang on a close wrapper', '<div data-lang="rust"><pre><code>let x = 1;</code></pre></div>', 'rust'],
		['bare highlight.js name', '<pre><code class="hljs go">x := 1</code></pre>', 'go'],
	])('detects %s', async (_name, snippet, expected) => {
		expect(await languages(snippet)).toEqual([expected]);
	});

	test.each([
		['a markdown page ancestor', '<section class="markdown"><p>Intro text for this section.</p><pre><code>make</code></pre></section>'],
		['a bare name on a tight wrapper', '<div class="go"><pre><code>make</code></pre></div>'],
		['a layout class starting with highlight', '<div class="highlight-wrap"><pre><code>make</code></pre></div>'],
		['an unknown bare class', '<pre><code class="hljs nohighlight">make</code></pre>'],
		['a wrapper with surrounding prose', '<div class="highlight-go"><p>Here is a longer explanation of what the following snippet does.</p><pre><code>make</code></pre></div>'],
		['a wrapper beyond the depth limit', '<div data-lang="go"><div><div><div><pre><code>make</code></pre></div></div></div></div>'],
	])('ignores %s', async (_name, snippet) => {
		expect(await languages(snippet)).toEqual(['']);
	});

	test('does not borrow the language of a sibling block through a shared wrapper', async () => {
		const snippet = '<div><pre><code class="language-python">print(1)</code></pre><pre><code>make</code></pre></div>';
		expect(await languages(snippet)).toEqual(['python', '']);
	});
});
