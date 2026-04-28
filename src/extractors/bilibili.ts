import type {
	ExtractorResult,
	TranscriptResult
} from '../types/extractors';
import type { TranscriptChapter } from '../utils/transcript';
import { buildTranscript } from '../utils/transcript';
import { BaseExtractor, ExtractorOptions } from './_base';

import {
	MID_TEXT_SENTENCE_BOUNDARY,
	SENTENCE_END,
	TRANSCRIPT_GROUP_GAP_SECONDS,
	TRANSCRIPT_MAX_GROUP_SECONDS,
} from './youtube'

const BILIBILI_PLAYER_URL = "https://player.bilibili.com/player.html";
const BILIBILI_TRANSCRIPT_API = "https://api.bilibili.com/x/player/wbi/v2?";

export class BilibiliExtractor extends BaseExtractor {
	private videoElement: HTMLVideoElement | null;
	private inlineJsonCache = new Map<string, any>();
	protected override schemaOrgData: any;

	constructor(document: Document, url: string, schemaOrgData?: any, options?: ExtractorOptions) {
		super(document, url, schemaOrgData, options);
		this.videoElement = document.querySelector('video');
		this.schemaOrgData = schemaOrgData;
	}

	canExtract(): boolean {
		return true;
	}

	canExtractAsync(): boolean {
		return true;
	}

	prefersAsync(): boolean {
		return true;
	}

	// BilibiliExtractor does not support synchronous extraction with transcript because the transcript needs to be fetched from the API, which is an asynchronous operation.
	// The extract method will return the basic video information without the transcript, while extractAsync will include the transcript if available.
	extract(): ExtractorResult {
		return this.buildResult();
	}

	async extractAsync(): Promise<ExtractorResult> {
		const transcript = await this.fetchTranscript();
		return this.buildResult(transcript);
	}

	private async fetchTranscript(): Promise<TranscriptResult | undefined> {
		try {
			const videoData = this.getVideoData();
			const bvid = videoData.bvid;
			const cid = videoData.cid;

			if (!bvid || !cid) {
				return undefined;
			}

			const url = `${BILIBILI_TRANSCRIPT_API}bvid=${bvid}&cid=${cid}`;
			// Bilibili's transcript API requires cookies for authentication, so we need to include credentials in the request. Or the transcript url will be empty.
			const response = await this.fetch(url, { credentials: 'include' });
			const data = await response.json();
			const transcriptsURL = data?.data?.subtitle?.subtitles;
			const chapters = this.formatChapters(data?.data?.view_points);

			if (!transcriptsURL || transcriptsURL.length === 0) {
				return undefined;
			}

			// Bilibili's API may return subtitles with mutliple languages.
			// If user has selected a transcript language in the video player, the selected language will extracted.
			// Otherwise, the first subtitle in the list will be extracted.
			const selectedLanguage = this.document.querySelector(".bpx-player-ctrl-subtitle-language-item.bpx-state-active")?.getAttribute("data-lan") || this.normalizeLanguageCode(this.options.language);
			const targetTranscriptURL = transcriptsURL.filter((t: any) => this.normalizeLanguageCode(t.lan) === this.normalizeLanguageCode(selectedLanguage));
			const transcriptURL = targetTranscriptURL.length > 0 ? targetTranscriptURL[0] : transcriptsURL[0];

			const languageCode = this.normalizeLanguageCode(transcriptURL.lan);

			const transcriptResponse = await this.fetch(transcriptURL.subtitle_url);
			const transcriptData = await transcriptResponse.json();
			const transcript = transcriptData?.body || [];

			const { html, text } = this.parseTranscripts(transcript, chapters);

			return { html, text, languageCode };

		} catch (error) {
			console.error('BilibiliExtractor: failed to fetch transcript', error);
			return undefined;
		}
	}

	private buildResult(transcript?: TranscriptResult): ExtractorResult {
		const videoData = this.getVideoData();
		const channelName = videoData.owner?.name || '';
		const description = videoData.desc || '';
		const formattedDescription = this.formatDescription(description);

		const queryParam = new URLSearchParams({
			aid: videoData.aid,
			bvid: videoData.bvid,
			cid: videoData.cid,
			p: videoData.p,
			autoplay: '0',
		});
		const style="position: relative; max-width: 720px; width: 100%; height: auto; aspect-ratio: 16/9 "
		let contentHtml = `<iframe `
			+` style="${style}" `
			+` src="${BILIBILI_PLAYER_URL}?${queryParam.toString()}" `
			+` frameborder="0" `
			+` allowfullscreen `
			+` ></iframe>\n${formattedDescription}`;

		if (transcript?.html) {
			contentHtml += transcript.html;
		}

		const variables: { [key: string]: string } = {
			title: videoData.title || '',
			author: channelName,
			site: 'Bilibili',
			image: videoData.pic || '',
			published: videoData.pubdate,
			description: description.slice(0, 200).trim(),
		};

		if (transcript?.text) {
			variables.transcript = transcript.text;
		}

		if (transcript?.languageCode) {
			variables.language = transcript.languageCode;
		}

		return {
			content: contentHtml,
			contentHtml: contentHtml,
			extractedContent: {
				videoId: videoData.aid || '',
				author: channelName,
			},
			variables,
		};
	}


