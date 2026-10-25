import { describe, test, expect, vi } from 'vitest';
import { BilibiliExtractor } from '../src/extractors/bilibili';
import type { ExtractorOptions } from '../src/extractors/_base';
import { parseDocument } from './helpers';

function createExtractor(
	html = '<html><body></body></html>',
	url = 'https://www.bilibili.com/video/BV1nNkFBMEDS',
	options?: ExtractorOptions,
): BilibiliExtractor {
	const doc = parseDocument(html, url);
	return new BilibiliExtractor(doc, url, undefined, options);
}

describe('BilibiliExtractor — canExtract / getBvid', () => {
	test('canExtract returns true for valid bilibili video URL', () => {
		expect(createExtractor(undefined, 'https://www.bilibili.com/video/BV1nNkFBMEDS').canExtract()).toBe(true);
	});

	test('canExtract returns false for non-bilibili URL', () => {
		expect(createExtractor(undefined, 'https://www.youtube.com/watch?v=test').canExtract()).toBe(false);
	});

	test('canExtract returns false for bilibili URL without BV id', () => {
		expect(createExtractor(undefined, 'https://www.bilibili.com/').canExtract()).toBe(false);
	});

	test('getBvid extracts BV id from pathname', () => {
		expect((createExtractor() as any).getBvid()).toBe('BV1nNkFBMEDS');
	});

	test('getBvid extracts BV id with trailing slash', () => {
		const e = createExtractor(undefined, 'https://www.bilibili.com/video/BV1nNkFBMEDS/');
		expect((e as any).getBvid()).toBe('BV1nNkFBMEDS');
	});

	test('getBvid returns empty for URL without BV id', () => {
		expect((createExtractor(undefined, 'https://www.bilibili.com/bangumi/play/ep123') as any).getBvid()).toBe('');
	});
});

describe('BilibiliExtractor — getPageNumber', () => {
	test('defaults to page 1', () => {
		expect((createExtractor() as any).getPageNumber()).toBe(1);
	});

	test('extracts page number from ?p=2', () => {
		expect((createExtractor(undefined, 'https://www.bilibili.com/video/BV1nNkFBMEDS?p=2') as any).getPageNumber()).toBe(2);
	});

	test('clamps invalid page numbers to 1', () => {
		expect((createExtractor(undefined, 'https://www.bilibili.com/video/BV1nNkFBMEDS?p=0') as any).getPageNumber()).toBe(1);
		expect((createExtractor(undefined, 'https://www.bilibili.com/video/BV1nNkFBMEDS?p=-1') as any).getPageNumber()).toBe(1);
		expect((createExtractor(undefined, 'https://www.bilibili.com/video/BV1nNkFBMEDS?p=abc') as any).getPageNumber()).toBe(1);
	});
});

describe('BilibiliExtractor — normalizeSubtitleUrl', () => {
	test('normalizes protocol-relative URL', () => {
		const r = (createExtractor() as any).normalizeSubtitleUrl('//i0.hdslb.com/bfs/subtitle/foo.json');
		expect(r).not.toBeNull();
		expect(r.href).toBe('https://i0.hdslb.com/bfs/subtitle/foo.json');
	});

	test('accepts https URL', () => {
		const r = (createExtractor() as any).normalizeSubtitleUrl('https://aisubtitle.hdslb.com/bfs/ai_subtitle/prod/123');
		expect(r).not.toBeNull();
		expect(r.protocol).toBe('https:');
	});

	test('rejects http URL', () => {
		expect((createExtractor() as any).normalizeSubtitleUrl('http://i0.hdslb.com/bfs/subtitle/foo.json')).toBeNull();
	});

	test('returns null for empty/whitespace', () => {
		expect((createExtractor() as any).normalizeSubtitleUrl('')).toBeNull();
		expect((createExtractor() as any).normalizeSubtitleUrl('   ')).toBeNull();
	});

	test('returns null for invalid URL', () => {
		expect((createExtractor() as any).normalizeSubtitleUrl('not a url')).toBeNull();
	});
});

