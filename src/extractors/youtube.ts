import { BaseExtractor } from './_base';
import { ExtractorResult } from '../types/extractors';
import { DefuddleOptions } from '../types';
import { escapeHtml } from '../utils/dom';
import { countWords } from '../utils';
import { buildTranscript, TranscriptSegment } from '../utils/transcript';

const SENTENCE_END = /[.!?]["'\u2019\u201D)]*\s*$/;
const QUESTION_END = /\?["'\u2019\u201D)]*\s*$/;
const TRANSCRIPT_GROUP_GAP_SECONDS = 20;
const TURN_MERGE_MAX_WORDS = 80;
const TURN_MERGE_MAX_SPAN_SECONDS = 45;
const SHORT_UTTERANCE_MAX_WORDS = 3;
const FIRST_GROUP_MERGE_MIN_WORDS = 8;

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

type TranscriptResult = { html: string; text: string; languageCode: string };

export class YoutubeExtractor extends BaseExtractor {
	private videoElement: HTMLVideoElement | null;
	private inlineJsonCache = new Map<string, any>();
	protected override schemaOrgData: any;

	constructor(document: Document, url: string, schemaOrgData?: any, options?: DefuddleOptions) {
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

	extract(): ExtractorResult {
		return this.buildResult(this.extractTranscriptFromExistingDom());
	}

	async extractAsync(): Promise<ExtractorResult> {
		const transcript = this.extractTranscriptFromExistingDom()
			|| await this.fetchTranscript()
			|| await this.extractTranscriptFromOpenedDom();
		return this.buildResult(transcript);
	}

	private getCaptionTracks(playerData: any): any[] {
		const captionTracks = playerData?.captions?.playerCaptionsTracklistRenderer?.captionTracks;
		return Array.isArray(captionTracks) ? captionTracks : [];
	}

	private pickCaptionTrack(captionTracks: any[]): any | undefined {
		return captionTracks.find((track: any) => track.languageCode === 'en') || captionTracks[0];
	}

	private getTrackDisplayName(track: any): string {
		return track?.name?.simpleText
			|| track?.name?.runs?.map((run: any) => run?.text || '').join('').trim()
			|| '';
	}

	private normalizeLanguageLabel(label: string): string {
		return label
			.replace(/\s*\([^)]*\)\s*/g, ' ')
			.replace(/\s+/g, ' ')
			.trim()
			.toLocaleLowerCase();
	}

	private getTranscriptLanguageCodeFromDom(): string {
		const langButton = this.document.querySelector(
			'ytd-engagement-panel-section-list-renderer[target-id="engagement-panel-searchable-transcript"] #footer yt-sort-filter-sub-menu-renderer yt-dropdown-menu button'
		);
		const selectedLabel = langButton?.textContent?.trim();
		const captionTracks = this.getCaptionTracks(this.parseInlineJson('ytInitialPlayerResponse'));
		const preferredTrack = this.pickCaptionTrack(captionTracks);

		if (!selectedLabel) {
			return preferredTrack?.languageCode || 'en';
		}

		const normalizedSelectedLabel = this.normalizeLanguageLabel(selectedLabel);
		const matchingTrack = captionTracks.find((track: any) =>
			this.normalizeLanguageLabel(this.getTrackDisplayName(track)) === normalizedSelectedLabel
		);

		return matchingTrack?.languageCode || preferredTrack?.languageCode || 'en';
	}

	private getInlineChapters(): { title: string; start: number }[] {
		const inlineData = this.parseInlineJson('ytInitialData');
		if (!inlineData) return [];

		const chapters = this.extractChaptersFromPlayerBar(inlineData);
		if (chapters.length > 0) return chapters;

		return this.extractChaptersFromEngagementPanels(inlineData);
	}

	private getTranscriptContainer(): Element | null {
		return this.document.querySelector(
			'ytd-engagement-panel-section-list-renderer[target-id="engagement-panel-searchable-transcript"] #segments-container'
		);
	}

	private buildTranscriptFromContainer(
		container: Element,
		chapters: { title: string; start: number }[]
	): TranscriptResult | undefined {
		if (container.children.length === 0) return undefined;

		const segmentElements = container.querySelectorAll('ytd-transcript-segment-renderer');
		if (segmentElements.length === 0) return undefined;

		const segments: { start: number; text: string }[] = [];
		for (const seg of Array.from(segmentElements)) {
			const timestampEl = seg.querySelector('.segment-timestamp');
			const textEl = seg.querySelector('.segment-text');
			if (!timestampEl || !textEl) continue;

			const timeStr = (timestampEl.textContent || '').trim();
			const text = (textEl.textContent || '').trim();
			if (!text) continue;

			const seconds = this.parseTimestamp(timeStr);
			if (seconds !== null) {
				segments.push({ start: seconds, text });
			}
		}

		if (segments.length === 0) return undefined;

		const groups = this.getTranscriptSegments(segments);
		const { html, text } = buildTranscript('youtube', groups, chapters);

		return {
			html,
			text,
			languageCode: this.getTranscriptLanguageCodeFromDom(),
		};
	}

	private extractTranscriptFromExistingDom(): TranscriptResult | undefined {
		try {
			const container = this.getTranscriptContainer();
			if (!container) return undefined;

			return this.buildTranscriptFromContainer(container, this.getInlineChapters());
		} catch (error) {
			console.error('YoutubeExtractor: failed to extract transcript from existing DOM', error);
			return undefined;
		}
	}

	private canOpenTranscriptPanel(): boolean {
		return typeof this.document.defaultView?.MutationObserver === 'function';
	}

	private buildResult(transcript?: TranscriptResult): ExtractorResult {
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
		if (this.inlineJsonCache.has(globalName)) {
			return this.inlineJsonCache.get(globalName);
		}

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
							const parsed = JSON.parse(jsonText);
							this.inlineJsonCache.set(globalName, parsed);
							return parsed;
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

	private async fetchTranscript(): Promise<TranscriptResult | undefined> {
		try {
			const videoId = this.getVideoId();
			if (!videoId) return undefined;

			// Fetch captions and chapters in parallel
			const [playerData, chapters] = await Promise.all([
				this.fetchPlayerData(videoId),
				this.fetchChapters(videoId),
			]);

			if (!playerData) return undefined;

			const captionTracks = this.getCaptionTracks(playerData);
			if (captionTracks.length === 0) return undefined;

			// Prefer English, fall back to first available track
			const track = this.pickCaptionTrack(captionTracks);
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

			let xml: string;
			try {
				xml = await response.text();
			} catch (textError) {
				console.error('YoutubeExtractor: response.text() failed:', textError);
				return undefined;
			}
			if (!xml) return undefined;
			return this.parseTranscriptXml(xml, track.languageCode || 'en', chapters);
		} catch (error) {
			console.error('YoutubeExtractor: failed to fetch transcript', error);
			return undefined;
		}
	}

	private async waitForTranscriptContainer(): Promise<Element | null> {
		return new Promise<Element | null>((resolve) => {
			let attempts = 0;
			const check = () => {
				const container = this.getTranscriptContainer();
				if (container && container.children.length > 0) {
					resolve(container);
				} else if (attempts++ < 20) {
					setTimeout(check, 250);
				} else {
					resolve(null);
				}
			};
			check();
		});
	}

	/**
	 * Fallback: open YouTube's transcript panel and read segments from the DOM.
	 * Used when fetch-based extraction fails and the transcript is not already rendered.
	 */
	private async extractTranscriptFromOpenedDom(): Promise<TranscriptResult | undefined> {
		try {
			if (!this.canOpenTranscriptPanel()) return undefined;

			const transcriptButton = this.document.querySelector(
				'ytd-video-description-transcript-section-renderer button'
			) as HTMLElement | null;
			if (!transcriptButton) return undefined;

			transcriptButton.click();

			const container = await this.waitForTranscriptContainer();
			if (!container) return undefined;

			const videoId = this.getVideoId();
			const chapters = videoId ? await this.fetchChapters(videoId) : this.getInlineChapters();

			return this.buildTranscriptFromContainer(container, chapters);
		} catch (error) {
			console.error('YoutubeExtractor: failed to extract transcript from opened DOM', error);
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
			if (resp.ok) {
				const data = await resp.json();
				if (this.getCaptionTracks(data).length > 0) {
					return data;
				}
			}
		} catch {
			// Fall back to inline page data below.
		}

		const inlineData = this.parseInlineJson('ytInitialPlayerResponse');
		if (this.getCaptionTracks(inlineData).length > 0) {
			return inlineData;
		}

		return undefined;
	}

	private async fetchChapters(videoId: string): Promise<{ title: string; start: number }[]> {
		const inlineChapters = this.getInlineChapters();
		if (inlineChapters.length > 0) return inlineChapters;

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

	private parseTranscriptXml(xml: string, languageCode: string, chapters: { title: string; start: number }[] = []): TranscriptResult | undefined {
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

		const groups = this.getTranscriptSegments(segments);
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

	private getTranscriptSegments(segments: { start: number; text: string }[]): TranscriptSegment[] {
		if (this.options?.extractors?.youtube?.preserveTranscriptSegments === true) {
			return segments.map(segment => ({
				start: segment.start,
				text: segment.text,
				speakerChange: false,
			}));
		}

		return this.groupTranscriptSegments(segments);
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
	 * Each ">>" or "- " marker starts a new speaker turn (with blank line separation).
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
			const cleanText = seg.text.replace(/^>>\s*/, '').replace(/^-\s+/, '');

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

		// Second pass: split each turn into sentence groups, then merge longer
		// contiguous runs so interview answers do not get a timestamp per sentence.
		const groups: { start: number; text: string; speakerChange: boolean; speaker?: number }[] = [];
		for (const turn of turns) {
			const sentenceGroups = turn.speaker === undefined
				? this.groupBySentence(turn.segments)
				: this.mergeSentenceGroupsWithinTurn(this.groupBySentence(turn.segments));
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

	private mergeSentenceGroupsWithinTurn(
		groups: { start: number; text: string; speakerChange: boolean; speaker?: number }[],
	): { start: number; text: string; speakerChange: boolean; speaker?: number }[] {
		if (groups.length <= 1) return groups;

		const merged: typeof groups = [];
		let current = { ...groups[0] };
		let currentIsFirstInTurn = true;

		for (let i = 1; i < groups.length; i++) {
			const next = groups[i];
			if (this.shouldMergeSentenceGroups(current, next, currentIsFirstInTurn)) {
				current.text = `${current.text} ${next.text}`;
				continue;
			}

			merged.push(current);
			current = { ...next };
			currentIsFirstInTurn = false;
		}

		merged.push(current);
		return merged;
	}

	private shouldMergeSentenceGroups(
		current: { start: number; text: string },
		next: { start: number; text: string },
		currentIsFirstInTurn: boolean,
	): boolean {
		const currentWords = countWords(current.text);
		const nextWords = countWords(next.text);

		if (this.isShortStandaloneUtterance(current.text, currentWords) || this.isShortStandaloneUtterance(next.text, nextWords)) {
			return false;
		}

		if (currentIsFirstInTurn && currentWords < FIRST_GROUP_MERGE_MIN_WORDS) {
			return false;
		}

		if (QUESTION_END.test(current.text) || QUESTION_END.test(next.text)) {
			return false;
		}

		if (currentWords + nextWords > TURN_MERGE_MAX_WORDS) {
			return false;
		}

		if (next.start - current.start > TURN_MERGE_MAX_SPAN_SECONDS) {
			return false;
		}

		return true;
	}

	private isShortStandaloneUtterance(text: string, words?: number): boolean {
		const w = words ?? countWords(text);
		return w > 0 && w <= SHORT_UTTERANCE_MAX_WORDS && SENTENCE_END.test(text);
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
