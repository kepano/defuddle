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
});
