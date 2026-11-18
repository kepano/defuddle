import { describe, expect, test } from 'vitest';
import DefuddleClass from '../src/index';
import type { DefuddleOptions } from '../src/types';
import { removeByContentPattern } from '../src/removals/content-patterns';
import { parseDocument } from './helpers';

const url = 'https://example.com/src/example/lib.rs.html';
const opening = '<p>Opening paragraph with enough words to read as the start of the article body for the extractor to find.</p>';

const repeat = (count: number, item: (i: number) => string, separator = '\n'): string =>
	Array.from({ length: count }, (_, i) => item(i + 1)).join(separator);
const date = (i: number): string => `Jan ${1 + (i % 28)}, ${2000 + (i % 25)}`;

function page(title: string, content: string): string {
	return `<html><head><title>${title}</title></head><body><main><h1>${title}</h1>${opening}${content}</main></body></html>`;
}

// A source view in the style of docs.rs: a line-number <pre> whose <code>
// holds one link per line, separated by newline text nodes, beside the code.
function sourcePage(lines: number): string {
	return '<html><head><title>lib.rs - source</title></head><body><main><h1>lib.rs</h1>'
		+ `<div class="source-code"><pre id="line-numbers"><code>${repeat(lines, i => `<a href="#${i}" id="${i}">${i}</a>`)}\n</code></pre></div>`
		+ `<div class="source-code"><pre><code>${repeat(lines, i => `let value_${i} = compute(${i});`)}\n</code></pre></div>`
		+ '</main></body></html>';
}

// Pages where a single parent holds one child per line or item, each with a
// child count large enough for quadratic work to stand out. JSDOM iterates a
// large parent's children slowly, so the pages it handles slowly use fewer.
const PAGES: Array<[string, (count: number) => string, number]> = [
	['a line-number gutter', sourcePage, 300],
	['a dated list', count => page('Archive', `<ul>${repeat(count, i => `<li><span>${date(i)}</span> <a href="/posts/${i}">Post number ${i}</a></li>`)}</ul>`), 200],
	['dates in one paragraph', count => page('Archive', `<p>${repeat(count, i => `<time datetime="2020-01-01">${date(i)}</time> <a href="/posts/${i}">Post number ${i}</a>`, '<br>\n')}</p>`), 200],
	['dates in one block', count => page('Archive', `<div>${repeat(count, i => `<time datetime="2020-01-01">${date(i)}</time> <a href="/posts/${i}">Post number ${i}</a>`, '<br>\n')}</div>`), 150],
	['a video gallery', count => page('Gallery', `<div>${repeat(count, i => `<video src="/media/clip-${i}.mp4" controls></video>`)}</div>`), 150],
	['an image gallery', count => page('Gallery', `<div>${repeat(count, i => `<img src="/media/photo-${i}.jpg" alt="Photo ${i}" width="400" height="300">`)}</div>`), 150],
	['short paragraphs', count => page('Lines', repeat(count, i => `<p>Short line number ${i} here.</p>`)), 1000],
	['short blocks', count => page('Lines', repeat(count, i => `<div>Line ${i} here</div>`)), 250],
];

function ownerOf(object: object, name: string): any {
	for (let proto = Object.getPrototypeOf(object); proto; proto = Object.getPrototypeOf(proto)) {
		if (Object.prototype.hasOwnProperty.call(proto, name)) return proto;
	}
	throw new Error(`No prototype defines ${name}`);
}

// Counts the DOM work `run` does, independent of DOM implementation and
// wall-clock time. A querySelector or querySelectorAll call costs the number of
// elements under its receiver, which a query without a match has to visit; an
// element textContent read costs the length of the text it assembles; each
// sibling step costs one.
function measureDomWork(doc: Document, run: () => void): number {
	const sample = doc.createElement('div');
	const queryOwner = ownerOf(sample, 'querySelector');
	const queryAllOwner = ownerOf(sample, 'querySelectorAll');
	const query = queryOwner.querySelector;
	const queryAll = queryAllOwner.querySelectorAll;
	let work = 0;
	queryOwner.querySelector = function (this: Element, selectors: string) {
		work += queryAll.call(this, '*').length;
		return query.call(this, selectors);
	};
	queryAllOwner.querySelectorAll = function (this: Element, selectors: string) {
		work += queryAll.call(this, '*').length;
		return queryAll.call(this, selectors);
	};
	const getterCosts: Array<[string, (value: any) => number]> = [
		['textContent', (value: string | null) => value?.length ?? 0],
		['nextSibling', () => 1],
		['previousSibling', () => 1],
		['nextElementSibling', () => 1],
		['previousElementSibling', () => 1],
	];
	const restoreGetters = getterCosts.map(([name, cost]) => {
		const owner = ownerOf(sample, name);
		const descriptor = Object.getOwnPropertyDescriptor(owner, name)!;
		Object.defineProperty(owner, name, {
			...descriptor,
			get(this: Node) {
				const value = descriptor.get!.call(this);
				work += cost(value);
				return value;
			},
		});
		return () => Object.defineProperty(owner, name, descriptor);
	});
	try {
		run();
	} finally {
		queryOwner.querySelector = query;
		queryAllOwner.querySelectorAll = queryAll;
		restoreGetters.forEach(restore => restore());
	}
	return work;
}

