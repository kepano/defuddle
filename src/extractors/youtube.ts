import { BaseExtractor } from './_base';
import { ExtractorResult } from '../types/extractors';
import { escapeHtml } from '../utils/dom';
import { countWords } from '../utils';
import { buildTranscript } from '../utils/transcript';

const SENTENCE_END = /[.!?]["'\u2019\u201D)]*\s*$/;
const TRANSCRIPT_GROUP_GAP_SECONDS = 20;

// Unofficial InnerTube API. Uses Android client context to get caption track URLs.
// Version may need updating if Google changes the API.
const INNERTUBE_API_URL = 'https://www.youtube.com/youtubei/v1/player?prettyPrint=false';
const INNERTUBE_CLIENT_VERSION = '20.10.38';
const INNERTUBE_CONTEXT = {
	client: {
		clientName: 'ANDROID',
		clientVersion: INNERTUBE_CLIENT_VERSION,
	}
};
const INNERTUBE_USER_AGENT = `com.google.android.youtube/${INNERTUBE_CLIENT_VERSION} (Linux; U; Android 14)`;
const INNERTUBE_NEXT_URL = 'https://www.youtube.com/youtubei/v1/next?prettyPrint=false';
const INNERTUBE_WEB_CONTEXT = {
	client: {
		clientName: 'WEB',
		clientVersion: '2.20240101.00.00',
	}
};

export class YoutubeExtractor extends BaseExtractor {
	private videoElement: HTMLVideoElement | null;
	protected override schemaOrgData: any;

	constructor(document: Document, url: string, schemaOrgData?: any) {
		super(document, url, schemaOrgData);
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

	extract(): ExtractorResult {
		return this.buildResult();
	}

	async extractAsync(): Promise<ExtractorResult> {
		const transcript = await this.fetchTranscript();
		return this.buildResult(transcript);
	}

	private buildResult(transcript?: { html: string; text: string; languageCode: string }): ExtractorResult {
		const videoData = this.getVideoData();
		const channelName = this.getChannelName(videoData);
		const description = videoData.description || '';
		const formattedDescription = this.formatDescription(description);
		let contentHtml = `<iframe width="560" height="315" src="https://www.youtube.com/embed/${this.getVideoId()}" title="YouTube video player" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" referrerpolicy="strict-origin-when-cross-origin" allowfullscreen></iframe>${formattedDescription}`;

		if (transcript?.html) {
			contentHtml += transcript.html;
		}

		const variables: { [key: string]: string } = {
			title: videoData.name || '',
			author: channelName,
			site: 'YouTube',
			image: Array.isArray(videoData.thumbnailUrl) ? videoData.thumbnailUrl[0] || '' : '',
			published: videoData.uploadDate,
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
				videoId: this.getVideoId(),
				author: channelName,
			},
			variables,
		};
	}

	private formatDescription(description: string): string {
		return `<p>${description.replace(/\n/g, '<br>')}</p>`;
	}

	private getVideoData(): any {
		if (!this.schemaOrgData) return {};

		const videoData = Array.isArray(this.schemaOrgData)
			? this.schemaOrgData.find(item => item['@type'] === 'VideoObject')
			: this.schemaOrgData['@type'] === 'VideoObject' ? this.schemaOrgData : null;

		return videoData || {};
	}

	private getChannelName(videoData: any): string {
		const fromDom = this.getChannelNameFromDom();
		if (fromDom) {
			return fromDom;
		}

		const fromPlayer = this.getChannelNameFromPlayerResponse();
		if (fromPlayer) {
			return fromPlayer;
		}

		return videoData?.author || '';
	}

	private getChannelNameFromDom(): string {
		const ownerSelectors = [
			'ytd-video-owner-renderer #channel-name a[href^="/@"]',
			'#owner-name a[href^="/@"]'
		];

		for (const selector of ownerSelectors) {
			const element = this.document.querySelector(selector);
			const value = element?.textContent?.trim();
			if (value) {
				return value;
			}
		}

		return this.getChannelNameFromMicrodata();
	}

	private getChannelNameFromMicrodata(): string {
		const authorRoot = this.document.querySelector('[itemprop="author"]');
		if (!authorRoot) return '';

		const metaName = authorRoot.querySelector('meta[itemprop="name"]');
		if (metaName?.getAttribute('content')) {
			return metaName.getAttribute('content')!.trim();
		}

		const linkName = authorRoot.querySelector('link[itemprop="name"]');
		if (linkName?.getAttribute('content')) {
			return linkName.getAttribute('content')!.trim();
		}

		const text = authorRoot.querySelector('[itemprop="name"], a, span');
		return text?.textContent?.trim() || '';
	}

	private getChannelNameFromPlayerResponse(): string {
		const data = this.parseInlineJson('ytInitialPlayerResponse');
		if (!data) return '';

		const fromVideoDetails = data?.videoDetails?.author || data?.videoDetails?.ownerChannelName;
		if (fromVideoDetails) {
			return fromVideoDetails;
		}

		const fromMicroformat = data?.microformat?.playerMicroformatRenderer?.ownerChannelName;
		return fromMicroformat || '';
	}

	private parseInlineJson(globalName: string): any | null {
		const scripts = Array.from(this.document.querySelectorAll('script'));
		for (const script of scripts) {
			const text = script.textContent || '';
			if (!text.includes(globalName)) continue;

			const startIndex = text.indexOf('{', text.indexOf(globalName));
			if (startIndex === -1) continue;

			let depth = 0;
			for (let i = startIndex; i < text.length; i++) {
				const char = text[i];
				if (char === '{') {
					depth += 1;
				} else if (char === '}') {
					depth -= 1;
					if (depth === 0) {
						const jsonText = text.slice(startIndex, i + 1);
						try {
							return JSON.parse(jsonText);
						} catch (error) {
							console.error('YoutubeExtractor: failed to parse inline JSON', error);
							break;
						}
					}
				}
			}
		}

		return null;
	}

	private async fetchTranscript(): Promise<{ html: string; text: string; languageCode: string } | undefined> {
		try {
			const videoId = this.getVideoId();
			if (!videoId) return undefined;

			// Fetch captions and chapters in parallel
			const [playerData, chapters] = await Promise.all([
				this.fetchPlayerData(videoId),
				this.fetchChapters(videoId),
			]);

			if (!playerData) return undefined;

			const captionTracks = playerData?.captions
				?.playerCaptionsTracklistRenderer?.captionTracks;
			if (!Array.isArray(captionTracks) || captionTracks.length === 0) return undefined;

			// Prefer English, fall back to first available track
			const track = captionTracks.find((t: any) => t.languageCode === 'en')
				|| captionTracks[0];
			if (!track?.baseUrl) return undefined;

			// Validate URL to prevent SSRF in server-side contexts
			try {
				const captionUrl = new URL(track.baseUrl);
				if (!captionUrl.hostname.endsWith('.youtube.com')) return undefined;
			} catch {
				return undefined;
			}

			const response = await fetch(track.baseUrl, {
				headers: { 'User-Agent': 'Mozilla/5.0' },
			});
			if (!response.ok) return undefined;

			const xml = await response.text();
			if (!xml) return undefined;

			return this.parseTranscriptXml(xml, track.languageCode || 'en', chapters);
		} catch (error) {
			console.error('YoutubeExtractor: failed to fetch transcript', error);
			return undefined;
		}
	}

	private async fetchPlayerData(videoId: string): Promise<any> {
		try {
			const resp = await fetch(INNERTUBE_API_URL, {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
					'User-Agent': INNERTUBE_USER_AGENT,
				},
				body: JSON.stringify({
					context: INNERTUBE_CONTEXT,
					videoId,
				})
			});
			if (!resp.ok) return undefined;
			return resp.json();
		} catch {
			return undefined;
		}
	}

	private async fetchChapters(videoId: string): Promise<{ title: string; start: number }[]> {
		try {
			const resp = await fetch(INNERTUBE_NEXT_URL, {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					context: INNERTUBE_WEB_CONTEXT,
					videoId,
				})
			});
			if (!resp.ok) return [];
			const data = await resp.json() as any;

			// Try chapterRenderer from the player bar (explicit chapters)
			const chapters = this.extractChaptersFromPlayerBar(data);
			if (chapters.length > 0) return chapters;

			// Fall back to macroMarkersListItemRenderer from engagement panels
			// (auto-generated "Key moments" from description timestamps)
			return this.extractChaptersFromEngagementPanels(data);
		} catch {
			return [];
		}
	}

	private extractChaptersFromPlayerBar(data: any): { title: string; start: number }[] {
		const chapters: { title: string; start: number }[] = [];
		const panels = data?.playerOverlays?.playerOverlayRenderer
			?.decoratedPlayerBarRenderer?.decoratedPlayerBarRenderer?.playerBar
			?.multiMarkersPlayerBarRenderer?.markersMap;

		if (!Array.isArray(panels)) return chapters;

		for (const panel of panels) {
			const markers = panel?.value?.chapters;
			if (!Array.isArray(markers)) continue;
			for (const marker of markers) {
				const ch = marker?.chapterRenderer;
				if (!ch) continue;
				const title = ch.title?.simpleText || '';
				const startMs = ch.timeRangeStartMillis;
				if (title && typeof startMs === 'number') {
					chapters.push({ title, start: startMs / 1000 });
				}
			}
		}

		return chapters;
	}

	private extractChaptersFromEngagementPanels(data: any): { title: string; start: number }[] {
		const chapters: { title: string; start: number }[] = [];
		const panels = data?.engagementPanels;
		if (!Array.isArray(panels)) return chapters;

		for (const panel of panels) {
			const content = panel?.engagementPanelSectionListRenderer?.content;
			const items = content?.macroMarkersListRenderer?.contents;
			if (!Array.isArray(items)) continue;

			for (const item of items) {
				const renderer = item?.macroMarkersListItemRenderer;
				if (!renderer) continue;
				const title = renderer.title?.simpleText || '';
				const timeStr = renderer.timeDescription?.simpleText || '';
				if (!title || !timeStr) continue;

				const seconds = this.parseTimestamp(timeStr);
				if (seconds !== null) {
					chapters.push({ title, start: seconds });
				}
			}
		}

		return chapters;
	}

	private parseTimestamp(ts: string): number | null {
		const parts = ts.split(':').map(Number);
		if (parts.some(isNaN)) return null;
		if (parts.length === 3) return parts[0] * 3600 + parts[1] * 60 + parts[2];
		if (parts.length === 2) return parts[0] * 60 + parts[1];
		return null;
	}

	private parseTranscriptXml(xml: string, languageCode: string, chapters: { title: string; start: number }[] = []): { html: string; text: string; languageCode: string } | undefined {
		const segments: { start: number; text: string }[] = [];

		// Handle srv3 format: <p t="ms" d="ms"><s>word</s>...</p>
		const pRegex = /<p\s+t="(\d+)"[^>]*>([\s\S]*?)<\/p>/g;
		let match;
		while ((match = pRegex.exec(xml)) !== null) {
			const startMs = parseInt(match[1], 10);
			const inner = match[2];

			// Extract text from <s> children, or use raw text
			let text = '';
			const sRegex = /<s[^>]*>([^<]*)<\/s>/g;
			let sMatch;
			while ((sMatch = sRegex.exec(inner)) !== null) {
				text += sMatch[1];
			}

			// Fall back to stripping all tags if no <s> elements
			if (!text) {
				text = inner.replace(/<[^>]+>/g, '');
			}

			// Decode HTML entities
			text = this.decodeEntities(text);

			if (text.trim()) {
				segments.push({ start: startMs / 1000, text: text.trim() });
			}
		}

		// Fall back to simple format: <text start="s" dur="s">content</text>
		if (segments.length === 0) {
			const textRegex = /<text\s+start="([^"]*)"[^>]*>([\s\S]*?)<\/text>/g;
			while ((match = textRegex.exec(xml)) !== null) {
				const start = parseFloat(match[1]);
				let text = this.decodeEntities(match[2].replace(/<[^>]+>/g, ''));
				if (text.trim()) {
					segments.push({ start, text: text.trim() });
				}
			}
		}

		if (segments.length === 0) return undefined;

		const groups = this.groupTranscriptSegments(segments);
		const { html, text } = buildTranscript('youtube', groups, chapters);

		return { html, text, languageCode };
	}

	private decodeEntities(text: string): string {
		return text
			.replace(/&amp;/g, '&')
			.replace(/&lt;/g, '<')
			.replace(/&gt;/g, '>')
			.replace(/&quot;/g, '"')
			.replace(/&#39;/g, "'")
			.replace(/&apos;/g, "'")
			.replace(/&#x([0-9a-fA-F]+);/g, (_, hex) => String.fromCodePoint(parseInt(hex, 16)))
			.replace(/&#(\d+);/g, (_, dec) => String.fromCodePoint(parseInt(dec, 10)));
	}

	private getVideoId(): string {
		const url = new URL(this.url);
		if (url.hostname === 'youtu.be') {
			return url.pathname.slice(1);
		}
		return new URLSearchParams(url.search).get('v') || '';
	}

	/**
	 * Group raw transcript segments into readable blocks.
	 * If speaker markers (>>) are present, groups by speaker turn.
	 * Otherwise, groups by sentence boundaries.
	 */
	private groupTranscriptSegments(segments: { start: number; text: string }[]): { start: number; text: string; speakerChange: boolean; speaker?: number }[] {
		if (segments.length === 0) return [];

		const hasSpeakerMarkers = segments.some(s => /^>>/.test(s.text));
		return hasSpeakerMarkers
			? this.groupBySpeaker(segments)
			: this.groupBySentence(segments);
	}

	/**
	 * Group segments by speaker turns, then by sentences within each turn.
	 * Each ">>" marker starts a new speaker turn (with blank line separation).
	 * Within a turn, text is split at sentence boundaries for readability.
	 * Tracks alternating speaker identity (0/1).
	 */
	private groupBySpeaker(segments: { start: number; text: string }[]): { start: number; text: string; speakerChange: boolean; speaker?: number }[] {
		// First pass: collect segments into speaker turns
		const turns: { start: number; segments: { start: number; text: string }[]; speakerChange: boolean; speaker?: number }[] = [];
		let currentTurn: typeof turns[0] | null = null;
		let speakerIndex = -1;

		let prevSegText = '';
		for (const seg of segments) {
			const isSpeakerChange = /^>>/.test(seg.text);
			const cleanText = seg.text.replace(/^>>\s*/, '');

			// Only treat >> as a real speaker change if the previous segment
			// ended at a sentence boundary — otherwise it's a mid-sentence
			// false positive from auto-captions
			const prevEndsWithComma = /,\s*$/.test(prevSegText);
			const prevEndedSentence = (SENTENCE_END.test(prevSegText) || !prevSegText) && !prevEndsWithComma;
			const isRealSpeakerChange = isSpeakerChange && prevEndedSentence;

			if (isRealSpeakerChange) {
				if (currentTurn) turns.push(currentTurn);
				speakerIndex = (speakerIndex + 1) % 2;
				currentTurn = { start: seg.start, segments: [{ start: seg.start, text: cleanText }], speakerChange: true, speaker: speakerIndex };
			} else {
				if (!currentTurn) {
					currentTurn = { start: seg.start, segments: [], speakerChange: false };
				}
				currentTurn.segments.push({ start: seg.start, text: cleanText });
			}
			prevSegText = cleanText;
		}
		if (currentTurn) turns.push(currentTurn);

		// Split turns that start with a short affirmative (e.g. "Mhm.", "Yeah.")
		// followed by longer text — the affirmative is likely the other speaker
		this.splitAffirmativeTurns(turns);

		// Second pass: split each turn into sentence groups
		const groups: { start: number; text: string; speakerChange: boolean; speaker?: number }[] = [];
		for (const turn of turns) {
			const sentenceGroups = this.groupBySentence(turn.segments);
			for (let i = 0; i < sentenceGroups.length; i++) {
				groups.push({
					...sentenceGroups[i],
					speakerChange: i === 0 && turn.speakerChange,
					speaker: turn.speaker,
				});
			}
		}

		return groups;
	}

	/**
	 * Split turns that start with a short affirmative response (e.g. "Mhm.", "Yeah.")
	 * followed by longer content. The affirmative belongs to the current speaker,
	 * but the rest is likely the other speaker (missed diarization in auto-captions).
	 */
	private splitAffirmativeTurns(turns: { start: number; segments: { start: number; text: string }[]; speakerChange: boolean; speaker?: number }[]): void {
		const affirmativePattern = /^(mhm|yeah|yes|yep|right|okay|ok|absolutely|sure|exactly|uh-huh|mm-hmm)[.!,]?\s+/i;

		for (let i = 0; i < turns.length; i++) {
			const turn = turns[i];
			if (turn.speaker === undefined || turn.segments.length === 0) continue;

			const firstSeg = turn.segments[0];
			const match = affirmativePattern.exec(firstSeg.text);
			if (!match) continue;

			// Don't split if the affirmative ends with a comma — the speaker is continuing
			if (/,\s*$/.test(match[0])) continue;

			// Check that there's substantial content after the affirmative
			// Only split when the remainder is long enough to be a different speaker's
			// response, not just the same speaker continuing after an affirmative
			const remainder = firstSeg.text.slice(match[0].length).trim();
			const restSegments = turn.segments.slice(1);
			const restWords = countWords(remainder)
				+ restSegments.reduce((sum, s) => sum + countWords(s.text), 0);
			if (restWords < 30) continue;

			// Split: keep affirmative in current turn, move rest to new turn with flipped speaker
			const affirmativeText = match[0].trimEnd();
			const newRestSegments = remainder
				? [{ start: firstSeg.start, text: remainder }, ...restSegments]
				: restSegments;

			const affirmativeTurn = {
				start: turn.start,
				segments: [{ start: firstSeg.start, text: affirmativeText }],
				speakerChange: turn.speakerChange,
				speaker: turn.speaker,
			};
			const restTurn = {
				start: newRestSegments[0].start,
				segments: newRestSegments,
				speakerChange: true,
				speaker: turn.speaker === 0 ? 1 : 0,
			};

			turns.splice(i, 1, affirmativeTurn, restTurn);
			i++; // skip the newly inserted rest turn
		}
	}

	/**
	 * Group segments by sentence boundaries for transcripts without speaker markers.
	 * Accumulates text until a segment ends with sentence-ending punctuation (.!?),
	 * or until a very large time gap between segments.
	 */
	private groupBySentence(segments: { start: number; text: string }[]): { start: number; text: string; speakerChange: boolean; speaker?: number }[] {
		const groups: { start: number; text: string; speakerChange: boolean }[] = [];
		let buffer = '';
		let bufferStart = 0;
		let lastStart = 0;

		const flush = () => {
			if (buffer.trim()) {
				groups.push({
					start: bufferStart,
					text: buffer.trim(),
					speakerChange: false,
				});
				buffer = '';
			}
		};

		for (const seg of segments) {
			// YouTube often emits sparse caption windows 10-15s apart even when the
			// sentence is still continuing, so only treat very large gaps as breaks.
			if (buffer && seg.start - lastStart > TRANSCRIPT_GROUP_GAP_SECONDS) {
				flush();
			}

			if (!buffer) {
				bufferStart = seg.start;
			}
			buffer += (buffer ? ' ' : '') + seg.text;
			lastStart = seg.start;

			// Only flush when the segment itself ends with sentence punctuation
			if (SENTENCE_END.test(seg.text)) {
				flush();
			}
		}

		flush();
		return groups;
	}
} 
