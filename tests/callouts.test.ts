import { describe, test, expect } from 'vitest';
import { Defuddle } from '../src/node';
import { parseDocument } from './helpers';

describe('Callouts', () => {
	test('preserves callouts with multiple classes such as "callout tip"', async () => {
		const html = `<!DOCTYPE html><html><head><title>Test</title></head><body><article><h1>Test</h1><p>Some intro text that is long enough to count as content for the page.</p>
<div class="callout tip" data-callout="tip"><div class="callout-title"><div class="callout-title-inner">Title</div></div><div class="callout-content"><p>Body text.</p></div></div>
<p>More text after the callout so the article has a body.</p></article></body></html>`;

		const doc = parseDocument(html, 'https://example.com');
		const result = await Defuddle(doc, 'https://example.com', { markdown: true });

		expect(result.content).toContain('> [!tip] Title\n> Body text.');
	});

	test('preserves collapsed fold marker when data-callout-fold is empty', async () => {
		const html = `<!DOCTYPE html><html><head><title>Test</title></head><body><article><h1>Test</h1><p>Some intro text that is long enough to count as content for the page.</p>
<div class="callout is-collapsible is-collapsed" data-callout="tip" data-callout-fold><div class="callout-title"><div class="callout-title-inner">Title</div></div><div class="callout-content"><p>Body text.</p></div></div>
<p>More text after the callout so the article has a body.</p></article></body></html>`;

		const doc = parseDocument(html, 'https://example.com');
		const result = await Defuddle(doc, 'https://example.com', { markdown: true });

		expect(result.content).toContain('> [!tip]- Title\n> Body text.');
	});

	test('preserves expanded fold marker when is-collapsible and data-callout-fold is empty', async () => {
		const html = `<!DOCTYPE html><html><head><title>Test</title></head><body><article><h1>Test</h1><p>Some intro text that is long enough to count as content for the page.</p>
<div class="callout is-collapsible" data-callout="note" data-callout-fold><div class="callout-title"><div class="callout-title-inner">Title</div></div><div class="callout-content"><p>Body text.</p></div></div>
<p>More text after the callout so the article has a body.</p></article></body></html>`;

		const doc = parseDocument(html, 'https://example.com');
		const result = await Defuddle(doc, 'https://example.com', { markdown: true });

		expect(result.content).toContain('> [!note]+ Title\n> Body text.');
	});
});
