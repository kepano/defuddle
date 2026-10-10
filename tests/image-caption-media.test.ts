import { describe, expect, test } from 'vitest';
import { imageRules } from '../src/elements/images';
import { parseDocument } from './helpers';

describe('Media inside caption wrappers', () => {
	test.each([
		['img', '<img src="https://example.com/diagram.png">'],
		['picture', '<picture><source srcset="https://example.com/diagram.webp"><img src="https://example.com/diagram.png"></picture>'],
		['video', '<video src="https://example.com/movie.mp4"><source src="https://example.com/movie.webm"></video>'],
	])('keeps one %s outside the caption', (tag, media) => {
		const doc = parseDocument(`<html><body><figure><div class="caption-wrapper">${media}<span>A caption with <em>emphasis</em> and a <a href="https://example.net/reference">source link</a>.</span></div></figure></body></html>`);
		const figure = doc.querySelector('figure')!;
		const rule = imageRules.find(rule => rule.selector === 'figure, p:has([class*="caption"])')!;
		const result = rule.transform(figure, doc);
		expect(result.querySelectorAll(tag)).toHaveLength(1);
		const caption = result.querySelector('figcaption')!;
		expect(caption.querySelector('img, picture, source, video')).toBeNull();
		expect(caption.querySelector('em')?.textContent).toBe('emphasis');
		expect(caption.querySelector('a')?.getAttribute('href')).toBe('https://example.net/reference');
	});

	test.each(['iframe', 'audio', 'object', 'embed'])('excludes embedded %s from caption content', tag => {
		const doc = parseDocument(`<html><body><figure><div class="caption-wrapper"><img src="https://example.com/photo.jpg"><${tag} src="https://example.com/media"></${tag}><span>A caption with an accompanying embedded player.</span></div></figure></body></html>`);
		const rule = imageRules.find(rule => rule.selector === 'figure, p:has([class*="caption"])')!;
		const result = rule.transform(doc.querySelector('figure')!, doc);
		expect(result.querySelector('figcaption')?.querySelector(tag)).toBeNull();
		expect(result.querySelector('figcaption')?.textContent).toContain('A caption with an accompanying embedded player.');
	});
});

describe('Captions outside the replaced element', () => {
	const figureRule = imageRules.find(rule => rule.selector === 'figure, p:has([class*="caption"])')!;
	const spanRule = imageRules.find(rule => rule.selector === 'span:has(img)')!;

	test('does not take a sibling section with headings and media as a caption', () => {
		const doc = parseDocument('<html><body><div class="prose"><div class="text-base"><h2>Setup</h2><p>Para one of the setup section.</p><img src="https://example.com/chart.png" alt="Chart"><p>Para two of the setup section.</p></div><figure><img src="https://example.com/photo.png" alt=""></figure><p>After.</p></div></body></html>');
		const section = doc.querySelector('.text-base')!;
		const sectionHtml = section.outerHTML;
		const figure = doc.querySelector('figure')!;
		const result = figureRule.transform(figure, doc);
		expect(section.outerHTML).toBe(sectionHtml);
		expect(result.querySelector('figcaption')).toBeNull();
	});

	test('does not nest a sibling figure inside the caption', () => {
		const doc = parseDocument('<html><body><div><figure><img src="https://example.com/photo.png" alt=""></figure><figure class="image-text"><img src="https://example.com/second.png" alt="Second"><figcaption>The second figure caption with <em>emphasis</em>.</figcaption></figure></div></body></html>');
		const [first, second] = Array.from(doc.querySelectorAll('figure'));
		const secondHtml = second.outerHTML;
		const result = figureRule.transform(first, doc);
		expect(second.outerHTML).toBe(secondHtml);
		expect(result.querySelector('figcaption figcaption')).toBeNull();
		expect(result.querySelectorAll('img')).toHaveLength(1);
	});

	test('leaves a text-only sibling caption in place', () => {
		const doc = parseDocument('<html><body><div><figure><img src="https://example.com/photo.png" alt=""></figure><div class="image-credit"><p>Photo by <a href="https://example.net/photographer">a photographer</a>.</p></div></div></body></html>');
		const credit = doc.querySelector('.image-credit')!;
		const creditHtml = credit.outerHTML;
		const result = figureRule.transform(doc.querySelector('figure')!, doc);
		expect(credit.outerHTML).toBe(creditHtml);
		expect(result.querySelector('figcaption')).toBeNull();
		expect(credit.querySelector('a')?.getAttribute('href')).toBe('https://example.net/photographer');
	});

	test('keeps a caption beside a span-wrapped image', () => {
		const doc = parseDocument('<html><body><div><span><img src="https://example.com/photo.png" alt=""></span><span class="image-credit">Photo by <a href="https://example.net/photographer">a photographer</a>.</span></div></body></html>');
		const credit = doc.querySelector('.image-credit')!;
		const creditHtml = credit.outerHTML;
		const result = spanRule.transform(doc.querySelector('span')!, doc);
		expect(credit.outerHTML).toBe(creditHtml);
		expect(result.querySelector('figcaption')).toBeNull();
	});
});

describe('Block content inside captions', () => {
	const figureRule = imageRules.find(rule => rule.selector === 'figure, p:has([class*="caption"])')!;
	const transformCaption = (captionHtml: string): Element => {
		const doc = parseDocument(`<html><body><figure><img src="https://example.com/photo.png" alt="Photo">${captionHtml}</figure></body></html>`);
		return figureRule.transform(doc.querySelector('figure')!, doc).querySelector('figcaption')!;
	};

	test('flattens block wrappers and keeps inline markup', () => {
		const caption = transformCaption('<figcaption><blockquote>Quoted text</blockquote><ul><li>First <a href="https://example.net/source">link</a></li><li>Second <em>item</em></li></ul><table><tr><td>Cell <code>one</code></td><td>Cell two</td></tr></table><pre>Preformatted</pre><figcaption>Nested caption</figcaption></figcaption>');
		expect(caption.querySelector('blockquote, ul, ol, li, table, tr, td, pre, figcaption')).toBeNull();
		expect(caption.querySelector('a')?.getAttribute('href')).toBe('https://example.net/source');
		expect(caption.querySelector('em')?.textContent).toBe('item');
		expect(caption.querySelector('code')?.textContent).toBe('one');
		expect(caption.textContent).toBe('Quoted text First link Second item Cell one Cell two Preformatted Nested caption');
	});

	test('does not add leading, trailing, or doubled spaces', () => {
		const caption = transformCaption('<div class="caption"><h3>Title</h3><p>Body text with <strong>bold</strong> words.</p><div><p>Credit line</p></div></div>');
		expect(caption.textContent).toBe('Title Body text with bold words. Credit line');
		expect(caption.innerHTML).toBe('Title Body text with <strong>bold</strong> words. Credit line');
	});

	test('keeps words separated when blocks meet without whitespace', () => {
		const caption = transformCaption('<figcaption>Before<p>Inside</p>After <p>Spaced</p> end</figcaption>');
		expect(caption.textContent).toBe('Before Inside After Spaced end');
	});
});
