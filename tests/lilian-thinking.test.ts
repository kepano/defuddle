import { describe, test, expect } from 'vitest';
import { readFileSync } from 'fs';
import { join } from 'path';
import { Defuddle } from '../src/node';

const fixturePath = join(
	__dirname,
	'fixtures',
	'general--lilianweng.github.io:posts:2025-05-01-thinking:.html'
);
const url = 'https://lilianweng.github.io/posts/2025-05-01-thinking/';

describe('Lilian Weng thinking article regression', () => {
	test('extracts the full article instead of stopping mid-post', async () => {
		const html = readFileSync(fixturePath, 'utf-8');
		const response = await Defuddle(html, url, { separateMarkdown: true });

		expect(response.wordCount).toBeGreaterThan(8000);
		expect(response.contentMarkdown).toContain('## Citation');
		expect(response.contentMarkdown).toContain('## References');
		expect(response.contentMarkdown).toContain('OpenAI. o3:');
		expect(response.contentMarkdown).toContain('Introducing OpenAI o3 and o4-mini.');
	});
});
