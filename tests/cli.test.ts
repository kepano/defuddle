import { describe, expect, test } from 'vitest';
import { readFileSync, rmSync, writeFileSync, mkdtempSync } from 'fs';
import { join } from 'path';
import { tmpdir } from 'os';
import { Readable } from 'stream';
import { Defuddle } from '../src/node';
import { parseSource, createProgram } from '../src/cli';
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

	test('prepends YAML frontmatter when --frontmatter is set', async () => {
		const body = await getExpectedContent(fixtureHtml);

		const result = await parseSource(undefined, { frontmatter: true }, createMockStdin(fixtureHtml));

		expect(result.output.startsWith('---\n')).toBe(true);
		expect(result.output).toContain('title: "Article with Appendix"');
		// frontmatter block closes with --- followed by a blank line, then the body
		expect(result.output).toContain('---\n\n' + body);
		// stdin input has no URL, so no source: line is emitted
		expect(result.output).not.toContain('source:');
	});

	test('omits frontmatter by default', async () => {
		const result = await parseSource(undefined, {}, createMockStdin(fixtureHtml));
		expect(result.output.startsWith('---')).toBe(false);
	});

	test('registers the --frontmatter flag with a -f alias', () => {
		const parseCommand = createProgram().commands.find((c) => c.name() === 'parse');
		const option = parseCommand?.options.find((o) => o.long === '--frontmatter');

		expect(option).toBeDefined();
		expect(option?.short).toBe('-f');
		expect(option?.attributeName()).toBe('frontmatter');
	});

	test('registers the --user-agent flag with a -u alias', () => {
		const parseCommand = createProgram().commands.find((c) => c.name() === 'parse');
		const option = parseCommand?.options.find((o) => o.long === '--user-agent');

		expect(option).toBeDefined();
		expect(option?.short).toBe('-u');
		// commander camelCases --user-agent → options.userAgent, which parseSource reads.
		expect(option?.attributeName()).toBe('userAgent');
	});

	test('registers the --extractor flag as a repeatable string array', () => {
		const parseCommand = createProgram().commands.find((c) => c.name() === 'parse');
		const option = parseCommand?.options.find((o) => o.long === '--extractor');

		expect(option).toBeDefined();
		expect(option?.attributeName()).toBe('extractor');
		// commander invokes the collector with the default starting empty array
		expect(option?.defaultValue).toEqual([]);
	});

	test('--extractor loads the supplied module and registers it with ExtractorRegistry', async () => {
		const { ExtractorRegistry } = await import('../src/extractor-registry');
		const fixturePath = join(__dirname, 'fixtures', 'cli-extractor-custom.mjs');

		const before = (ExtractorRegistry as unknown as { mappings: unknown[] }).mappings.length;

		// parseSource runs loadExtractor early. The fixture's patterns don't match
		// the stdin (no URL) so the registered extractor isn't used for parsing —
		// we only assert registration happened.
		await parseSource(undefined, { extractor: [fixturePath] }, createMockStdin(fixtureHtml));

		const after = (ExtractorRegistry as unknown as { mappings: unknown[] }).mappings.length;
		expect(after).toBe(before + 1);
	});

	test('--extractor rejects modules that do not default-export the expected shape', async () => {
		const fixturePath = join(__dirname, 'fixtures', 'cli-extractor-malformed.mjs');

		await expect(
			parseSource(undefined, { extractor: [fixturePath] }, createMockStdin(fixtureHtml))
		).rejects.toThrow(/must default-export/);
	});
});
