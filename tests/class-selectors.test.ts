import { describe, expect, test } from 'vitest';
import Defuddle from '../src/index';
import { parseDocument } from './helpers';

describe('Generated class selectors', () => {
	test.each(['@container/main', 'group/scroll-root', 'mb-5.5', '2xl:flex', '123', 'a"b', 'a\\b', 'safe-class', '--custom'])('round-trips class %s to the exact element', className => {
		const doc = parseDocument('<html><body><div>First</div><div>Second</div></body></html>', 'https://example.com/');
		const target = doc.body.children[1];
		for (const el of Array.from(doc.body.children)) el.setAttribute('class', className);
		const parser = new Defuddle(doc) as unknown as { getElementSelector(el: Element): string };
		const selector = parser.getElementSelector(target);
		expect(doc.querySelector(selector)).toBe(target);
	});
	test.each(['S:5', '123', '-5', '-', 'a"b', 'a b', 'a\\b', 'étiquette'])('round-trips id %s without a global CSS.escape', id => {
		const doc = parseDocument('<html><body><div>Target</div></body></html>', 'https://example.com/');
		const target = doc.querySelector('div')!;
		target.id = id;
		const parser = new Defuddle(doc) as unknown as { getElementSelector(el: Element): string };
		expect(doc.querySelector(parser.getElementSelector(target))).toBe(target);
	});

	test.each(['actual-story', '@container/main'])('keeps unique class %s stable across shadow-root hoisting', className => {
		const doc = parseDocument('<html><body><section><template shadowrootmode="open"><div>Hoisted widget</div></template><div>Article</div><div>Other widget</div></section></body></html>');
		const target = doc.querySelector('section > div')!;
		target.className = className;
		const parser = new Defuddle(doc) as unknown as {
			getElementSelector(el: Element): string;
			flattenDeclarativeShadowRoots(doc: Document): void;
		};
		const selector = parser.getElementSelector(target);
		expect(selector).not.toContain(':nth-of-type');
		const clone = doc.cloneNode(true) as Document;
		parser.flattenDeclarativeShadowRoots(clone);
		expect(clone.querySelector(selector)?.textContent).toBe('Article');
	});

});
