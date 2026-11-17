import { describe, test, expect } from 'vitest';
import { Defuddle } from '../src/node';
import { parseDocument } from './helpers';

const PAGE_URL = 'https://example.com/docs/page';

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

const INTRO = '<p>This page is a short guide for readers who are new to the tool and want a quick tour of the main ideas before they start using it on a real project.</p>';
// PROSE without heading ids, to add length without adding link targets
const FILLER = PROSE.replace(/id="\w+"/g, '');

async function extract(body: string, options: Record<string, unknown> = {}) {
	return Defuddle(parseDocument(page(body), PAGE_URL), PAGE_URL, { separateMarkdown: true, ...options });
}

// One section per title, with ids s1, s2, …
function sections(...titles: string[]): string {
	return titles.map((title, i) => `<h2 id="s${i + 1}">${title}</h2><p>This part explains ${title.toLowerCase()} step by step, with the commands to run, the output to expect, and what to do when the result looks different.</p>`).join('');
}

async function removalReasons(body: string): Promise<string[]> {
	const result = await extract(body, { debug: true });
	return result.debug?.removals?.map(r => r.reason || '') || [];
}

const TOC = `<div><div>On this page</div><div><a href="#one">Section one</a></div><div><a href="#two">Section two</a></div><div><a href="#three">Section three</a></div></div>`;
const PAGER = `<div><div>Previous: <a href="/docs/intro">Introduction</a></div><div>Next: <a href="/docs/advanced">Advanced topics</a></div></div>`;

describe('In-page navigation removal', () => {
	test('records ToC and prev/next removals in debug output', async () => {
		const result = await extract(PROSE + TOC + FILLER + PAGER, { debug: true });
		const reasons = result.debug?.removals?.map(r => r.reason) || [];
		expect(reasons).toContain('table of contents');
		expect(reasons).toContain('prev/next navigation');
		expect(result.contentMarkdown).not.toContain('On this page');
		expect(result.contentMarkdown).not.toContain('Advanced topics');
	});

	test('keeps navigation when content pattern removal is disabled', async () => {
		const result = await extract(PROSE + TOC + FILLER + PAGER, { removeContentPatterns: false });
		expect(result.contentMarkdown).toContain('On this page');
		expect(result.contentMarkdown).toContain('Advanced topics');
	});

	test('keeps citation lists whose backlinks are in-page anchors', async () => {
		const refs = `<h2>References</h2><ol class="refs">
<li id="cite_note-1"><a href="#cite_ref-1">^</a> First reference source</li>
<li id="cite_note-2"><a href="#cite_ref-2">^</a> Second reference source</li>
<li id="cite_note-3"><a href="#cite_ref-3">^</a> Third reference source</li>
</ol>`;
		const result = await extract(PROSE + refs + FILLER);
		expect(result.contentMarkdown).toContain('First reference source');
		expect(result.contentMarkdown).toContain('Third reference source');
	});

	test('does not treat link rows to other pages as prev/next bars', async () => {
		const links = `<div><a href="/docs/install">Install</a> · <a href="/docs/configure">Configure</a> · <a href="/docs/deploy">Deploy</a></div>`;
		const reasons = await removalReasons(PROSE + links + FILLER);
		expect(reasons).not.toContain('prev/next navigation');
		expect(reasons).not.toContain('table of contents');
	});

	test('keeps in-page link lists that carry prose', async () => {
		const list = `<ul>
<li><a href="#one">Section one</a> explains which tools to gather first.</li>
<li><a href="#two">Section two</a> explains how to check the result.</li>
<li><a href="#three">Section three</a> suggests ways to practice.</li>
</ul>`;
		const result = await extract(PROSE + FILLER + list + FILLER);
		expect(result.contentMarkdown).toContain('explains which tools to gather first');
	});

	test('matches ToC entries to numbered, permalinked and longer headings', async () => {
		// Every heading differs from its ToC entry, so no entry matches exactly
		const body = PROSE
			.replace('>Section one<', '>1. Section one <a href="#one">Permalink</a><')
			.replace('>Section two<', '>2. Section two <a href="#two">Permalink</a><')
			.replace('>Section three<', '>Section three: wrapping up<');
		const toc = `<ol><li><a href="#one">Section one</a></li><li><a href="#two">Section two</a></li><li><a href="#three">Section three</a></li></ol>`;
		expect(await removalReasons(INTRO + toc + body)).toContain('table of contents');
	});

	test('keeps an in-page link list with an image whole, including its nested lists', async () => {
		const toc = `<ul>
<li><a href="#one"><img src="https://example.com/icon.png" alt="">Section one</a></li>
<li><a href="#two">Section two</a><ul><li><a href="#one">Section one</a></li><li><a href="#two">Section two</a></li><li><a href="#three">Section three</a></li></ul></li>
<li><a href="#three">Section three</a></li>
</ul>`;
		const result = await extract(FILLER + toc + PROSE, { debug: true });
		const reasons = result.debug?.removals?.map(r => r.reason) || [];
		expect(reasons).not.toContain('table of contents');
		expect(result.content).toContain('icon.png');
		expect((result.content.match(/href="#three"/g) || []).length).toBe(2);
	});

	test('removes upper-case NAVHEADER class values and summary-only navigation tables', async () => {
		const header = `<div class="NAVHEADER"><table summary="Header navigation table" width="100%"><tr><th colspan="3" align="center">Example Guide</th></tr><tr><td align="left"><a href="/guide/part-1.html">Prev</a></td><td align="center">Part 2</td><td align="right"><a href="/guide/part-3.html">Next</a></td></tr></table></div>`;
		const footer = `<table width="100%" summary="Navigation footer"><tr><td><a href="/guide/part-1.html">Prev</a></td><td><a href="/guide/index.html">Home</a></td><td><a href="/guide/part-3.html">Next</a></td></tr><tr><td>Part 1</td><td></td><td>Part 3</td></tr></table>`;
		const data = `<table><tr><th>Step</th><th>Next step</th></tr><tr><td>Prepare</td><td>Install</td></tr></table>`;
		const result = await extract(header + PROSE + data + FILLER + footer);
		expect(result.content).not.toContain('Example Guide');
		expect(result.content).not.toContain('part-3.html');
		expect(result.content).toContain('Next step');
	});

	test('does not touch links inside code blocks', async () => {
		// Some highlighters link identifiers and wrap each line in a <div>
		const code = `<pre><code><div><div><a href="#one">Section one</a></div><div><a href="#two">Section two</a></div><div><a href="#three">Section three</a></div></div><div><a href="/docs/intro">« Previous</a> <a href="/docs/advanced">Next »</a></div></code></pre>`;
		const result = await extract(PROSE + code + FILLER);
		const codeBlock = result.contentMarkdown?.match(/```[\s\S]*?```/)?.[0] || '';
		expect(codeBlock).toContain('Section three');
		expect(codeBlock).toContain('« Previous Next »');
	});
});