describe('BilibiliExtractor — isAllowedSubtitleHost', () => {
	test('allows .hdslb.com hosts', () => {
		expect((createExtractor() as any).isAllowedSubtitleHost(new URL('https://i0.hdslb.com/bfs/subtitle/foo.json'))).toBe(true);
	});

	test('allows .bilibili.com hosts', () => {
		expect((createExtractor() as any).isAllowedSubtitleHost(new URL('https://api.bilibili.com/x/v2/subtitle'))).toBe(true);
	});

	test('rejects unrelated host', () => {
		expect((createExtractor() as any).isAllowedSubtitleHost(new URL('https://evil.com/subtitle.json'))).toBe(false);
	});
});

describe('BilibiliExtractor — parseSubtitleJson', () => {
	test('parses valid subtitle JSON', () => {
		const r = (createExtractor() as any).parseSubtitleJson({
			body: [{ from: 0, to: 3, content: 'Hello world.' }, { from: 3, to: 6, content: 'Second line.' }],
		});
		expect(r).toBeDefined();
		expect(r.text).toContain('Hello world.');
		expect(r.html).toContain('<h2>Transcript</h2>');
	});

	test('returns undefined for empty body', () => {
		expect((createExtractor() as any).parseSubtitleJson({ body: [] })).toBeUndefined();
		expect((createExtractor() as any).parseSubtitleJson({})).toBeUndefined();
	});

	test('filters out lines with no text or non-numeric from', () => {
		const r = (createExtractor() as any).parseSubtitleJson({
			body: [{ from: 'bad', content: 'X' }, { from: 0, content: '' }, { from: 6, to: 9, content: 'Valid.' }],
		});
		expect(r).toBeDefined();
		expect(r.text).toContain('Valid.');
	});

	test('sorts lines by start time', () => {
		const r = (createExtractor() as any).parseSubtitleJson({
			body: [{ from: 5, to: 8, content: 'Second.' }, { from: 0, to: 3, content: 'First.' }],
		});
		expect(r.text.split('\n')[0]).toContain('First.');
	});
});

describe('BilibiliExtractor — concatTranscriptText', () => {
	test('joins CJK without space', () => {
		expect((createExtractor() as any).concatTranscriptText('你好', '世界')).toBe('你好世界');
	});
	test('joins alphanumeric with space', () => {
		expect((createExtractor() as any).concatTranscriptText('hello', 'world')).toBe('hello world');
	});
	test('handles empty strings', () => {
		expect((createExtractor() as any).concatTranscriptText('', 'hello')).toBe('hello');
		expect((createExtractor() as any).concatTranscriptText('hello', '')).toBe('hello');
	});
});

describe('BilibiliExtractor — groupSubtitleLines', () => {
	test('groups adjacent lines within gap threshold', () => {
		const groups = (createExtractor() as any).groupSubtitleLines([
			{ start: 0, end: 3, text: 'Hello' }, { start: 3, end: 6, text: 'world.' },
		]);
		expect(groups).toHaveLength(1);
		expect(groups[0].text).toBe('Hello world.');
	});

	test('splits on long gap', () => {
		const groups = (createExtractor() as any).groupSubtitleLines([
			{ start: 0, end: 3, text: 'First.' }, { start: 30, end: 33, text: 'Second.' },
		]);
		expect(groups).toHaveLength(2);
		expect(groups[1].speakerChange).toBe(true);
	});

	test('splits when group exceeds max duration', () => {
		const lines = Array.from({ length: 16 }, (_, i) => ({ start: i * 2, end: i * 2 + 2, text: `Line ${i}.` }));
		const groups = (createExtractor() as any).groupSubtitleLines(lines);
		expect(groups.length).toBeGreaterThan(1);
	});
});

