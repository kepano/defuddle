import { describe, expect, test } from 'vitest';
import Defuddle from '../src/index';
import { parseDocument } from './helpers';

describe('Generated class selectors', () => {
	test.each(['@container/main', 'group/scroll-root', 'mb-5.5', '2xl:flex', '123', 'a"b', 'a\\b', 'safe-class', '--custom'])('round-trips class %s to the exact element', className => {
		const doc = parseDocument('<html><body><div>First</div><div>Second</div></body></html>');
		const target = doc.body.children[1];
		for (const el of Array.from(doc.body.children)) el.setAttribute('class', className);
		const parser = new Defuddle(doc) as unknown as { getElementSelector(el: Element): string };
		const selector = parser.getElementSelector(target);
		expect(doc.querySelector(selector)).toBe(target);
	});
});