describe('Table of contents rules', () => {
	const FOUR_SECTIONS = sections('Installing', 'Configuring', 'Deploying', 'Upgrading');
	const TOC_WITH_EDIT_LINK = `<ul>
<li><a href="#s1">Installing</a></li><li><a href="#s2">Configuring</a></li>
<li><a href="#s3">Deploying</a></li><li><a href="#s4">Upgrading</a></li>
<li><a href="https://github.com/example/docs/edit/main/page.md">Edit this page</a></li>
</ul>`;

	test('removes a list near the top that also links to an edit page', async () => {
		expect(await removalReasons(INTRO + TOC_WITH_EDIT_LINK + FOUR_SECTIONS)).toContain('table of contents');
	});

	test('keeps a list further down that also links to another site', async () => {
		const reasons = await removalReasons(INTRO + FILLER + FILLER + TOC_WITH_EDIT_LINK + FOUR_SECTIONS);
		expect(reasons).not.toContain('table of contents');
	});

	test('removes a ToC with section numbers outside the links', async () => {
		const toc = `<div><div>1. <a href="#one">Section one</a></div><div>2. <a href="#two">Section two</a></div><div>3. <a href="#three">Section three</a></div></div>`;
		expect(await removalReasons(toc + PROSE)).toContain('table of contents');
	});

	test('removes a paragraph label before a ToC', async () => {
		const toc = `<p>Contents</p><ul><li><a href="#one">Section one</a></li><li><a href="#two">Section two</a></li><li><a href="#three">Section three</a></li></ul>`;
		expect(await removalReasons(toc + PROSE)).toContain('table of contents heading');
	});

	test('removes the label before a ToC wrapped in a layout table', async () => {
		const toc = `<h2>On this page</h2><table><tr><td><ul><li><a href="#one">Section one</a></li><li><a href="#two">Section two</a></li><li><a href="#three">Section three</a></li></ul></td></tr></table>`;
		expect(await removalReasons(toc + PROSE)).toContain('table of contents heading');
	});

	test('removes a wrapper holding only the ToC and its label text', async () => {
		const toc = `<table><tr><td>Contents: <ul><li><a href="#one">Section one</a></li><li><a href="#two">Section two</a></li><li><a href="#three">Section three</a></li></ul></td></tr></table>`;
		const result = await extract(toc + PROSE);
		expect(result.contentMarkdown).not.toContain('Contents');
		expect(result.contentMarkdown).not.toContain('[Section one]');
	});

	test('keeps a sentence that links to several sections', async () => {
		const sentence = `<div><p>Start with <a href="#one">Section one</a>, then read <a href="#two">Section two</a> and <a href="#three">Section three</a>.</p></div>`;
		const result = await extract(sentence + PROSE);
		expect(result.contentMarkdown).toContain('then read');
	});

	test('keeps a list whose descriptions are longer than a label', async () => {
		const titles = ['Installing the command line tool', 'Configuring the project settings', 'Deploying the finished site'];
		const list = `<ul><li><a href="#s1">${titles[0]}</a> on macOS and Linux</li><li><a href="#s2">${titles[1]}</a> for each environment</li><li><a href="#s3">${titles[2]}</a> with a single command</li></ul>`;
		const result = await extract(INTRO + list + sections(...titles));
		expect(result.contentMarkdown).toContain('for each environment');
	});

	test('keeps a list whose descriptions outweigh the link text', async () => {
		// The lead-in ending in ":" keeps the blog metadata list rule out of the way
		const list = `<p>The guide has three parts:</p><ul><li><a href="#s1">Setup</a> first steps</li><li><a href="#s2">Usage</a> daily commands</li><li><a href="#s3">Help</a> getting support</li></ul>`;
		const result = await extract(INTRO + list + sections('Setup', 'Usage', 'Help'));
		expect(result.contentMarkdown).toContain('daily commands');
	});

	test('keeps in-page links split by several headings', async () => {
		const block = `<div><h3>Getting started</h3><a href="#one">Section one</a> <a href="#two">Section two</a><h3>Going further</h3><a href="#three">Section three</a></div>`;
		const result = await extract(PROSE + block + FILLER);
		expect(result.contentMarkdown).toContain('Going further');
	});

	test('keeps lists of hash-bang routes', async () => {
		const nav = `<ul><li><a href="#!/one">Section one</a></li><li><a href="#!/two">Section two</a></li><li><a href="#!/three">Section three</a></li></ul>`;
		expect(await removalReasons(nav + PROSE)).not.toContain('table of contents');
	});
});