describe('BilibiliExtractor — pickSubtitleTrack', () => {
	test('prefers zh-cn when no preference', () => {
		const picked = (createExtractor() as any).pickSubtitleTrack([
			{ lan: 'en', subtitle_url: 'https://i0.hdslb.com/en.json', id: 1 },
			{ lan: 'zh-cn', subtitle_url: 'https://i0.hdslb.com/zh.json', id: 2 },
		]);
		expect(picked.lan).toBe('zh-cn');
	});

	test('prefers human over AI subtitle', () => {
		const picked = (createExtractor() as any).pickSubtitleTrack([
			{ lan: 'zh-cn', subtitle_url: 'https://i0.hdslb.com/ai.json', id: 1, is_ai_subtitle: true },
			{ lan: 'zh-cn', subtitle_url: 'https://i0.hdslb.com/human.json', id: 2, is_ai_subtitle: false },
		]);
		expect(picked.id).toBe(2);
	});

	test('respects explicit language preference', () => {
		const e = createExtractor(undefined, undefined, { language: 'en' });
		const picked = (e as any).pickSubtitleTrack([
			{ lan: 'zh-cn', subtitle_url: 'https://i0.hdslb.com/zh.json', id: 1 },
			{ lan: 'en', subtitle_url: 'https://i0.hdslb.com/en.json', id: 2 },
		], (e as any).normalizeLanguageCode((e as any).options.language));
		expect(picked.lan).toBe('en');
	});

	test('falls back to base language match', () => {
		const e = createExtractor(undefined, undefined, { language: 'zh-TW' });
		const picked = (e as any).pickSubtitleTrack([
			{ lan: 'en', subtitle_url: 'https://i0.hdslb.com/en.json', id: 1 },
			{ lan: 'zh-cn', subtitle_url: 'https://i0.hdslb.com/zh.json', id: 2 },
		], (e as any).normalizeLanguageCode((e as any).options.language));
		expect(picked.lan).toBe('zh-cn');
	});

	test('returns undefined for empty tracks', () => {
		expect((createExtractor() as any).pickSubtitleTrack([])).toBeUndefined();
	});

	test('detects AI from lan_doc', () => {
		const picked = (createExtractor() as any).pickSubtitleTrack([
			{ lan: 'zh-cn', subtitle_url: 'https://i0.hdslb.com/ai.json', lan_doc: '中文（AI生成）', id: 1 },
			{ lan: 'zh-cn', subtitle_url: 'https://i0.hdslb.com/human.json', lan_doc: '中文', id: 2 },
		]);
		expect(picked.id).toBe(2);
	});
});

describe('BilibiliExtractor — parseSubtitleTracks', () => {
	test('parses from data.subtitle.subtitles', () => {
		const tracks = (createExtractor() as any).parseSubtitleTracks({
			data: { subtitle: { subtitles: [{ lan: 'zh-cn', subtitle_url: 'https://i0.hdslb.com/zh.json', id: 1 }] } },
		});
		expect(tracks).toHaveLength(1);
		expect(tracks[0].lan).toBe('zh-cn');
	});

	test('parses from data.subtitle.list', () => {
		const tracks = (createExtractor() as any).parseSubtitleTracks({
			data: { subtitle: { list: [{ lan: 'en', subtitle_url: 'https://i0.hdslb.com/en.json', id: 2 }] } },
		});
		expect(tracks).toHaveLength(1);
		expect(tracks[0].lan).toBe('en');
	});

	test('returns empty for missing data', () => {
		expect((createExtractor() as any).parseSubtitleTracks({})).toEqual([]);
	});

	test('filters out tracks without lan or subtitle_url', () => {
		const tracks = (createExtractor() as any).parseSubtitleTracks({
			data: { subtitle: { subtitles: [
				{ lan: '', subtitle_url: 'https://i0.hdslb.com/x.json' },
				{ lan: 'zh-cn', subtitle_url: '' },
				{ lan: 'en', subtitle_url: 'https://i0.hdslb.com/en.json', id: 3 },
			] } },
		});
		expect(tracks).toHaveLength(1);
		expect(tracks[0].lan).toBe('en');
	});
});

