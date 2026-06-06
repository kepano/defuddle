import { describe, test, expect } from 'vitest';
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