// Link-dense <div> bars are already removed by content scoring; bars in a <p>
// are left to the prev/next rule.
describe('Prev/next bar rules', () => {
	test('removes a bar with a contents link in the middle of the page', async () => {
		const bar = `<p><a href="/docs/intro">« Previous</a> · <a href="/docs/">Contents</a> · <a href="/docs/advanced">Next »</a></p>`;
		expect(await removalReasons(PROSE + bar + FILLER)).toContain('prev/next navigation');
	});

	test('treats www and bare hosts as the same site', async () => {
		const bar = `<div>Previous: <a href="https://www.example.com/docs/intro">Introduction</a> Next: <a href="https://www.example.com/docs/advanced">Advanced topics</a></div>`;
		expect(await removalReasons(PROSE + bar + FILLER)).toContain('prev/next navigation');
	});

	test('keeps prose that links to the previous and next pages', async () => {
		const paragraph = `<p>Go back to the <a href="/docs/intro">previous page</a> or continue to the <a href="/docs/advanced">next page</a> when you are ready.</p>`;
		const result = await extract(PROSE + paragraph + FILLER);
		expect(result.contentMarkdown).toContain('when you are ready');
	});

	test('keeps a bar with images', async () => {
		const bar = `<p><a href="/docs/intro"><img src="https://example.com/intro.png" alt="Introduction">« Previous</a> <a href="/docs/advanced">Next »<img src="https://example.com/advanced.png" alt="Advanced topics"></a></p>`;
		const result = await extract(PROSE + bar + FILLER);
		expect(result.content).toContain('intro.png');
	});

	test('removes DocBook navfooter divs and navigation header tables on their own', async () => {
		const header = `<table summary="Navigation header" width="100%"><tr><td><a href="/guide/part-1.html">Prev</a></td><td><a href="/guide/part-3.html">Next</a></td></tr><tr><td>Header label</td><td></td></tr></table>`;
		// The row of neighbouring chapter titles keeps the link density low enough
		// that content scoring leaves the footer to the navfooter selector
		const footer = `<div class="navfooter"><hr><table width="100%"><tr><td><a href="/guide/part-1.html">Prev</a></td><td><a href="/guide/index.html">Up</a></td><td><a href="/guide/part-3.html">Next</a></td></tr><tr><td>Part 1. Getting the sources</td><td><a href="/guide/index.html">Home</a></td><td>Part 3. Building the release</td></tr></table></div>`;
		// The partial "footer" selector also catches navfooter; retries run
		// without partial selectors, so the exact selectors must hold on their own
		const result = await extract(header + PROSE + FILLER + footer, { removePartialSelectors: false });
		expect(result.content).not.toContain('Header label');
		expect(result.content).not.toContain('Building the release');
	});
});
