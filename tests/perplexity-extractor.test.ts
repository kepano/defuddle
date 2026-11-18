import { describe, expect, test } from 'vitest';
import { readFileSync } from 'fs';
import { join } from 'path';
import Defuddle from '../src/index.full';
import { PerplexityExtractor } from '../src/extractors/perplexity';
import { parseDocument } from './helpers';

const PERPLEXITY_URL = 'https://www.perplexity.ai/search/test-conversation';
const conversationHTML = readFileSync(
	join(__dirname, 'fixtures', 'extractor--perplexity-conversation.html'),
	'utf-8'
);

describe('PerplexityExtractor', () => {
	test('extracts conversation turns in order and preserves rich answer content', () => {
		const doc = parseDocument(conversationHTML, PERPLEXITY_URL);
		const result = new Defuddle(doc, {
			url: PERPLEXITY_URL,
			separateMarkdown: true,
		}).parse();
		const markdown = result.contentMarkdown || '';

		expect(result.extractorType).toBe('perplexity');
		expect(result.title).toBe('Build a streaming parser');
		expect(result.site).toBe('Perplexity');

		const orderedContent = [
			'How should I parse streamed Markdown?',
			'Start with an incremental parser.',
			'How do I keep citations?',
			'Convert citation pills to footnotes',
		];
		let previousIndex = -1;
		for (const content of orderedContent) {
			const currentIndex = markdown.indexOf(content);
			expect(currentIndex).toBeGreaterThan(previousIndex);
			previousIndex = currentIndex;
		}

		expect(markdown).toContain('## Checklist');
		expect(markdown).toContain('- Preserve incomplete tokens');
		expect(markdown).toContain('parser.write(chunk);');
		expect(markdown).not.toContain('Injected extension control');
		expect(markdown).not.toContain('Copy answer');
		expect(markdown).not.toContain('Prepared by GPT-5.4 Thinking');
		expect(markdown).not.toContain('Unrelated selectable sidebar text');
		expect(markdown).not.toContain('Follow-up prompt');
		expect(markdown).not.toContain('Search input');
		expect(markdown).not.toContain('Computer');
		expect(markdown).not.toContain('Model');
	});

	test('converts citations to deduplicated Markdown footnotes', () => {
		const doc = parseDocument(conversationHTML, PERPLEXITY_URL);
		const result = new Defuddle(doc, {
			url: PERPLEXITY_URL,
			separateMarkdown: true,
		}).parse();
		const markdown = result.contentMarkdown || '';

		expect(markdown.match(/\[\^1\]/g)).toHaveLength(3);
		expect(markdown.match(/\[\^1\]:/g)).toHaveLength(1);
		expect(markdown.match(/\[\^2\]:/g)).toHaveLength(1);
		expect(markdown).toContain('[Example Docs](https://example.com/parser)');
		expect(markdown).toContain('[Spec & Guide](https://example.org/spec)');
		expect(markdown).toContain('Unsafe label');
		expect(markdown).not.toContain('javascript:alert(1)');

		const html = result.content;
		expect(html).toContain('id="fnref:1"');
		expect(html).toContain('id="fnref:1-2"');
	});

	test('does not claim empty or non-answer Perplexity pages', () => {
		const emptyDoc = parseDocument(`
			<html><body>
				<div role="heading"><span class="select-text">A draft query</span></div>
				<div id="markdown-content-0"><div class="loading">Loading</div></div>
			</body></html>
		`, 'https://www.perplexity.ai/');

		expect(new PerplexityExtractor(emptyDoc, 'https://www.perplexity.ai/').canExtract()).toBe(false);
	});
});