describe('Pages with many siblings under one parent', () => {
	const domWork = (html: string, options: DefuddleOptions = {}): number => {
		const doc = parseDocument(html, url);
		return measureDomWork(doc, () => new DefuddleClass(doc, { url, ...options }).parse());
	};

	// Work that rescans a shared parent once per child grows with the square of
	// the child count: 4x the children would cost about 16x the work instead of
	// about 4x.
	test.each(PAGES)('DOM work grows linearly with the children of %s', (_name, build, count) => {
		expect(domWork(build(4 * count)) / domWork(build(count))).toBeLessThan(6);
	});

	test.each<[string, DefuddleOptions]>([
		['code block standardization', { removeContentPatterns: false }],
		['content pattern removal', { standardize: false }],
	])('DOM work grows linearly with gutter lines in %s alone', (_step, options) => {
		expect(domWork(sourcePage(2000), options) / domWork(sourcePage(500), options)).toBeLessThan(6);
	});
});

// Expected outputs below were produced before parent lookups were cached.
describe('Cached parent lookups', () => {
	const contentPatterns = (html: string, pageUrl = 'https://example.com/posts/example'): string => {
		const doc = parseDocument(`<html><body>${html}</body></html>`, pageUrl);
		const main = doc.querySelector('main')!;
		removeByContentPattern(main, false, pageUrl, 'Title', '');
		return main.outerHTML;
	};

	test('extract a line-number gutter and its source unchanged', () => {
		const doc = parseDocument(sourcePage(3), url);
		expect(new DefuddleClass(doc, { url }).parse().content).toBe(
			'<main><h2>lib.rs</h2> <div><pre><code>1\n2\n3</code></pre></div> '
			+ '<div><pre><code>let value_1 = compute(1);\nlet value_2 = compute(2);\nlet value_3 = compute(3);</code></pre></div></main>'
		);
	});

	test('skip whitespace only where its own parent holds line spans', () => {
		const html = page('Example', '<pre><code><span class="block"><span class="line">a</span>\n<span class="line">b</span></span>\n'
			+ '<span class="other"><span>c</span> <span>d</span></span></code></pre>');
		const doc = parseDocument(html, 'https://example.com/example');
		expect(new DefuddleClass(doc, { url: 'https://example.com/example' }).parse().content)
			.toContain('<pre><code>a\nb\nc d</code></pre>');
	});

	test('reread parent text after removing a breadcrumb link', () => {
		// The first link precedes the first heading, so it is removed as a
		// breadcrumb. That leaves the second link as its parent's only text,
		// which qualifies it too even though it follows the heading.
		expect(contentPatterns('<main><ul><li><a href="/docs/">Docs</a><h2></h2><a href="/docs/guide/">Guide</a></li></ul>'
			+ '<p>Body text.</p></main>', 'https://example.com/docs/guide/page'))
			.toBe('<main><ul><li><h2></h2></li></ul><p>Body text.</p></main>');
	});

	test('reread row text after removing read-time metadata', () => {
		// Removing the first read time leaves a row that starts with a "Date:"
		// label, which protects the second read time from removal.
		expect(contentPatterns(`<main><h1>Title</h1>${opening}<div><span><span>Jan 9, 2020 · 12 min read</span> Date: `
			+ '<span>Jan 6, 2020 · 3 min read</span></span> <span>Trailing words that keep this whole row longer than fifteen words in total.</span></div></main>'))
			.toBe(`<main><h1>Title</h1>${opening}<div><span> Date: <span>Jan 6, 2020 · 3 min read</span></span> `
				+ '<span>Trailing words that keep this whole row longer than fifteen words in total.</span></div></main>');
	});

	test('reread paragraph text after removing a boundary date', () => {
		// Once the first date is removed, the paragraph wraps only the second
		// date, so the whole paragraph is removed with it.
		expect(contentPatterns(`<main><h1>Title</h1>${opening}<p><time>Jan 1, 2020</time> <time>Jan 2, 2020</time></p></main>`))
			.toBe(`<main><h1>Title</h1>${opening}</main>`);
	});

	test('reread container text after removing an audio widget', () => {
		// Removing the "Listen to this article" widget leaves its container short
		// enough to count as the second player's own pre-content container.
		expect(contentPatterns('<main><div><div>Listen to this article <audio src="/a.mp3"></audio> read aloud by a narrator, '
			+ 'with a few more words added to this player here</div> <audio src="/b.mp3"></audio> '
			+ `<span>Ten more words of text sit beside the second player.</span></div><h1>Title</h1>${opening}</main>`))
			.toBe(`<main><h1>Title</h1>${opening}</main>`);
	});

	test('remove category badges before the content', () => {
		expect(contentPatterns('<main><div><a href="/category/news"><img src="/icons/news.png" alt=""></a>'
			+ `<a href="/category/news">News</a></div><h1>Title</h1>${opening}</main>`))
			.toBe(`<main><h1>Title</h1>${opening}</main>`);
	});

	test('remove lightbox duplicates only beside their own image link', () => {
		const pageUrl = 'https://example.com/gallery';
		const html = page('Gallery', '<div class="gallery">'
			+ '<a href="https://example.com/full/1.jpg"><img src="https://example.com/thumb/1.jpg" alt="One"></a>'
			+ '<img src="https://example.com/full/1.jpg?w=800" alt="One large">'
			+ '<a href="https://example.com/full/2.jpg">Second photo</a>'
			+ '<img src="https://example.com/full/2.jpg" alt="Two">'
			+ '<img src="https://example.com/full/3.jpg" alt="Three">'
			+ '</div><div class="other"><img src="https://example.com/full/1.jpg" alt="One again"></div>');
		const doc = parseDocument(html, pageUrl);
		const images = Array.from(parseDocument(new DefuddleClass(doc, { url: pageUrl }).parse().content).querySelectorAll('img'))
			.map(img => img.getAttribute('alt'));
		expect(images).toEqual(['One', 'Two', 'Three', 'One again']);
	});
});
