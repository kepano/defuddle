import { describe, expect, test } from 'vitest';
import { marked } from 'marked';
import { Defuddle } from '../src/node';
import { createMarkdownContent } from '../src/markdown';
import { escapeHtml, isDangerousUrl, parseHTML } from '../src/utils/dom';
import { parseDocument } from './helpers';

const url = 'https://example.com/article';
const payload = '<img src=x onerror=alert(1)>';
const filler = '<p>This example article contains enough ordinary text to keep its contents during extraction. It explains a generic subject with several useful details for readers.</p>';

function renderedDocument(markdown: string): DocumentFragment {
	const doc = parseDocument('<html><body></body></html>', url);
	return parseHTML(doc, marked.parse(markdown, { async: false }));
}

function expectSafe(markdown: string): DocumentFragment {
	const rendered = renderedDocument(markdown);
	for (const el of rendered.querySelectorAll('*')) {
		for (const attr of Array.from(el.attributes)) {
			expect(attr.name, el.outerHTML).not.toMatch(/^on/i);
			if (attr.name === 'href' || attr.name === 'src') {
				expect(isDangerousUrl(attr.value), el.outerHTML).toBe(false);
			}
		}
	}
	expect(rendered.querySelector('script, iframe[srcdoc]')).toBeNull();
	return rendered;
}

const cases = [
	['image alt', `<img src="https://example.com/p.png" alt="${escapeHtml('x)\n\n' + payload + '\n\n![y](z')}">`],
	['image title', `<img src="https://example.com/p.png" alt="photo" title="${escapeHtml('x")\n\n' + payload + '\n\n![y](z')}">`],
	['figure alt', `<figure><img src="https://example.com/p.png" alt="${escapeHtml('x)\n\n' + payload + '\n\n![y](z')}"><figcaption>Example caption</figcaption></figure>`],
	['complex table', `<table><tr><td colspan="2">${escapeHtml(payload)}</td><td>Example</td></tr><tr><td>A</td><td>B</td><td>C</td></tr></table>`],
	['callout title', `<div class="admonition"><p class="admonition-title">${escapeHtml(payload)}</p><p>Example callout content.</p></div>`],
	['callout type', `<div class="callout" data-callout="${escapeHtml('note]\n\n' + payload)}"><div class="callout-content">Example callout content.</div></div>`],
	['code language', `<pre><code data-lang="${escapeHtml('js\n```\n\n' + payload + '\n\n```')}">const example = 1;</code></pre>`],
	['math annotation', `<math display="block"><annotation encoding="application/x-tex">${escapeHtml('x\n$$\n\n' + payload + '\n\n$$')}</annotation></math>`],
	['math attribute', `<math display="block" data-latex="${escapeHtml(payload)}"><mi>x</mi></math>`],
	['katex attribute', `<span class="katex" data-latex="${escapeHtml(payload)}">x</span>`],
	['footnote reference', `<p>Reference <sup id="${escapeHtml('fnref:x]\n\n' + payload + '\n\n[^y')}">1</sup></p>`],
] as const;