	// Bilibili Web Page will inject the video data into the global variable `__INITIAL_STATE__` when the page loads. We can extract the video information from there.
	private getVideoData(): { [key: string]: any } {
		const videoData = (window as any).__INITIAL_STATE__?.videoData || {};
		if ((window as any).__INITIAL_STATE__?.p) {
			videoData.cid = (window as any).__INITIAL_STATE__.cid;
			videoData.p = (window as any).__INITIAL_STATE__.p;
		}
		return videoData;
	}

	private formatDescription(description: string): string {
		return `<p>${description.replace(/\n/g, '<br>')}</p>`;
	}

	private normalizeLanguageCode(code?: string): string {
		return (code || '').trim().replace(/_/g, '-').toLocaleLowerCase();
	}

	private formatChapters(chapters?: any[]): TranscriptChapter[] {
		if (!chapters || !Array.isArray(chapters)) {
			return [];
		}

		return chapters.map((c) => {
			return { start: c.from, title: c.content };
		})
	}

	private parseTranscripts(transcripts: any[], chapters: TranscriptChapter[]): TranscriptResult {
		const segments: { start: number; text: string }[] = [];

		for (const item of transcripts) {
			const text = item.content.replace(/\s+/g, ' ').trim();
			if (text) {
				segments.push({ start: item.from, text });
			}
		}

		if (segments.length === 0) return { html: '', text: '' };
		console.log('Raw segments:', segments);
		const groups = this.groupBySentence(segments);
		return buildTranscript('bilibili', groups, chapters);
	}

	// For bilibili transcripts, there are no speaker markers, so we will group the segments into sentences based on punctuation and timing gaps.
	private groupBySentence(segments: { start: number; text: string }[]): { start: number; text: string; speakerChange: boolean; speaker?: number }[] {
		const groups: { start: number; text: string; speakerChange: boolean }[] = [];
		const pending: { start: number; text: string }[] = [];

		const pushGroup = (segs: { start: number; text: string }[]) => {
			const text = segs.map(s => s.text).join(' ').trim();
			if (text) {
				groups.push({ start: segs[0].start, text, speakerChange: false });
			}
		};

		const flushAll = () => {
			if (pending.length === 0) return;
			pushGroup(pending);
			pending.length = 0;
		};

		const flushUpTo = (idx: number) => {
			if (idx <= 0) return;
			pushGroup(pending.splice(0, idx));
		};

		for (const seg of segments) {
			// Treat bilibili as Youtube
			// YouTube often emits sparse caption windows 10-15s apart even when the
			// sentence is still continuing, so only treat very large gaps as breaks.
			if (pending.length > 0 && seg.start - pending[pending.length - 1].start > TRANSCRIPT_GROUP_GAP_SECONDS) {
				flushAll();
			}

			pending.push(seg);

			if (SENTENCE_END.test(seg.text)) {
				flushAll();
				continue;
			}

			// For unpunctuated ASR transcripts, break at the best natural
			// point once the group exceeds TRANSCRIPT_MAX_GROUP_SECONDS.
			if (seg.start - pending[0].start >= TRANSCRIPT_MAX_GROUP_SECONDS) {
				const breakIdx = this.findNaturalBreak(pending);
				if (breakIdx > 0 && breakIdx < pending.length) {
					flushUpTo(breakIdx);
				} else {
					flushAll();
				}
			}
		}

		flushAll();
		return groups;
	}

	/**
	 * Find the best natural break point in a list of segments.
	 * Prefers mid-text sentence boundaries (". A") over gap-based breaks.
	 * May splice a segment in two when a sentence boundary is found mid-text.
	 * Returns the index to break BEFORE (i.e., flush segments 0..idx-1).
	 */
	private findNaturalBreak(segments: { start: number; text: string }[]): number {
		if (segments.length <= 1) return -1;

		const minStart = segments[0].start + TRANSCRIPT_MAX_GROUP_SECONDS / 2;

		// Priority 1: last segment containing a mid-text sentence boundary.
		// Split that segment so the boundary falls at a clean edge.
		for (let i = segments.length - 1; i >= 0; i--) {
			if (segments[i].start < minStart) break;
			const match = segments[i].text.match(MID_TEXT_SENTENCE_BOUNDARY);
			if (match) {
				const before = match[1] ?? match[3];
				const after = match[2] ?? match[4];
				const start = segments[i].start;
				segments.splice(i, 1,
					{ start, text: before },
					{ start, text: after },
				);
				return i + 1;
			}
		}

		// Priority 2: largest gap (natural pause) in the eligible range.
		let bestIdx = -1;
		let bestGap = 0;

		for (let i = 1; i < segments.length; i++) {
			if (segments[i].start < minStart) continue;
			const gap = segments[i].start - segments[i - 1].start;
			if (gap >= bestGap) {
				bestGap = gap;
				bestIdx = i;
			}
		}

		return bestIdx;
	}
}