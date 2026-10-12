import { afterEach, describe, expect, test, vi } from 'vitest';
import { readFileSync, rmSync, writeFileSync, mkdtempSync } from 'fs';
import { join } from 'path';
import { tmpdir } from 'os';
import { Readable } from 'stream';
import { Defuddle } from '../src/node';
import { parseSource, createProgram } from '../src/cli';
import { parseDocument } from './helpers';
import { BROWSER_UA } from '../src/fetch';

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

	test('retries a 403 with a browser user agent', async () => {
		const buffer = new TextEncoder().encode(fixtureHtml).buffer;
		const fetchMock = vi.fn()
			.mockResolvedValueOnce({
				ok: false,
				status: 403,
				statusText: 'Forbidden',
				headers: { get: () => null },
			})
			.mockResolvedValueOnce({
				ok: true,
				status: 200,
				statusText: 'OK',
				headers: { get: (header: string) => header === 'content-type' ? 'text/html' : null },
				arrayBuffer: () => Promise.resolve(buffer),
			});
		vi.stubGlobal('fetch', fetchMock);
		for (const name of ['HTTPS_PROXY', 'https_proxy', 'HTTP_PROXY', 'http_proxy', 'ALL_PROXY', 'all_proxy']) {
			vi.stubEnv(name, undefined as any);
		}

		const result = await parseSource('https://example.com', {});

		expect(result.output).toContain('Appendix I');
		expect(fetchMock).toHaveBeenCalledTimes(2);
		expect(fetchMock.mock.calls[1][1].headers['User-Agent']).toBe(BROWSER_UA);
	});

	test('does not replace an explicitly supplied user agent after a 403', async () => {
		const customUserAgent = 'custom-agent';
		const fetchMock = vi.fn().mockResolvedValue({
			ok: false,
			status: 403,
			statusText: 'Forbidden',
			headers: { get: () => null },
		});
		vi.stubGlobal('fetch', fetchMock);
		for (const name of ['HTTPS_PROXY', 'https_proxy', 'HTTP_PROXY', 'http_proxy', 'ALL_PROXY', 'all_proxy']) {
			vi.stubEnv(name, undefined as any);
		}

		await expect(parseSource('https://example.com', { userAgent: customUserAgent })).rejects.toThrow(
			'Failed to fetch: 403 Forbidden'
		);
		expect(fetchMock).toHaveBeenCalledOnce();
		expect(fetchMock.mock.calls[0][1].headers['User-Agent']).toBe(customUserAgent);
		expect(fetchMock.mock.calls[0][1].headers['User-Agent']).not.toBe(BROWSER_UA);
	});
});

afterEach(() => {
	vi.unstubAllGlobals();
	vi.unstubAllEnvs();
});
