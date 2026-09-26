import { describe, test, expect, vi, beforeEach } from 'vitest';
import { parseDocument } from './helpers';

const { throwOnNextCall, throwAlways } = vi.hoisted(() => ({
	throwOnNextCall: { value: false },
	throwAlways: { value: false }
}));

vi.mock('../src/standardize', async (importOriginal) => {
	const actual = await importOriginal<typeof import('../src/standardize')>();
	return {
		...actual,
		standardizeContent: (...args: Parameters<typeof actual.standardizeContent>) => {
			if (throwOnNextCall.value || throwAlways.value) {
				throwOnNextCall.value = false;
				throw new Error('simulated pipeline failure');
			}
			return actual.standardizeContent(...args);
		}
	};
});

const PARA = '<p>This is a substantial paragraph of genuine article body text that a content '
	+ 'extractor should confidently identify as the main content of this page rather than '
	+ 'as surrounding navigation or boilerplate chrome.</p>';

const HTML = `<!doctype html><html><head><title>Test Article</title></head><body>
	<nav><a href="/">Home</a><a href="/a">Alpha</a><a href="/b">Beta</a><a href="/c">Gamma</a></nav>
	<div class="content-body"><h1>Test Article</h1>${PARA.repeat(8)}</div>
	<footer><p>Copyright 2026 Example Inc. All rights reserved. Privacy Policy. Terms of Service.</p></footer>
</body></html>`;

async function parseWithFirstParseThrowing() {
	const { Defuddle } = await import('../src/node');
	const doc = parseDocument(HTML, 'https://example.com/');
	throwOnNextCall.value = true;
	const res = await Defuddle(doc, 'https://example.com/');
	throwOnNextCall.value = false;
	return res;
}