describe('BilibiliExtractor — extractAsync', () => {
	test('returns result with transcript from mocked API', async () => {
		const e = createExtractor();
		(e as any).fetchViewData = vi.fn().mockResolvedValue({
			bvid: 'BV1nNkFBMEDS', aid: 123, title: 'Test Video', desc: 'Desc',
			pic: 'https://i0.hdslb.com/cover.jpg', pubdate: 1700000000,
			owner: { name: 'TestAuthor' },
			pages: [{ cid: 456, page: 1, part: 'Part 1', duration: 120 }],
		});
		(e as any).fetchTranscript = vi.fn().mockResolvedValue({
			html: '<div class="bilibili transcript"><h2>Transcript</h2><p class="transcript-segment"><strong><span class="timestamp" data-timestamp="0">0:00</span></strong> · 你好世界</p></div>',
			text: '**0:00** · 你好世界',
			languageCode: 'zh-cn',
		});

		const result = await e.extractAsync();
		expect(result.variables!.title).toBe('Test Video');
		expect(result.variables!.author).toBe('TestAuthor');
		expect(result.variables!.site).toBe('Bilibili');
		expect(result.variables!.transcript).toContain('你好世界');
		expect(result.variables!.language).toBe('zh-cn');
		expect(result.content).toContain('<iframe');
		expect(result.content).toContain('player.bilibili.com');
	});

	test('returns result without transcript when no tracks', async () => {
		// Clear static cache to avoid leakage from previous tests
		(BilibiliExtractor as any).transcriptCache.clear();
		const e = createExtractor(undefined, 'https://www.bilibili.com/video/BV1DIFFERENT');
		(e as any).fetchViewData = vi.fn().mockResolvedValue({
			bvid: 'BV1DIFFERENT', aid: 999, title: 'No Sub', owner: { name: 'Auth' },
			pages: [{ cid: 789, page: 1 }],
		});
		(e as any).fetchPlayerV2 = vi.fn().mockResolvedValue({ tracks: [], code: 0 });

		const result = await e.extractAsync();
		expect(result.variables!.title).toBe('No Sub');
		expect(result.variables!.transcript).toBeUndefined();
	});

	test('returns empty result when fetchViewData fails', async () => {
		const e = createExtractor();
		(e as any).fetchViewData = vi.fn().mockResolvedValue(undefined);
		(e as any).fetchFallbackIds = vi.fn().mockResolvedValue(undefined);

		const result = await e.extractAsync();
		expect(result.variables!.title).toBeFalsy();
		expect(result.variables!.transcript).toBeUndefined();
	});

	test('prefersAsync returns true', () => {
		expect(createExtractor().prefersAsync()).toBe(true);
	});

	test('extract returns result without transcript (sync path)', () => {
		const result = createExtractor().extract();
		expect(result).toBeDefined();
		expect(result.content).toBeDefined();
	});
});

describe('BilibiliExtractor — pickSubtitleTrack with dm/view ai-* codes', () => {
	test('prefers ai-zh over ai-en when no preference', () => {
		const picked = (createExtractor() as any).pickSubtitleTrack([
			{ lan: 'ai-en', subtitle_url: 'https://aisubtitle.hdslb.com/en', lan_doc: '英语（自动翻译）', id: 1 },
			{ lan: 'ai-zh', subtitle_url: 'https://aisubtitle.hdslb.com/zh', lan_doc: '中文（自动生成）', id: 2 },
		]);
		expect(picked.lan).toBe('ai-zh');
	});

	test('respects explicit language preference for ai-* tracks', () => {
		const e = createExtractor(undefined, undefined, { language: 'en' });
		const picked = (e as any).pickSubtitleTrack([
			{ lan: 'ai-zh', subtitle_url: 'https://aisubtitle.hdslb.com/zh', id: 1 },
			{ lan: 'ai-en', subtitle_url: 'https://aisubtitle.hdslb.com/en', id: 2 },
		], (e as any).normalizeLanguageCode((e as any).options.language));
		expect(picked.lan).toBe('ai-en');
	});

	test('prefers a human track over an ai-* track in the same language', () => {
		const picked = (createExtractor() as any).pickSubtitleTrack([
			{ lan: 'ai-zh', subtitle_url: 'https://aisubtitle.hdslb.com/zh', id: 1 },
			{ lan: 'zh-cn', subtitle_url: 'https://i0.hdslb.com/zh.json', id: 2 },
		]);
		expect(picked.lan).toBe('zh-cn');
	});
});

describe('BilibiliExtractor — upgradeSubtitleUrlScheme', () => {
	test('upgrades http to https for allow-listed CDN hosts', () => {
		expect((createExtractor() as any).upgradeSubtitleUrlScheme('http://aisubtitle.hdslb.com/bfs/ai_subtitle/prod/123?auth_key=abc'))
			.toBe('https://aisubtitle.hdslb.com/bfs/ai_subtitle/prod/123?auth_key=abc');
	});

	test('leaves http URLs for other hosts unchanged', () => {
		expect((createExtractor() as any).upgradeSubtitleUrlScheme('http://evil.com/sub.json'))
			.toBe('http://evil.com/sub.json');
	});

	test('leaves https and protocol-relative URLs unchanged', () => {
		expect((createExtractor() as any).upgradeSubtitleUrlScheme('https://i0.hdslb.com/zh.json'))
			.toBe('https://i0.hdslb.com/zh.json');
		expect((createExtractor() as any).upgradeSubtitleUrlScheme('//i0.hdslb.com/zh.json'))
			.toBe('//i0.hdslb.com/zh.json');
	});
});

