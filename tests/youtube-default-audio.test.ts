import { readFileSync } from 'fs';
import { join } from 'path';
import { describe, expect, test, vi } from 'vitest';
import { YoutubeExtractor } from '../src/extractors/youtube';
import { parseDocument } from './helpers';

// Kept in a subdirectory because this fixture needs mocked caption responses,
// unlike the generic offline DOM fixture runner.
const html = readFileSync(join(__dirname, 'fixtures/youtube/issues--410-default-audio.html'), 'utf8');
const expected = JSON.parse(readFileSync(join(__dirname, 'expected/youtube/issues--410-default-audio.json'), 'utf8'));
const url = 'https://www.youtube.com/watch?v=example123';

function setup(language?: string) {
	const extractor = new YoutubeExtractor(parseDocument(html, url), url, undefined, { language });
	const playerData = (extractor as any).getValidatedPlayerResponse();
	const renderer = playerData.captions.playerCaptionsTracklistRenderer;
	const pick = () => (extractor as any).pickCaptionTrack(renderer.captionTracks, playerData);
	return { extractor, playerData, renderer, pick };
}

describe('YouTube default audio language (#410)', () => {
	test.each([false, true])('uses default Japanese audio with reversed order: %s', reverse => {
		const { renderer, pick } = setup();
		if (reverse) {
			renderer.audioTracks.reverse();
			renderer.defaultAudioTrackIndex = 1;
		}
		expect(pick().languageCode).toBe('ja');
	});

	test('uses English audio even when its caption indices list Japanese first', () => {
		const { renderer, pick } = setup();
		renderer.defaultAudioTrackIndex = 1;
		expect(pick().languageCode).toBe('en-US');
	});

	test('prefers manual captions in the default audio language', () => {
		const { renderer, pick } = setup();
		renderer.captionTracks.push({ languageCode: 'ja' });
		expect(pick()).toBe(renderer.captionTracks[2]);
	});

	test('matches regional audio languages before other variants', () => {
		const { renderer, pick } = setup();
		renderer.audioTracks[0].audioTrackId = 'en-GB.4';
		renderer.captionTracks.push({ languageCode: 'en-GB' });
		expect(pick()).toBe(renderer.captionTracks[2]);
	});

	test.each(['audio', 'renderer'])('preserves explicit %s default caption selection', location => {
		const { renderer, pick } = setup();
		(location === 'audio' ? renderer.audioTracks[0] : renderer).defaultCaptionTrackIndex = 0;
		expect(pick().languageCode).toBe('en-US');
	});

	test('preserves the caller language override', () => {
		expect(setup('en').pick().languageCode).toBe('en-US');
	});

	test.each([undefined, 'unknown.4'])('uses associated caption indices without a matching audio language: %s', audioTrackId => {
		const { renderer, pick } = setup();
		renderer.audioTracks[0].audioTrackId = audioTrackId;
		renderer.audioTracks[0].captionTrackIndices = [-1, 0.5, 99, '0', 1, 0];
		expect(pick().languageCode).toBe('ja');
	});

	test('ignores invalid caption indices and still uses audio language', () => {
		const { renderer, pick } = setup();
		renderer.audioTracks[0].defaultCaptionTrackIndex = 0.5;
		expect(pick().languageCode).toBe('ja');
	});

	test('retains ASR fallback when audio metadata is absent', () => {
		const { renderer, pick } = setup();
		delete renderer.audioTracks;
		expect(pick().languageCode).toBe('en-US');
	});

	test.each(['inline', 'API'])('extracts Japanese transcript from the %s player response fixture', async source => {
		const fetch = vi.fn(async (input: string | URL | Request) => {
			const language = new URL(String(input)).searchParams.get('lang');
			const text = language === 'ja' ? 'これは元の音声です。' : 'This is the dubbed audio.';
			return new Response(`<transcript><text start="0" dur="2">${text}</text></transcript>`);
		});
		const extractor = new YoutubeExtractor(parseDocument(html, url), url, undefined, { fetch });
		const playerData = (extractor as any).getValidatedPlayerResponse();
		vi.spyOn(extractor as any, 'fetchChapters').mockResolvedValue([]);
		vi.spyOn(extractor as any, 'fetchPlayerData').mockResolvedValue(source === 'API' ? playerData : undefined);
		if (source === 'API') vi.spyOn(extractor as any, 'getInlineCaptionTrack').mockReturnValue(undefined);
		const result = await extractor.extractAsync();
		expect({ language: result.variables?.language, transcript: result.variables?.transcript }).toEqual(expected);
		expect(fetch).toHaveBeenCalledTimes(1);
	});
});