describe('Markdown output security', () => {
	describe.each([true, false])('standardize=%s', standardize => {
		const applicableCases = standardize ? cases : cases.filter(([name]) => name !== 'callout title');
		test.each(applicableCases)('keeps %s inert through extraction and rendering', async (_name, snippet) => {
			const doc = parseDocument(`<html><body><article>${filler}${snippet}${filler}</article></body></html>`, url);
			const result = await Defuddle(doc, url, { separateMarkdown: true, standardize });
			expect(result.contentMarkdown).toBeTruthy();
			expectSafe(result.contentMarkdown!);
		});
	});

	test.each([
		['image src', `<img alt="photo" src="${escapeHtml('https://example.com/a.png) ' + payload)}">`],
		['figure label', `<figure><img src="https://example.com/p.png"><figcaption><span class="ltx_tag_figure">${escapeHtml(payload)}</span>Caption</figcaption></figure>`],
		['footnote definition', `<div id="footnotes"><ol><li id="${escapeHtml('fn:x]\n\n' + payload + '\n\n[^y')}">Note</li></ol></div>`],
		['inline math link', '<p>Value <math data-latex="[click](javascript:alert(1))">x</math>.</p>'],
		['nested equation', `<table class="ltx_equation"><tr><td><math><annotation encoding="application/x-tex">${escapeHtml(payload)}</annotation></math></td></tr></table>`],
		['caption math', `<figure><img src="https://example.com/p.png"><figcaption>Caption <math data-latex="${escapeHtml(payload)}">x</math></figcaption></figure>`],
		['math autolink', '<math data-latex="&lt;javascript:alert(1)&gt;">x</math>'],
		['math fence breakout', `<math data-latex="${escapeHtml('```\n' + payload)}">x</math>`],
		['math reference definition', `<math display="block" data-latex="${escapeHtml('[x]\n\n[x]: javascript:alert(1)')}">x</math>`],
		['tweet embed link', `<iframe src="${escapeHtml('https://x.com/a)[x](javascript:alert(1))/status/1')}"></iframe>`],
		['tweet embed tag', `<iframe src="${escapeHtml('https://x.com/a)' + payload + '/status/1')}"></iframe>`],
		['autolink split across text nodes', '<p>&lt;javascript:alert(1)<span>&gt;</span></p>'],
		['tag split after its name', '<p>&lt;img<span> src=x onerror=alert(1)&gt;</span></p>'],
		['tag split after its bracket', '<p>&lt;<span>img src=x onerror=alert(1)&gt;</span></p>'],
		['literal math in a table cell', `<table><tr><th>H</th></tr><tr><td><math data-latex="${escapeHtml('\\text{a} <b> ``` ' + payload + ' ```')}">x</math></td></tr></table>`],
		['code block in a table cell', `<table><tr><th>H</th></tr><tr><td><pre><code>${escapeHtml('a ``` ' + payload + ' ```')}</code></pre></td></tr></table>`],
	])('keeps %s inert in direct conversion', (_name, html) => {
		expectSafe(createMarkdownContent(html, url));
	});

	test.each(['javascript:alert(1)', 'blob:https://example.com/id', 'data:text/html,test'])('rejects a selected srcset URL using %s', async src => {
		const snippet = `<img src="https://example.com/safe.png" srcset="${escapeHtml(src)} 1000w" alt="photo">`;
		const result = await Defuddle(parseDocument(`<article>${filler}${snippet}${filler}</article>`, url), url, { markdown: true });
		const rendered = expectSafe(result.content);
		expect(rendered.querySelector('img')?.getAttribute('src')).toBe('https://example.com/safe.png');
	});

	test('preserves image labels, titles, and structural URL characters without adding elements', () => {
		const alt = 'A [label] <tag> and \\ brackets';
		const title = 'A "title" with \\ and <tag>';
		const src = 'https://example.com/p(1).png?x=1&y=2';
		const rendered = expectSafe(createMarkdownContent(`<img alt="${escapeHtml(alt)}" title="${escapeHtml(title)}" src="${escapeHtml(src)}">`, url));
		expect(rendered.querySelectorAll('img')).toHaveLength(1);
		const img = rendered.querySelector('img')!;
		expect(img.getAttribute('alt')).toBe(alt);
		expect(img.getAttribute('title')).toBe(title);
		expect(img.getAttribute('src')).toBe(src);
	});

	test('does not decode a second layer of entities in URL destinations', () => {
		const src = 'java&#x73;cript:alert(1)';
		const rendered = expectSafe(createMarkdownContent(`<img src="${escapeHtml(src)}" alt="photo"><a href="${escapeHtml(src)}">Link</a>`, url));
		expect(rendered.querySelector('img')?.getAttribute('src')).toBe(src);
		expect(rendered.querySelector('a')?.getAttribute('href')).toBe(src);
	});

	test('keeps dangerous autolinks in text inert while preserving HTTPS and email autolinks', () => {
		const rendered = expectSafe(createMarkdownContent('<p>&lt;javascript:alert(1)&gt; &lt;https://example.com&gt; &lt;reader@example.com&gt;</p>', url));
		expect(Array.from(rendered.querySelectorAll('a'), a => a.getAttribute('href'))).toEqual([
			'https://example.com', 'mailto:reader@example.com'
		]);
	});

	test('preserves literal text and entities in complex tables', () => {
		const text = '<img src=x onerror=alert(1)> &lt;literal&gt; A & B';
		const rendered = expectSafe(createMarkdownContent(`<table><tr><td colspan="2">${escapeHtml(text)}</td><td>Other</td></tr></table>`, url));
		expect(rendered.querySelector('td')?.textContent).toBe(text);
	});

	test('retains matching safe footnote identifiers and repeated references', () => {
		const html = '<p>Text<sup id="fnref:1-2">1</sup></p><div id="footnotes"><ol><li id="fn:1">Note</li></ol></div>';
		const markdown = createMarkdownContent(html, url);
		expect(markdown).toContain('Text[^1]');
		expect(markdown).toContain('[^1]: Note');
	});

	test('preserves valid math and keeps suspicious math source inline as math', () => {
		expect(createMarkdownContent('<p>Value <math data-latex="x &lt; y">x</math>.</p>', url)).toBe('Value $x < y$.');
		expect(createMarkdownContent('<p>Value <math data-latex="x&lt;y">x</math>.</p>', url)).toBe('Value $x<y$.');
		expect(createMarkdownContent('<p>Let <math data-latex="0&lt;x \\le 1">x</math> hold.</p>', url)).toBe('Let $0< x \\le 1$ hold.');
		expect(createMarkdownContent('<p>Let <math data-latex="E[X](t)">x</math> hold.</p>', url)).toBe('Let $E[X] (t)$ hold.');
		const rendered = expectSafe(createMarkdownContent(`<p>Value <math data-latex="${escapeHtml(payload)}">x</math>.</p>`, url));
		expect(rendered.querySelector('p')?.textContent).toBe('Value $< img src=x onerror=alert(1)>$.');
	});

	test('spaces inline math from adjacent caption text', () => {
		const markdown = createMarkdownContent('<figure><img src="https://example.com/p.png"><figcaption>Caption with <math data-latex="x^2">x</math>only</figcaption></figure>', url);
		expect(markdown).toContain('Caption with $x^2$ only');
	});

	test.each([
		'\\text{E[X](t)}',
		'\\texttt{<div>}',
		'\\text{[x]: value}',
		'\\text{nested {E[X](t)}}',
		'\\mbox{<div>}',
		'\\operatorname{E[X](t)}',
		'\\texttt{```\n' + payload + '}',
	])('preserves math with significant text spacing as literal source: %s', latex => {
		const markdown = createMarkdownContent(`<math display="block" data-latex="${escapeHtml(latex)}">x</math>`, url);
		const rendered = expectSafe(markdown);
		expect(rendered.querySelector('code')?.textContent?.trim()).toBe(latex);
	});

	test('keeps inline literal math source within its sentence', () => {
		const latex = '\\text{a} <b> `` c';
		expect(createMarkdownContent(`<p>Let <math data-latex="${escapeHtml(latex)}">x</math> hold.</p>`, url)).toBe(`Let \`\`\` ${latex} \`\`\` hold.`);
	});

	test('keeps math containing ordinary text commands unchanged when no escaping is needed', () => {
		const latex = 'x + \\text{two words}';
		expect(createMarkdownContent(`<p>Value <math data-latex="${escapeHtml(latex)}">x</math>.</p>`, url)).toBe(`Value $${latex}$.`);
	});

	test('uses the same footnote ID in body text and nested conversions', () => {
		const html = '<div class="callout" data-callout="note"><div class="callout-content"><p>Again<sup id="fnref:note-1"><a href="#fn:note-1">1</a></sup></p></div></div>'
			+ '<p>Text<sup id="fnref:note-1-2"><a href="#fn:note-1">1</a></sup></p>'
			+ '<div id="footnotes"><ol><li id="fn:note-1">Note</li></ol></div>';
		const markdown = createMarkdownContent(html, url);
		expect(markdown).toContain('Text[^note-1]');
		expect(markdown).toContain('Again[^note-1]');
		expect(markdown).toContain('[^note-1]: Note');
	});

	test.each(['note-é', 'note-%C3%A9', 'note [one]-2'])('decodes linked footnote fragments exactly once: %s', async id => {
		const reference = `<sup id="fnref:${escapeHtml(id)}"><a href="#fn:${encodeURIComponent(id)}">1</a></sup>`;
		const html = `<article>${filler}<div class="callout" data-callout="note"><div class="callout-content"><p>Inside${reference}</p></div></div>`
			+ `<p>Outside${reference}</p><div id="footnotes"><ol><li id="fn:${escapeHtml(id)}">Example footnote</li></ol></div></article>`;
		const result = await Defuddle(parseDocument(html, url), url, { markdown: true, standardize: false });
		const definitionId = result.content.match(/\[\^([^\]]+)\]: Example footnote/)?.[1];
		expect(definitionId).toBeTruthy();
		expect(result.content).toContain(`Inside[^${definitionId}]`);
		expect(result.content).toContain(`Outside[^${definitionId}]`);
		expectSafe(result.content);
	});

	test('keeps malformed percent escapes in a footnote fragment literal', () => {
		const id = 'note-%ZZ';
		const html = `<p>Text<sup id="fnref:${id}"><a href="#fn:${id}">1</a></sup></p>`
			+ `<div id="footnotes"><ol><li id="fn:${id}">Note</li></ol></div>`;
		const markdown = createMarkdownContent(html, url);
		const referenceId = markdown.match(/Text\[\^([^\]]+)\]/)?.[1];
		expect(referenceId).toBeTruthy();
		expect(markdown).toContain(`[^${referenceId}]: Note`);
	});

	test('preserves a link destination containing a backslash before parentheses', () => {
		const markdown = createMarkdownContent('<p><a href="https://example.com/a\\(b)">Link</a></p>', url);
		const rendered = expectSafe(markdown);
		expect(rendered.querySelectorAll('a')).toHaveLength(1);
		expect(rendered.querySelector('a')?.getAttribute('href')).toBe('https://example.com/a%5C(b)');
		expect(rendered.querySelector('p')?.textContent).toBe('Link');
	});

	test('keeps entity-like text in image descriptions literal', () => {
		const alt = '&lt;b&gt; &copy; A & B';
		const rendered = expectSafe(createMarkdownContent(`<img src="https://example.com/p.png" alt="${escapeHtml(alt)}">`, url));
		expect(rendered.querySelector('img')?.getAttribute('alt')).toBe(alt);
	});

	test.each([
		['shell session', 'shell'],
		['c++/cli', 'c++/cli'],
	])('keeps a usable code language from %s', (language, expected) => {
		const markdown = createMarkdownContent(`<pre><code data-lang="${language}">echo 1</code></pre>`, url);
		const code = expectSafe(markdown).querySelector('pre > code');
		expect(code?.getAttribute('class')).toBe(`language-${expected}`);
		expect(code?.textContent).toBe('echo 1\n');
	});

	test('chooses the largest safe srcset candidate and preserves inline image data', () => {
		const rendered = expectSafe(createMarkdownContent('<img src="https://example.com/small.png" srcset="https://example.com/medium.png 500w, javascript:alert(1) 1000w"><img src="data:image/png;base64,AAAA">', url));
		expect(Array.from(rendered.querySelectorAll('img'), img => img.getAttribute('src'))).toEqual([
			'https://example.com/medium.png', 'data:image/png;base64,AAAA'
		]);
	});

	test('uses the same normalized ID for a footnote reference and definition', () => {
		const id = 'note [one]-2';
		const markdown = createMarkdownContent(`<p>Text<sup id="fnref:${id}">1</sup></p><div id="footnotes"><ol><li id="fn:${id}">Note</li></ol></div>`, url);
		const reference = markdown.match(/Text\[\^([^\]]+)\]/)?.[1];
		expect(reference).toBeTruthy();
		expect(markdown).toContain(`[^${reference}]: Note`);
	});
});
