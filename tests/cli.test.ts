import { describe, expect, test } from 'vitest';
import { readFileSync, rmSync, writeFileSync, mkdtempSync } from 'fs';
import { join } from 'path';
import { tmpdir } from 'os';
import { Readable } from 'stream';
import { Defuddle } from '../src/node';
import { parseSource } from '../src/cli';
import { parseDocument } from './helpers';

const fixturePath = join(__dirname, 'fixtures', 'general--appendix-heading.html');
const fixtureHtml = readFileSync(fixturePath, 'utf-8');

function createMockStdin(html: string, isTTY = false): NodeJS.ReadStream {
	const stdin = Readable.from([html], { encoding: 'utf8' }) as NodeJS.ReadStream;
	(stdin as NodeJS.ReadStream & { isTTY?: boolean }).isTTY = isTTY;
	return stdin;
}

async function getExpectedContent(html: string): Promise<string> {
	const doc = parseDocument(html);
	const result = await Defuddle(doc);
	return result.content;
}

function stripHtmlAndNormalizeWhitespace(html: string): string {
	return html
		.replace(/<[^>]*>/g, ' ')
		.replace(/\s+/g, ' ')
		.trim();
}

describe('CLI parseSource', () => {
	test('reads HTML from stdin when no source is provided', async () => {
		const expected = await getExpectedContent(fixtureHtml);

		const result = await parseSource(undefined, {}, createMockStdin(fixtureHtml));

		expect(stripHtmlAndNormalizeWhitespace(result.output)).toEqual(stripHtmlAndNormalizeWhitespace(expected));
	});

	test('reads HTML from stdin when source is "-"', async () => {
		const result = await parseSource('-', { json: true }, createMockStdin(fixtureHtml));
		const parsed = JSON.parse(result.output);

		expect(parsed.title).toBe('Article with Appendix');
		expect(parsed.content).toContain('Appendix I');
	});

	test('continues to read local HTML files', async () => {
		const tempDir = mkdtempSync(join(tmpdir(), 'defuddle-cli-'));
		const filePath = join(tempDir, 'page.html');
		try {
			writeFileSync(filePath, fixtureHtml, 'utf-8');

			const expected = await getExpectedContent(fixtureHtml);
			const result = await parseSource(filePath, {});

			expect(stripHtmlAndNormalizeWhitespace(result.output)).toEqual(stripHtmlAndNormalizeWhitespace(expected));
		} finally {
			rmSync(tempDir, { recursive: true, force: true });
		}
	});

	test('throws a helpful error when no source is provided and stdin is a TTY', async () => {
		const stdin = createMockStdin('', true);

		await expect(parseSource(undefined, {}, stdin)).rejects.toThrow(
			'No input source provided. Pass a file path or URL, or pipe HTML to stdin.'
		);
	});
});
