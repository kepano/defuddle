import { describe, expect, test } from 'vitest';
import { removeBySelector } from '../src/removals/selectors';
import { parseDocument } from './helpers';

describe('Inline content anchor IDs', () => {
	test.each(['span', 'a', 'em', 'strong'])('preserves a %s term inside a paragraph', tag => {
		const doc = parseDocument(`<html><body><p>“<${tag} id="term-related-claim">related claim</${tag}>” means a claim for damages.</p></body></html>`);
		removeBySelector(doc, false);
		expect(doc.querySelector('p')!.textContent).toBe('“related claim” means a claim for damages.');
	});

	test.each([false, true])('preserves nested inline anchors (debug: %s)', debug => {
		const doc = parseDocument('<html><body><p>A <em><a href="/definition" id="term-related-claim"><span>related claim</span></a></em> must be considered.</p></body></html>');
		removeBySelector(doc, debug);
		expect(doc.querySelector('a')?.textContent).toBe('related claim');
		expect(doc.querySelector('a')?.getAttribute('href')).toBe('/definition');
	});

	test.each(['class', 'data-component', 'data-test', 'data-testid', 'data-test-id', 'data-qa', 'data-cy'])('still checks %s for inline clutter', attribute => {
		const doc = parseDocument(`<html><body><p>Article <span id="term-related-claim" ${attribute}="related-posts">Read more stories</span> continues.</p></body></html>`);
		removeBySelector(doc, false);
		expect(doc.querySelector('span')).toBeNull();
		expect(doc.querySelector('p')!.textContent).toBe('Article  continues.');
	});

	test.each(['hidden', 'class="promo"', 'id="comments"'])('still removes exact selector matches: %s', attribute => {
		const doc = parseDocument(`<html><body><p>Article <span ${attribute}>Clutter</span> continues.</p></body></html>`);
		removeBySelector(doc, false);
		expect(doc.querySelector('span')).toBeNull();
	});

	test('still removes a block-level related-posts container', () => {
		const doc = parseDocument('<html><body><p>Article text.</p><div id="related-posts"><p>Read more stories.</p></div></body></html>');
		removeBySelector(doc, false);
		expect(doc.getElementById('related-posts')).toBeNull();
		expect(doc.querySelector('p')!.textContent).toBe('Article text.');
	});

	test('still checks IDs on the paragraph itself', () => {
		const doc = parseDocument('<html><body><p id="related-posts">Read more stories.</p></body></html>');
		removeBySelector(doc, false);
		expect(doc.querySelector('p')).toBeNull();
	});

	test('still checks inline IDs outside paragraphs', () => {
		const doc = parseDocument('<html><body><div><span id="related-posts">Read more stories.</span></div></body></html>');
		removeBySelector(doc, false);
		expect(doc.querySelector('span')).toBeNull();
	});
});
