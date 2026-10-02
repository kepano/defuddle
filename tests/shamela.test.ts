import { describe, expect, test } from 'vitest';
import { Defuddle } from '../src/node';
import { parseDocument } from './helpers';

const URL = 'https://shamela.ws/book/0000000/0000000';
const CHAPTER = 'CHAPTER_SENTINEL Readers compare observations carefully and record their methods so another reader can inspect the evidence and repeat the work. ';
const SEARCH = 'SEARCH_SENTINEL Choose a collection and enter a phrase to search its volumes. Select a matching mode and review the available search settings. ';
const DIALOG = `<div role="dialog" aria-hidden="true"><input type="text"><div id="content">${SEARCH.repeat(5)}</div></div>`;
const page = (body: string) => `<html><head><title>Example book</title></head><body>${body}</body></html>`;

async function parse(html: string, url = URL, contentSelector?: string) {
	return Defuddle(parseDocument(html, url), url, { useAsync: false, separateMarkdown: true, contentSelector });
}

describe('Shamela book pages', () => {
	test.each([20, 40, 49, 50, 51, 60, 202])('keeps a %i-word chapter through retries', async words => {
		const chapter = 'CHAPTER_SENTINEL ' + Array(words - 1).fill('chapter').join(' ');
		const result = await parse(page(`${DIALOG}<div class="nass"><p>${chapter}</p></div>`));
		expect(result.wordCount).toBe(words);
		expect(result.content).toContain('CHAPTER_SENTINEL');
		expect(result.contentMarkdown).toContain('CHAPTER\\_SENTINEL');
		expect(result.content).not.toContain('SEARCH_SENTINEL');
		expect(result.extractorType).toBe('shamela');
	});

	test.each([
		'<div role="dialog" aria-hidden="true">',
		'<div hidden><div role="dialog" aria-hidden="true">',
		'<div role="dialog" aria-hidden="false">',
	])('keeps the book root separate from overlay %s', async start => {
		const end = start.includes('<div hidden>') ? '</div></div>' : '</div>';
		const result = await parse(page(`${start}<div id="content">${SEARCH.repeat(5)}</div>${end}<div class="nass"><p>${CHAPTER}</p></div>`));
		expect(result.content).toContain('CHAPTER_SENTINEL');
		expect(result.content).not.toContain('SEARCH_SENTINEL');
	});

	test.each(['hidden', 'aria-hidden="true"'])('recovers the book inside nested %s ancestors', async hidden => {
		const result = await parse(page(`${DIALOG}<div ${hidden}><div ${hidden}><div class="nass"><p>${CHAPTER}</p></div></div></div>`));
		expect(result.content).toContain('CHAPTER_SENTINEL');
		expect(result.content).not.toContain('SEARCH_SENTINEL');
	});

	test('does not confuse duplicate content IDs with the book root', async () => {
		const result = await parse(page(`${DIALOG}<div class="nass" id="content"><p>${CHAPTER}</p></div>`));
		expect(result.content).toContain('CHAPTER_SENTINEL');
		expect(result.content).not.toContain('SEARCH_SENTINEL');
	});

	test('respects a caller-selected overlay', async () => {
		const result = await parse(page(`${DIALOG}<div class="nass"><p>${CHAPTER}</p></div>`), URL, '#content');
		expect(result.content).toContain('SEARCH_SENTINEL');
		expect(result.content).not.toContain('CHAPTER_SENTINEL');
		expect(result.extractorType).not.toBe('shamela');
	});

	test.each([
		'https://shamela.ws.evil.example/book/1/2',
		'https://example.org/?url=https://shamela.ws/book/1/2',
		'https://shamela.ws/search?q=chapter',
		'https://shamela.ws/book/1',
	])('leaves other pages to automatic extraction: %s', async url => {
		const result = await parse(page(`<div class="nass">Unrelated sidebar.</div><article><p>${CHAPTER.repeat(5)}</p></article>`), url);
		expect(result.content).toContain('CHAPTER_SENTINEL');
		expect(result.extractorType).not.toBe('shamela');
	});

	test.each(['', '<div class="nass"></div>', '<div class="nass">First copy.</div><div class="nass">Second copy.</div>'])('falls back when the book root is absent, empty, or ambiguous: %s', async roots => {
		const result = await parse(page(`${roots}<article><p>${CHAPTER.repeat(5)}</p></article>`));
		expect(result.content).toContain('CHAPTER_SENTINEL');
		expect(result.extractorType).not.toBe('shamela');
	});

	test.each([
		`<div role="dialog" aria-hidden="true"><p>${CHAPTER.repeat(5)}</p></div>`,
		`<div aria-hidden="true"><div role="dialog"><p>${CHAPTER.repeat(5)}</p></div></div>`,
		`<details><summary>Read chapter</summary><p>${CHAPTER.repeat(5)}</p></details>`,
	])('preserves generic hidden/expandable article recovery %#', async body => {
		const result = await parse(page(`${body}<div id="fps">FPS: --</div>`), 'https://library.example.org/book/1/2');
		expect(result.content).toContain('CHAPTER_SENTINEL');
	});
});
