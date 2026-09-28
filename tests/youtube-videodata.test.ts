import { describe, test, expect } from 'vitest';
import { readFileSync } from 'fs';
import { join } from 'path';
import { Defuddle } from '../src/defuddle';
import { YoutubeExtractor } from '../src/extractors/youtube';
import { parseDocument } from './helpers';

const VIDEO_ID = 'abcdEFGH123';
const URL = `https://www.youtube.com/watch?v=${VIDEO_ID}`;

// Regression test for #211 / #293: YouTube embeds multiple VideoObject ld+json
// blocks. The first one is often derived from the top comment and lacks a
// `description`; the real video metadata block (with the description) comes
// later. getVideoData() must skip the description-less comment object and
// return the block that actually has the description.
function createExtractor(html: string): YoutubeExtractor {
	const doc = parseDocument(html, URL);
	return new YoutubeExtractor(doc, URL, undefined, undefined);
}

function ldJson(obj: unknown): string {
	return `<script type="application/ld+json">${JSON.stringify(obj)}</script>`;
}

describe('YouTube videoData selection', () => {
	test('prefers the VideoObject with a description over a comment-derived one', () => {
		// First block: comment-derived VideoObject — matches the video id but has no description.
		const commentObject = {
			'@context': 'https://schema.org',
			'@type': 'VideoObject',
			'@id': URL,
			name: 'Comment-derived title',
			thumbnailUrl: `https://i.ytimg.com/vi/${VIDEO_ID}/maxresdefault.jpg`,
			uploadDate: '2024-05-26T08:08:22-07:00',
			comment: [{ '@type': 'https://schema.org/Comment', text: 'Nice video' }],
		};
		// Second block: the real video metadata, including the description.
		const mainObject = {
			'@context': 'https://schema.org',
			'@type': 'VideoObject',
			'@id': URL,
			name: 'Real video title',
			description: 'The real description that should appear in the content.',
			duration: 'PT2354S',
			embedUrl: `https://www.youtube.com/embed/${VIDEO_ID}`,
			uploadDate: '2024-06-02T01:01:18-07:00',
			author: 'Channel Author',
		};
		const html = `<html><body>${ldJson(commentObject)}${ldJson(mainObject)}</body></html>`;

		const videoData = (createExtractor(html) as any).getVideoData();

		expect(videoData.description).toBe('The real description that should appear in the content.');
		expect(videoData.name).toBe('Real video title');
	});

	test('falls back to the comment-derived VideoObject when none has a description', () => {
		const commentObject = {
			'@context': 'https://schema.org',
			'@type': 'VideoObject',
			'@id': URL,
			name: 'Comment-derived title',
			thumbnailUrl: `https://i.ytimg.com/vi/${VIDEO_ID}/maxresdefault.jpg`,
			uploadDate: '2024-05-26T08:08:22-07:00',
			comment: [{ '@type': 'https://schema.org/Comment', text: 'Nice video' }],
		};
		const html = `<html><body>${ldJson(commentObject)}</body></html>`;

		const videoData = (createExtractor(html) as any).getVideoData();

		// Still returns title/thumbnail so the result is not empty.
		expect(videoData.name).toBe('Comment-derived title');
		expect(videoData.description).toBeUndefined();
	});
});

describe('YouTube metadata after SPA navigation', () => {
	function createDocument() {
		return parseDocument(readFileSync(join(__dirname, 'fixtures/youtube--spa-metadata.html'), 'utf8'), URL);
	}

	test.each(['sync', 'async'])('uses the current video metadata through %s parsing', async mode => {
		const doc = createDocument();
		const parser = new Defuddle(doc, { url: URL, fetch: async () => { throw new Error('offline'); } });
		const result = mode === 'async' ? await parser.parseAsync() : parser.parse();

		expect(result.title).toBe('Current video');
		expect(result.description).toBe('Current description & details.');
		expect(result.content).toContain('Current description &amp; details.');
		expect(result.content).not.toContain('Previous description');
	});

	test('uses the collapsed description snippet without including UI text', () => {
		const doc = createDocument();
		doc.querySelector('#expanded yt-attributed-string')!.textContent = '';
		const result = new Defuddle(doc, { url: URL }).parse();

		expect(result.description).toBe('Current description...');
		expect(result.content).not.toContain('Show more');
	});

	test('does not restore a stale description when the current video has none', () => {
		const doc = createDocument();
		doc.querySelector('#description-inline-expander')!.remove();
		const result = new Defuddle(doc, { url: URL }).parse();

		expect(result.title).toBe('Current video');
		expect(result.description).toBe('');
	});

	test('rejects rendered metadata belonging to a different video', () => {
		const doc = createDocument();
		doc.querySelector('ytd-watch-flexy')!.setAttribute('video-id', 'oldVIDEO123');
		const result = new Defuddle(doc, { url: URL }).parse();

		expect(result.title).toBe('');
		expect(result.description).toBe('');
		expect(result.content).not.toContain('Current description');
	});

	test('fills a description-less matching VideoObject from the current DOM', () => {
		const doc = createDocument();
		doc.querySelector('script[type="application/ld+json"]')!.textContent = JSON.stringify({
			'@type': 'VideoObject', '@id': URL, name: 'Current schema title', comment: [],
		});
		const result = new Defuddle(doc, { url: URL }).parse();

		expect(result.title).toBe('Current schema title');
		expect(result.description).toBe('Current description & details.');
	});

	test('preserves a matching VideoObject with a full description', () => {
		const doc = createDocument();
		doc.querySelector('script[type="application/ld+json"]')!.textContent = JSON.stringify({
			'@type': 'VideoObject', '@id': URL, name: 'Current schema title', description: 'Full schema description',
		});
		const result = new Defuddle(doc, { url: URL }).parse();

		expect(result.title).toBe('Current schema title');
		expect(result.description).toBe('Full schema description');
	});

	test('uses rendered metadata when matching Open Graph fields are missing', () => {
		const doc = createDocument();
		doc.querySelector('meta[property="og:url"]')!.setAttribute('content', URL);
		doc.querySelector('meta[property="og:title"]')!.remove();
		doc.querySelector('meta[property="og:description"]')!.remove();
		const result = new Defuddle(doc, { url: URL }).parse();

		expect(result.title).toBe('Current video');
		expect(result.description).toBe('Current description & details.');
	});
});

test('keeps generic metadata fallbacks for other extractors', () => {
	const url = 'https://lwn.net/Articles/123456/';
	const doc = parseDocument(`<html><head>
		<title>Article title</title><meta name="description" content="Article description">
		</head><body><div class="PageHeadline"></div>
		<div class="ArticleText"><main><p>Article body.</p></main></div></body></html>`, url);
	const result = new Defuddle(doc, { url }).parse();

	expect(result.extractorType).toBe('lwn');
	expect(result.title).toBe('Article title');
	expect(result.description).toBe('Article description');
});