describe('degraded whole-<body> fallback', () => {
	beforeEach(() => {
		throwOnNextCall.value = false;
		throwAlways.value = false;
		vi.restoreAllMocks();
	});

	test('a throwing first parse still retries and returns real content', async () => {
		const res = await parseWithFirstParseThrowing();

		expect(res.content).not.toContain('Copyright 2026');
		expect(res.content).not.toContain('Gamma');
		expect(res.content).toContain('substantial paragraph');
	});

	test('control: without a throw, output is identical', async () => {
		const { Defuddle } = await import('../src/node');
		const doc = parseDocument(HTML, 'https://example.com/');
		const clean = await Defuddle(doc, 'https://example.com/');
		const degradedThenRetried = await parseWithFirstParseThrowing();

		expect(degradedThenRetried.content).toEqual(clean.content);
	});

	test('keeps successful content when later attempts fail', async () => {
		const { default: Defuddle } = await import('../src/index');
		const standardize = await import('../src/standardize');
		const html = HTML.replace(PARA.repeat(8), PARA.repeat(2));
		const parse = () => new Defuddle(parseDocument(html, 'https://example.com/'), { url: 'https://example.com/' }).parse();
		const clean = parse();
		expect(clean.wordCount).toBeGreaterThanOrEqual(50);
		expect(clean.wordCount).toBeLessThan(200);

		vi.spyOn(console, 'error').mockImplementation(() => {});
		const original = standardize.standardizeContent;
		const standardizeContent = vi.spyOn(standardize, 'standardizeContent')
			.mockImplementation(() => { throw new Error('simulated retry failure'); })
			.mockImplementationOnce(original);

		const retried = parse();

		expect(standardizeContent.mock.calls.length).toBeGreaterThan(1);
		expect(retried.content).toEqual(clean.content);
		expect(retried.content).not.toContain('Copyright 2026');
		expect(retried.content).not.toContain('Gamma');
	});

	test('returns the whole <body> only when every parse fails', async () => {
		const { default: Defuddle } = await import('../src/index');
		vi.spyOn(console, 'error').mockImplementation(() => {});
		throwAlways.value = true;

		const res = new Defuddle(parseDocument(HTML, 'https://example.com/'), { url: 'https://example.com/' }).parse();

		expect(res.content).toContain('substantial paragraph');
		expect(res.content).toContain('Copyright 2026');
		expect(res.title).toBe('Test Article');
	});

	test('parseAsync still tries async extractors when every parse degrades', async () => {
		const { default: Defuddle } = await import('../src/index');
		const { ExtractorRegistry } = await import('../src/extractor-registry');
		const findAsyncExtractor = vi.spyOn(ExtractorRegistry, 'findAsyncExtractor').mockReturnValue(null);
		vi.spyOn(console, 'error').mockImplementation(() => {});
		throwAlways.value = true;

		await new Defuddle(parseDocument(HTML, 'https://example.com/'), { url: 'https://example.com/' }).parseAsync();

		expect(findAsyncExtractor).toHaveBeenCalled();
	});

	test('debug reports errors caught by parse attempts', async () => {
		const { default: Defuddle } = await import('../src/index');
		vi.spyOn(console, 'error').mockImplementation(() => {});
		const parse = () => new Defuddle(parseDocument(HTML, 'https://example.com/'), { url: 'https://example.com/', debug: true }).parse();

		expect(parse().debug?.errors).toBeUndefined();

		throwOnNextCall.value = true;
		const retried = parse();
		expect(retried.debug?.errors).toEqual(['Error: simulated pipeline failure']);
		expect(retried.debug?.contentSelector).toBeTruthy();

		throwAlways.value = true;
		const fallback = parse();
		expect(fallback.debug?.errors).toEqual(['Error: simulated pipeline failure']);
		expect(fallback.debug?.contentSelector).toBe('');
	});

	test('parseAsync keeps the body fallback over an empty async result', async () => {
		const { default: Defuddle } = await import('../src/index');
		const { ExtractorRegistry } = await import('../src/extractor-registry');
		vi.spyOn(ExtractorRegistry, 'findAsyncExtractor').mockReturnValue({
			extractAsync: async () => ({ content: '', contentHtml: '' })
		} as any);
		vi.spyOn(console, 'error').mockImplementation(() => {});
		throwAlways.value = true;

		const res = await new Defuddle(parseDocument(HTML, 'https://example.com/'), { url: 'https://example.com/' }).parseAsync();

		expect(res.content).toContain('substantial paragraph');
	});

	test('parseAsync accepts an async result with content but no words', async () => {
		const { default: Defuddle } = await import('../src/index');
		const { ExtractorRegistry } = await import('../src/extractor-registry');
		vi.spyOn(ExtractorRegistry, 'findAsyncExtractor').mockReturnValue({
			extractAsync: async () => ({ content: '', contentHtml: '<img src="https://example.com/photo.jpg" alt="">' })
		} as any);
		vi.spyOn(console, 'error').mockImplementation(() => {});
		throwAlways.value = true;

		const res = await new Defuddle(parseDocument(HTML, 'https://example.com/'), { url: 'https://example.com/' }).parseAsync();

		expect(res.content).toContain('photo.jpg');
		expect(res.content).not.toContain('Copyright 2026');
	});

	test('returns the body fallback when the hidden-content search throws', async () => {
		const { default: Defuddle } = await import('../src/index');
		vi.spyOn(Defuddle.prototype as any, 'resolveStreamedContent').mockImplementation(() => {
			throw new Error('simulated resolver failure');
		});
		vi.spyOn(console, 'error').mockImplementation(() => {});
		const doc = parseDocument(HTML.replace('<div class="content-body">', '<div hidden class="content-body">'), 'https://example.com/');

		const res = new Defuddle(doc, { url: 'https://example.com/', debug: true }).parse();

		expect(res.content).toContain('Copyright 2026');
		expect(res.debug?.errors).toEqual(['Error: simulated resolver failure']);
	});

	test('returns the body fallback when the schema.org search throws', async () => {
		const { default: Defuddle } = await import('../src/index');
		vi.spyOn(Defuddle.prototype as any, '_findElementBySchemaText').mockImplementation(() => {
			throw new Error('simulated schema failure');
		});
		vi.spyOn(console, 'error').mockImplementation(() => {});
		throwAlways.value = true;
		const schema = `<script type="application/ld+json">${JSON.stringify({ '@type': 'Article', articleBody: 'Schema article body text. '.repeat(20) })}</script>`;
		const doc = parseDocument(HTML.replace('</head>', `${schema}</head>`), 'https://example.com/');

		const res = new Defuddle(doc, { url: 'https://example.com/', debug: true }).parse();

		expect(res.content).toContain('Copyright 2026');
		expect(res.debug?.errors).toContain('Error: simulated schema failure');
	});

	test('returns the body fallback when preprocessing throws', async () => {
		const { default: Defuddle } = await import('../src/index');
		vi.spyOn(Defuddle.prototype as any, '_normalizeAttributes').mockImplementation(() => {
			throw new Error('simulated preprocessing failure');
		});
		vi.spyOn(console, 'error').mockImplementation(() => {});
		const defuddle = () => new Defuddle(parseDocument(HTML, 'https://example.com/'), { url: 'https://example.com/', debug: true, useAsync: false });

		const res = defuddle().parse();
		expect(res.content).toContain('Copyright 2026');
		expect(res.debug?.errors).toEqual(['Error: simulated preprocessing failure']);
		expect(res).toMatchObject({ title: 'Test Article', domain: 'example.com', description: '', author: '', site: 'example.com' });
		expect((await defuddle().parseAsync()).content).toContain('Copyright 2026');

		const { MetadataExtractor } = await import('../src/metadata');
		vi.spyOn(MetadataExtractor, 'extract').mockImplementation(() => {
			throw new Error('simulated metadata failure');
		});
		const noMetadata = defuddle().parse();
		expect(noMetadata.content).toContain('Copyright 2026');
		expect(noMetadata).toMatchObject({ title: '', domain: 'example.com', description: '', favicon: '', image: '', language: '', published: '', author: '', site: '', schemaOrgData: null });
		expect(noMetadata.debug?.errors).toEqual(['Error: simulated preprocessing failure', 'Error: simulated metadata failure']);
	});
});
