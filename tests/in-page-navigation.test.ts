import { describe, test, expect } from 'vitest';
import { Defuddle } from '../src/node';
import { parseDocument } from './helpers';

const URL = 'https://example.com/docs/page';

const PROSE = `
<p>The first section explains the background in enough detail that a reader new to the subject can follow the rest of the page without looking anything up elsewhere.</p>
<h2 id="one">Section one</h2>
<p>This section describes the first part of the process, including the tools needed, the order of the steps, and the most common mistakes people make along the way.</p>
<h2 id="two">Section two</h2>
<p>This section covers the second part of the process and explains how to check the result, what a good outcome looks like, and how to recover when something goes wrong.</p>
<h2 id="three">Section three</h2>
<p>The last section summarizes the process and suggests a few ways to practice, so that the steps become familiar and can be repeated quickly the next time they are needed.</p>`;

function page(body: string): string {
	return `<!DOCTYPE html><html><head><title>Test Page</title></head><body><article><h1>Test Page</h1>${body}</article></body></html>`;
}

async function extract(body: string, options: Record<string, unknown> = {}) {
	return Defuddle(parseDocument(page(body), URL), URL, { separateMarkdown: true, ...options });
}

const TOC = `<div class="c1"><div>On this page</div><div><a href="#one">Section one</a></div><div><a href="#two">Section two</a></div><div><a href="#three">Section three</a></div></div>`;
const PAGER = `<div class="c2"><div>Previous: <a href="/docs/intro">Introduction</a></div><div>Next: <a href="/docs/advanced">Advanced topics</a></div></div>`;

describe('In-page navigation removal', () => {
	test('records ToC and prev/next removals in debug output', async () => {
		const result = await extract(PROSE + TOC + PROSE.replace(/id="\w+"/g, '') + PAGER, { debug: true });
		const reasons = result.debug?.removals?.map(r => r.reason) || [];
		expect(reasons).toContain('table of contents');
		expect(reasons).toContain('prev/next navigation');
		expect(result.contentMarkdown).not.toContain('On this page');
		expect(result.contentMarkdown).not.toContain('Advanced topics');
	});

	test('keeps navigation when content pattern removal is disabled', async () => {
		const result = await extract(PROSE + TOC + PROSE.replace(/id="\w+"/g, '') + PAGER, { removeContentPatterns: false });
		expect(result.contentMarkdown).toContain('On this page');
		expect(result.contentMarkdown).toContain('Advanced topics');
	});

	test('keeps citation lists whose backlinks are in-page anchors', async () => {
		const refs = `<h2>References</h2><ol class="refs">
<li id="cite_note-1"><a href="#cite_ref-1">^</a> First reference source</li>
<li id="cite_note-2"><a href="#cite_ref-2">^</a> Second reference source</li>
<li id="cite_note-3"><a href="#cite_ref-3">^</a> Third reference source</li>
</ol>`;
		const result = await extract(PROSE + refs + PROSE.replace(/id="\w+"/g, ''));
		expect(result.contentMarkdown).toContain('First reference source');
		expect(result.contentMarkdown).toContain('Third reference source');
	});

	test('does not treat link rows to other pages as prev/next bars', async () => {
		const links = `<div class="c3"><a href="/docs/install">Install</a> · <a href="/docs/configure">Configure</a> · <a href="/docs/deploy">Deploy</a></div>`;
		const result = await extract(PROSE + links + PROSE.replace(/id="\w+"/g, ''), { debug: true });
		const reasons = result.debug?.removals?.map(r => r.reason) || [];
		expect(reasons).not.toContain('prev/next navigation');
		expect(reasons).not.toContain('table of contents');
	});

	test('keeps in-page link lists that carry prose', async () => {
		const list = `<ul>
<li><a href="#one">Section one</a> explains which tools to gather first.</li>
<li><a href="#two">Section two</a> explains how to check the result.</li>
<li><a href="#three">Section three</a> suggests ways to practice.</li>
</ul>`;
		const result = await extract(PROSE + PROSE.replace(/id="\w+"/g, '') + list + PROSE.replace(/id="\w+"/g, ''));
		expect(result.contentMarkdown).toContain('explains which tools to gather first');
	});

	test('matches ToC entries to numbered headings with permalink text', async () => {
		const sections = PROSE
			.replace('>Section one<', '>1. Section one <a href="#one">Permalink</a><')
			.replace('>Section two<', '>2. Section two <a href="#two">Permalink</a><');
		const toc = `<ol class="c4"><li><a href="#one">Section one</a></li><li><a href="#two">Section two</a></li><li><a href="#three">Section three</a></li></ol>`;
		const result = await extract(PROSE.replace(/id="\w+"/g, '') + toc + sections, { debug: true });
		const reasons = result.debug?.removals?.map(r => r.reason) || [];
		expect(reasons).toContain('table of contents');
	});

	test('keeps an in-page link list with an image whole, including its nested lists', async () => {
		const toc = `<ul class="c5">
<li><a href="#one"><img src="https://example.com/icon.png" alt="">Section one</a></li>
<li><a href="#two">Section two</a><ul><li><a href="#one">Section one</a></li><li><a href="#two">Section two</a></li><li><a href="#three">Section three</a></li></ul></li>
<li><a href="#three">Section three</a></li>
</ul>`;
		const result = await extract(PROSE.replace(/id="\w+"/g, '') + toc + PROSE, { debug: true });
		const reasons = result.debug?.removals?.map(r => r.reason) || [];
		expect(reasons).not.toContain('table of contents');
		expect(result.content).toContain('icon.png');
		expect((result.content.match(/href="#three"/g) || []).length).toBe(2);
	});

	test('removes DocBook DSSSL navigation tables and summary-only navigation tables', async () => {
		const header = `<div class="NAVHEADER"><table summary="Header navigation table" width="100%"><tr><th colspan="3" align="center">Example Guide</th></tr><tr><td align="left"><a href="/guide/part-1.html">Prev</a></td><td align="center">Part 2</td><td align="right"><a href="/guide/part-3.html">Next</a></td></tr></table></div>`;
		const footer = `<table width="100%" summary="Navigation footer"><tr><td><a href="/guide/part-1.html">Prev</a></td><td><a href="/guide/index.html">Home</a></td><td><a href="/guide/part-3.html">Next</a></td></tr><tr><td>Part 1</td><td></td><td>Part 3</td></tr></table>`;
		const data = `<table><tr><th>Step</th><th>Next step</th></tr><tr><td>Prepare</td><td>Install</td></tr></table>`;
		const result = await extract(header + PROSE + data + PROSE.replace(/id="\w+"/g, '') + footer);
		expect(result.content).not.toContain('Example Guide');
		expect(result.content).not.toContain('part-3.html');
		expect(result.content).toContain('Next step');
	});

	test('does not touch links inside code blocks', async () => {
		const code = `<pre><code>&lt;a href="#one"&gt;One&lt;/a&gt;
Next: <a href="/docs/advanced">Advanced</a></code></pre>`;
		const result = await extract(PROSE + code + PROSE.replace(/id="\w+"/g, ''));
		expect(result.contentMarkdown).toContain('Next: ');
	});
});
