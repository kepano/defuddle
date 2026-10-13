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

	test('registers each removal toggle flag', () => {
		const parseCommand = createProgram().commands.find((c) => c.name() === 'parse');
		const flags = [
			'--no-content-patterns',
			'--no-low-scoring',
			'--no-exact-selectors',
			'--no-partial-selectors',
			'--no-hidden-elements',
			'--no-small-images',
			'--remove-images',
		];
		for (const long of flags) {
			const option = parseCommand?.options.find((o) => o.long === long);
			expect(option, `option ${long} is registered`).toBeDefined();
		}
	});

	test('--no-content-patterns keeps content otherwise stripped by the metadata-list heuristic', async () => {
		// The blog-metadata-list heuristic removes short trailing <ul> link
		// lists introduced by a sentence not ending in ':'. Use a minimal
		// fixture that triggers it: an article ending with such a list.
		const html = `<!DOCTYPE html><html><body><main><article>
			<h1>Test article</h1>
			<p>The body has enough words to make the article extract well and clear the very-short content threshold so the rest of the pipeline runs as it would on a real article. We add a second sentence to make sure the scoring pass keeps this element.</p>
			<p>The companion artifacts are available from the following sources.</p>
			<ul>
				<li><a href="https://example.com/a">Mirror A</a></li>
				<li><a href="https://example.com/b">Mirror B</a></li>
			</ul>
		</article></main></body></html>`;

		const defaultResult = await parseSource('-', {}, createMockStdin(html));
		const keptResult = await parseSource(
			'-',
			{ contentPatterns: false },
			createMockStdin(html),
		);

		// With the default pipeline, the trailing link list is the kind of
		// element the metadata-list heuristic strips. Disabling content
		// patterns must keep it.
		expect(defaultResult.output).not.toContain('Mirror A');
		expect(keptResult.output).toContain('Mirror A');
		expect(keptResult.output).toContain('Mirror B');
	});

	test('--remove-images strips images from the output', async () => {
		const html = `<!DOCTYPE html><html><body><main><article>
			<h1>Test article</h1>
			<p>Article body with enough text content to clear the scoring pass and the very-short threshold so the rest of the pipeline runs normally during extraction.</p>
			<p><img src="https://example.com/cover.png" alt="cover" width="800" height="600"></p>
			<p>More body content follows the image to keep it inline within the article scope.</p>
		</article></main></body></html>`;

		const withImages = await parseSource('-', {}, createMockStdin(html));
		const withoutImages = await parseSource('-', { removeImages: true }, createMockStdin(html));

		expect(withImages.output).toContain('cover.png');
		expect(withoutImages.output).not.toContain('cover.png');
	});
});