describe('BilibiliExtractor — fetchTranscript dm/view fallback', () => {
	test('uses dm/view tracks when the player endpoints return none', async () => {
		const fetchedSubtitleUrls: string[] = [];
		const jsonResponse = (data: any) => ({ ok: true, status: 200, json: async () => data });
		const mockFetch = vi.fn(async (input: any) => {
			const url = String(input);
			if (url.includes('/x/player/wbi/v2') || url.includes('/x/player/v2')) {
				return jsonResponse({ code: 0, data: { subtitle: { subtitles: [] } } });
			}
			if (url.includes('/x/v2/dm/view')) {
				expect(url).toContain('oid=456');
				expect(url).toContain('pid=123');
				return jsonResponse({ code: 0, data: { subtitle: { subtitles: [
					{ lan: 'ai-en', lan_doc: '英语（自动翻译）', subtitle_url: 'http://aisubtitle.hdslb.com/bfs/ai_subtitle/en', id: 11 },
					{ lan: 'ai-zh', lan_doc: '中文（自动生成）', subtitle_url: 'http://aisubtitle.hdslb.com/bfs/ai_subtitle/zh', id: 12 },
				] } } });
			}
			if (url.includes('aisubtitle.hdslb.com')) {
				fetchedSubtitleUrls.push(url);
				return jsonResponse({ body: [
					{ from: 0, to: 2, content: '你好世界' },
					{ from: 2, to: 4, content: '第二句' },
				] });
			}
			throw new Error(`unexpected fetch: ${url}`);
		});

		const e = createExtractor(undefined, undefined, { fetch: mockFetch as any });
		const transcript = await (e as any).fetchTranscript(123, 456, 'BV1nNkFBMEDS');

		expect(transcript).toBeDefined();
		expect(transcript.text).toContain('你好世界');
		expect(transcript.languageCode).toBe('zh');
		// The ai-zh track wins over ai-en, and its http:// URL was upgraded.
		expect(fetchedSubtitleUrls).toEqual(['https://aisubtitle.hdslb.com/bfs/ai_subtitle/zh']);
	});
});

describe('BilibiliExtractor — view API fallback ids', () => {
	test('fetchFallbackIds combines pagelist pages with the player aid', async () => {
		const e = createExtractor();
		(e as any).fetchPagelist = vi.fn().mockResolvedValue([{ cid: 456, page: 1 }]);
		(e as any).fetchPlayerAid = vi.fn().mockResolvedValue(123);
		await expect((e as any).fetchFallbackIds('BV1nNkFBMEDS'))
			.resolves.toEqual({ aid: 123, pages: [{ cid: 456, page: 1 }] });
	});

	test('fetchFallbackIds returns undefined when pagelist has no pages', async () => {
		const e = createExtractor();
		(e as any).fetchPagelist = vi.fn().mockResolvedValue(undefined);
		await expect((e as any).fetchFallbackIds('BV1nNkFBMEDS')).resolves.toBeUndefined();
	});

	test('extractAsync still gets a transcript when the view API fails', async () => {
		(BilibiliExtractor as any).transcriptCache.clear();
		const e = createExtractor(undefined, 'https://www.bilibili.com/video/BV1FALLBACK1');
		(e as any).fetchViewData = vi.fn().mockResolvedValue(undefined);
		(e as any).fetchFallbackIds = vi.fn().mockResolvedValue({
			aid: 123, pages: [{ cid: 456, page: 1, part: 'Part 1' }],
		});
		(e as any).fetchTranscript = vi.fn().mockResolvedValue({
			html: '<div class="bilibili transcript"><h2>Transcript</h2></div>',
			text: '**0:00** · 你好世界',
			languageCode: 'zh-cn',
		});

		const result = await e.extractAsync();
		expect(result.variables!.transcript).toContain('你好世界');
		expect(result.extractedContent.cid).toBe('456');
		// Single-part fallback: the pagelist part name serves as the title.
		expect(result.variables!.title).toBe('Part 1');
	});
});
