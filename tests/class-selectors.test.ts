import { describe, expect, test } from 'vitest';
import { JSDOM } from 'jsdom';
import DefuddleClass from '../src/index';
import { Defuddle } from '../src/node';
import { parseLinkedomHTML } from '../src/utils/linkedom-compat';

const URL_ = 'https://example.com/article';
const PROSE = '<p>This is the main article with meaningful prose about a practical experiment. It explains the methods used to collect observations and the reasoning behind the conclusions. Readers need the complete text to understand how the results were obtained and what they mean.</p>';

type SelectorParser = {
	getElementSelector(el: Element): string;
	flattenDeclarativeShadowRoots(doc: Document): void;
	resolveStreamedContent(doc: Document): void;
	findLargestHiddenContentSelector(): string | undefined;
};

describe.each(['linkedom', 'jsdom'])('Generated selectors (%s)', implementation => {
	function parse(html: string): Document {
		if (implementation === 'jsdom') return new JSDOM(html, { url: URL_ }).window.document as any;
		return parseLinkedomHTML(html, URL_);
	}

	function selectorFor(doc: Document, el: Element): string {
		return (new DefuddleClass(doc) as unknown as SelectorParser).getElementSelector(el);
	}

	test.each([
		'@container/main', 'group/scroll-root', 'mb-5.5', '2xl:flex', '123', 'a"b', 'a\\b', 'safe-class', '--custom',
		'pt-[131px]', 'bg-[#fff]', 'p-4!', 'a,b', "a'b", 'x\u0001y', 'a b',
	])('round-trips class %j to the exact element', className => {
		const doc = parse('<html><body><div>First</div><div>Second</div></body></html>');
		const target = doc.body.children[1];
		for (const el of Array.from(doc.body.children)) el.setAttribute('class', className);
		expect(doc.querySelector(selectorFor(doc, target))).toBe(target);
	});

	test.each(['S:5', '123', '-5', '-', 'a"b', 'a b', 'a\\b', 'étiquette', 'post:', 'a\nb'])('round-trips id %j', id => {
		const doc = parse('<html><body><div>Target</div></body></html>');
		const target = doc.querySelector('div')!;
		target.id = id;
		expect(doc.querySelector(selectorFor(doc, target))).toBe(target);
	});

	test('round-trips a multi-class element under a Tailwind arbitrary-value ancestor', () => {
		const doc = parse('<html><body><section><div class="pt-[131px] bg-[#fff] container"><article class="story lead">Target</article><article class="story">Other</article></div></section></body></html>');
		const target = doc.querySelector('article')!;
		const selector = selectorFor(doc, target);
		expect(selector).not.toContain(':nth-of-type');
		expect(doc.querySelector(selector)).toBe(target);
	});

	test('round-trips a paragraph under an ancestor with a special id', () => {
		const doc = parse('<html><body><div id="post:"><p>Target</p></div></body></html>');
		const target = doc.querySelector('p')!;
		expect(doc.querySelector(selectorFor(doc, target))).toBe(target);
	});

	test('extracts hidden content under a Tailwind arbitrary-value ancestor', async () => {
		const doc = parse(`<html><head><title>Selector example</title></head><body><p>Short visible content.</p><div class="pt-[131px] bg-[#fff]"><div hidden class="story">${PROSE.repeat(4)}</div><div class="story">Unrelated sibling.</div></div></body></html>`);
		const result = await Defuddle(doc, URL_);
		expect(result.content).toContain('meaningful prose');
		expect(result.content).not.toContain('Short visible content');
		expect(result.content).not.toContain('Unrelated sibling');
	});

	test('returns a debug content selector that resolves in a fresh document', async () => {
		const html = `<html><head><title>Selector example</title></head><body><main><div style="display:none">Hidden</div><div class="post">${PROSE.repeat(4)}</div><div class="post">Short</div></main></body></html>`;
		const result = await Defuddle(parse(html), URL_, { debug: true });
		const selector = result.debug!.contentSelector;
		const fresh = parse(html);
		expect(fresh.querySelector(selector)?.textContent).toContain('meaningful prose');
		const retry = await Defuddle(parse(html), URL_, { contentSelector: selector });
		expect(retry.content).toContain('meaningful prose');
		expect(retry.content).not.toContain('Short</');
	});

	test.each(['actual-story', '@container/main', 'pt-[131px]'])('keeps unique class %s stable across shadow-root hoisting', className => {
		const doc = parse('<html><body><section><template shadowrootmode="open"><div>Hoisted widget</div></template><div>Article</div><div>Other widget</div></section></body></html>');
		const target = doc.querySelector('section > div')!;
		target.className = className;
		const parser = new DefuddleClass(doc) as unknown as SelectorParser;
		const selector = parser.getElementSelector(target);
		expect(selector).not.toContain(':nth-of-type');
		const clone = doc.cloneNode(true) as Document;
		parser.flattenDeclarativeShadowRoots(clone);
		expect(clone.querySelector(selector)?.textContent).toBe('Article');
	});

	test('keeps the hidden content selector valid across streamed content swaps', async () => {
		const html = `<html><head><title>Selector example</title></head><body><section><template id="B:0"></template><div class="card">Skeleton one</div><div class="card">Skeleton two</div><!--/$--><div class="card">Short visible teaser.</div><div class="card"><div hidden>${PROSE.repeat(4)}</div></div></section><div hidden id="S:0"><div class="card">Streamed card.</div></div><script>$RC("B:0","S:0")</script></body></html>`;
		const doc = parse(html);
		const parser = new DefuddleClass(doc) as unknown as SelectorParser;
		const selector = parser.findLargestHiddenContentSelector()!;
		const clone = doc.cloneNode(true) as Document;
		parser.resolveStreamedContent(clone);
		expect(clone.querySelector(selector)?.textContent).toContain('meaningful prose');
		const result = await Defuddle(parse(html), URL_);
		expect(result.content).toContain('meaningful prose');
		expect(result.content).not.toContain('Short visible teaser');
		expect(result.content).not.toContain('Streamed card');
	});
});
