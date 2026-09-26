import { afterEach, describe, expect, test, vi } from 'vitest';
import { readFileSync } from 'fs';
import { join } from 'path';
import Defuddle from '../src/index';
import { ExtractorRegistry } from '../src/extractor-registry';
import { BaseExtractor } from '../src/extractors/_base';
import { parseDocument } from './helpers';

const html = readFileSync(join(__dirname, 'fixtures/issues--preferred-async-empty.html'), 'utf8');
const parse = () => new Defuddle(parseDocument(html, 'https://example.com/article'), { url: 'https://example.com/article' }).parseAsync();

function preferredResult(contentHtml: string) {
	vi.spyOn(ExtractorRegistry, 'findPreferredAsyncExtractor').mockReturnValue({
		extractAsync: async () => ({ content: contentHtml, contentHtml })
	} as BaseExtractor);
}

afterEach(() => vi.restoreAllMocks());

describe('preferred async extraction', () => {
	test.each(['', ' \n\t ', '<script>void 0</script>'])('falls through to DOM extraction for empty sanitized content: %j', async content => {
		const clean = await parse();
		preferredResult(content);

		const result = await parse();

		expect(result.content).toBe(clean.content);
		expect(result.content).toContain('This article remains available');
		expect(result.content).not.toContain('Copyright');
	});

	test.each([
		'<img src="https://example.com/photo.jpg" alt="">',
		'<iframe src="https://example.com/video"></iframe>'
	])('accepts content with no words: %s', async content => {
		preferredResult(content);

		const result = await parse();

		expect(result.wordCount).toBe(0);
		expect(result.content).toContain(content.includes('<img') ? 'photo.jpg' : '/video');
		expect(result.content).not.toContain('This article remains available');
	});
});
