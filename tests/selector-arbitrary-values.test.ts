import { describe, expect, it } from 'vitest';
import { parseDocument } from './helpers';
import { removeBySelector } from '../src/removals/selectors';

describe('partial selectors with Tailwind arbitrary values', () => {
	it.each([
		'scroll-mt-[calc(var(--marketing-header-height)+var(--article-breadcrumb-height)+var(--spacing-4))]',
		'md:scroll-mt-[var(--article-breadcrumb-height)]',
		'[&_.sidebar]:hidden',
		'[--breadcrumb-height:4rem] scroll-mt-[var(--breadcrumb-height)]',
	])('preserves content styled with %s', className => {
		const doc = parseDocument('<html><body><h2>Section heading</h2></body></html>');
		const heading = doc.querySelector('h2')!;
		heading.setAttribute('class', className);
		removeBySelector(doc, false, false, true);
		expect(doc.querySelector('h2')).toBe(heading);
	});

	it.each([
		'class="breadcrumb scroll-mt-[var(--breadcrumb-height)]"',
		'class="scroll-mt-[var(--breadcrumb-height)] breadcrumb"',
		'class="[&amp;_p]:mt-0" data-testid="article-breadcrumb"',
		'class="scroll-mt-[var(--spacing-4)]" id="article-breadcrumb"',
		'class="[&amp;_p]:breadcrumb"',
	])('still removes navigation marked with %s', attributes => {
		const doc = parseDocument(`<html><body><div ${attributes}>Navigation trail</div></body></html>`);
		removeBySelector(doc, false, false, true);
		expect(doc.querySelector('div')).toBeNull();
	});
});
