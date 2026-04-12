import { BaseExtractor, ExtractorOptions } from './_base';
import { ExtractorResult } from '../types/extractors';
import { escapeHtml } from '../utils/dom';
import { countWords, CJK_CHAR_RANGES } from '../utils';
import { buildTranscript } from '../utils/transcript';

const CJK_SENTENCE_PUNCT = '\u3002\uFF01\uFF1F';  // 。！？
const CJK_CLOSE_QUOTES = '\u300D\u300F\uFF09';    // 」』）
const SENTENCE_END = new RegExp(`[.!?${CJK_SENTENCE_PUNCT}]["'\\u2019\\u201D)${CJK_CLOSE_QUOTES}]*\\s*$`);
const QUESTION_END = new RegExp(`[?\\uFF1F]["'\\u2019\\u201D)${CJK_CLOSE_QUOTES}]*\\s*$`);
const SPEAKER_MARKER = /^(>>|-\s)/;
const SPEAKER_STRIP = /^(>>\s*|-\s+)/;
const TRAILING_COMMA = /,\s*$/;
const TRANSCRIPT_GROUP_GAP_SECONDS = 20;
const TRANSCRIPT_MAX_GROUP_SECONDS = 30;
// Latin: sentence punct + optional quotes + whitespace + uppercase letter
// CJK: fullwidth sentence punct + optional close quotes + any CJK character (no space needed)
const MID_TEXT_SENTENCE_BOUNDARY = new RegExp(
	`^(.*[.!?]["'\\u2019\\u201D)]*)\\s+([A-Z].*)$` +
	`|^(.*[${CJK_SENTENCE_PUNCT}][${CJK_CLOSE_QUOTES}]*)([${CJK_CHAR_RANGES}].*)$`
);
const TURN_MERGE_MAX_WORDS = 80;
const TURN_MERGE_MAX_SPAN_SECONDS = 45;
const SHORT_UTTERANCE_MAX_WORDS = 3;
const FIRST_GROUP_MERGE_MIN_WORDS = 8;

const FETCH_TIMEOUT_MS = 4000;

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
const INNERTUBE_IOS_CONTEXT = {
	client: {
		clientName: 'IOS',
		clientVersion: '20.10.3',
	}
};
const INNERTUBE_WEB_CONTEXT = {
	client: {
		clientName: 'WEB',
		clientVersion: '2.20240101.00.00',
	}
};

type TranscriptResult = { html: string; text: string; languageCode?: string };

interface TranscriptSelectors {
	segments: string;
	timestamp: string;
	text: string;
	chapters?: string;
}

const DESKTOP_TRANSCRIPT_SELECTORS: TranscriptSelectors = {
	segments: 'ytd-transcript-segment-renderer',
	timestamp: '.segment-timestamp',
	text: '.segment-text',
};

const MOBILE_TRANSCRIPT_SELECTORS: TranscriptSelectors = {
	segments: 'transcript-segment-view-model',
	timestamp: '.ytwTranscriptSegmentViewModelTimestamp',
	text: 'span.yt-core-attributed-string',
	chapters: 'timeline-chapter-view-model h3',
};

export class YoutubeExtractor extends BaseExtractor {
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

	extract(): ExtractorResult {
		return this.buildResult(this.extractTranscriptFromExistingDom());
	}

	async extractAsync(): Promise<ExtractorResult> {
		const existingTranscript = this.extractTranscriptFromExistingDom();

		if (this.shouldUseExistingDomTranscript(existingTranscript)) {
			return this.buildResult(existingTranscript);
		}

		const transcript = await this.fetchTranscript()
			|| existingTranscript
			|| await this.extractTranscriptFromOpenedDom();
		return this.buildResult(transcript);
	}

	private normalizeLanguageCode(code?: string): string {
		return (code || '').trim().replace(/_/g, '-').toLocaleLowerCase();
	}

	// True if languageCode satisfies preferredLang:
	// - exact match (zh-CN === zh-CN), or
	// - same base AND at least one side is just the base (zh matches zh-CN, zh-CN matches zh)
	// Does NOT match across regional variants (zh-Hant does not satisfy zh-CN) —
	// use findPreferredCaptionTrack for the more permissive API-path matching.
	private languageCodeMatchesPreference(languageCode?: string, preferredLang?: string): boolean {
		const a = this.normalizeLanguageCode(languageCode);
		const b = this.normalizeLanguageCode(preferredLang);
		if (!a || !b) return false;
		if (a === b) return true;
		const aBase = a.split('-')[0];
		const bBase = b.split('-')[0];
		return aBase === bBase && (a === aBase || b === bBase);
	}

	private shouldUseExistingDomTranscript(transcript?: TranscriptResult): boolean {
		if (!transcript) return false;
		if (!this.options.language) return true;
		return this.languageCodeMatchesPreference(transcript.languageCode, this.options.language);
	}

	private getCaptionTracks(playerData: any): any[] {
		const captionTracks = playerData?.captions?.playerCaptionsTracklistRenderer?.captionTracks;
		return Array.isArray(captionTracks) ? captionTracks : [];
	}

	// More permissive than languageCodeMatchesPreference: also matches across regional variants
	// (zh-Hant satisfies zh-CN) as a last resort, since any Chinese is better than English.
	private findPreferredCaptionTrack(captionTracks: any[], preferredLang?: string): any | undefined {
		const norm = this.normalizeLanguageCode(preferredLang);
		if (!norm) return undefined;
		const base = norm.split('-')[0];
		const normalized = captionTracks.map(t => ({ t, code: this.normalizeLanguageCode(t.languageCode) }));

		// At each specificity level, prefer non-ASR tracks
		const findBest = (predicate: (item: { t: any; code: string }) => boolean) => {
			const matches = normalized.filter(predicate);
			return (matches.find(({ t }) => t.kind !== 'asr') ?? matches[0])?.t;
		};

		return findBest(({ code }) => code === norm)
			?? findBest(({ code }) => code === base)
			?? findBest(({ code }) => code.split('-')[0] === base);
	}

	private pickCaptionTrack(captionTracks: any[]): any | undefined {
		const preferredLang = this.options.language;
		if (preferredLang) {
			const match = this.findPreferredCaptionTrack(captionTracks, preferredLang);
			if (match) return match;
		}

		// Prefer manually uploaded tracks over auto-generated (ASR) ones
		const nonAsr = captionTracks.filter((track: any) => track.kind !== 'asr');
		const pool = nonAsr.length > 0 ? nonAsr : captionTracks;
		return pool.find((track: any) => track.languageCode === 'en') || pool[0];
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

	private getTranscriptLanguageCodeFromDom(): string | undefined {
		const langButton = this.document.querySelector(
			'ytd-engagement-panel-section-list-renderer[target-id="engagement-panel-searchable-transcript"] #footer yt-sort-filter-sub-menu-renderer yt-dropdown-menu button'
		);
		const selectedLabel = langButton?.textContent?.trim();
		const captionTracks = this.getCaptionTracks(this.getValidatedPlayerResponse());
		const onlyTrack = captionTracks.length === 1 ? captionTracks[0] : undefined;

		if (!selectedLabel) {
			return onlyTrack?.languageCode;
		}

		const normalizedSelectedLabel = this.normalizeLanguageLabel(selectedLabel);
		const matchingTrack = captionTracks.find((track: any) =>
			this.normalizeLanguageLabel(this.getTrackDisplayName(track)) === normalizedSelectedLabel
		);

		return matchingTrack?.languageCode || onlyTrack?.languageCode;
	}

	private getInlineChapters(): { title: string; start: number }[] {
		const videoId = this.getVideoId();
		const inlineData = this.parseInlineJson('ytInitialData');
		if (!inlineData) return [];

		// After YouTube SPA navigation, ytInitialData is stale from the previous page load.
		// Validate it belongs to the current video before using it.
		if (videoId) {
			const currentVideoId = inlineData?.currentVideoEndpoint?.watchEndpoint?.videoId;
			const endpointVideoId = inlineData?.endpoint?.watchEndpoint?.videoId;
			if (currentVideoId !== videoId && endpointVideoId !== videoId) return [];
		}

		const chapters = this.extractChaptersFromPlayerBar(inlineData);
		if (chapters.length > 0) return chapters;

		return this.extractChaptersFromEngagementPanels(inlineData);
	}

	private getTranscriptContainer(): Element | null {
		// Desktop YouTube
		const desktop = this.document.querySelector(
			'ytd-engagement-panel-section-list-renderer[target-id="engagement-panel-searchable-transcript"] #segments-container'
		);
		if (desktop) return desktop;

		// Mobile YouTube (m.youtube.com)
		return this.document.querySelector(
			'ytm-macro-markers-list-renderer .ytm-macro-markers-list-container'
		);
	}

	private getTranscriptSelectors(container: Element): TranscriptSelectors | undefined {
		if (container.querySelectorAll('ytd-transcript-segment-renderer').length > 0) {
			return DESKTOP_TRANSCRIPT_SELECTORS;
		}
		if (container.querySelectorAll('transcript-segment-view-model').length > 0) {
			return MOBILE_TRANSCRIPT_SELECTORS;
		}
		return undefined;
	}

	private buildTranscriptFromContainer(
		container: Element,
		chapters: { title: string; start: number }[]
	): TranscriptResult | undefined {
		if (container.children.length === 0) return undefined;

		const selectors = this.getTranscriptSelectors(container);
		if (!selectors) return undefined;

		const segments: { start: number; text: string }[] = [];

		// Extract chapters from DOM if the format supports inline chapters
		const domChapters: { title: string; start: number }[] = [];
		if (selectors.chapters) {
			const chapterEls = container.querySelectorAll(selectors.chapters);
			for (const ch of chapterEls) {
				const title = (ch.textContent || '').trim();
				if (!title) continue;

				// Walk up to panel item, then to next sibling to find the timestamp
				const panelItem = ch.closest('macro-markers-panel-item-view-model');
				const nextTimestamp = panelItem?.nextElementSibling?.querySelector(selectors.timestamp);
				const timeStr = (nextTimestamp?.textContent || '').trim();
				const seconds = this.parseTimestamp(timeStr);
				if (seconds !== null) {
					domChapters.push({ title, start: seconds });
				}
			}
		}

		const segmentElements = container.querySelectorAll(selectors.segments);
		for (const seg of segmentElements) {
			const timestampEl = seg.querySelector(selectors.timestamp);
			const textEl = seg.querySelector(selectors.text);
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

		const effectiveChapters = chapters.length > 0 ? chapters : domChapters;
		const groups = this.groupTranscriptSegments(segments);
		const { html, text } = buildTranscript('youtube', groups, effectiveChapters);

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
		const videoId = this.getVideoId();

		// Read ld+json directly from the DOM so we can validate it against the current video ID.
		// schemaOrgData (passed in at construction) may be absent or stale after YouTube SPA
		// navigation because YouTube removes the VideoObject ld+json block on client-side nav.
		const scripts = Array.from(this.document.querySelectorAll('script[type="application/ld+json"]'));
		for (const script of scripts) {
			try {
				const data = JSON.parse(script.textContent || '');
				const items = Array.isArray(data) ? data : [data];
				const videoObject = items.find((item: any) => {
					if (item['@type'] !== 'VideoObject') return false;
					if (!videoId) return true;
					const id: string = item['@id'] || item['url'] || item['embedUrl'] || '';
					return id.includes(videoId);
				});
				if (videoObject) return videoObject;
			} catch {
				// ignore invalid JSON
			}
		}

		// Fall back to og:* meta tags. YouTube updates these after SPA navigation,
		// so they reliably reflect the current video.
		if (videoId) {
			const ogUrl = this.document.querySelector('meta[property="og:url"]')?.getAttribute('content') || '';
			if (ogUrl.includes(videoId)) {
				return {
					name: this.document.querySelector('meta[property="og:title"]')?.getAttribute('content') || '',
					description: this.document.querySelector('meta[property="og:description"]')?.getAttribute('content') || '',
					thumbnailUrl: this.document.querySelector('meta[property="og:image"]')?.getAttribute('content') || '',
				};
			}
		}

		return {};
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
		const data = this.getValidatedPlayerResponse();
		if (!data) return '';

		return data.videoDetails?.author
			|| data.videoDetails?.ownerChannelName
			|| data.microformat?.playerMicroformatRenderer?.ownerChannelName
			|| '';
	}

	/** Returns ytInitialPlayerResponse only if its video ID matches the current URL (stale after SPA navigation). */
	private getValidatedPlayerResponse(): any | null {
		const videoId = this.getVideoId();
		if (!videoId) return null;
		const data = this.parseInlineJson('ytInitialPlayerResponse');
		if (!data) return null;
		const detailVideoId = data.videoDetails?.videoId;
		const microformatVideoId = data.microformat?.playerMicroformatRenderer?.externalVideoId;
		return (detailVideoId === videoId || microformatVideoId === videoId) ? data : null;
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

			const chaptersPromise = this.fetchChapters(videoId);

			// Start caption XML fetch from inline data immediately (no API needed).
			// Runs in parallel with the API-based path below.
			const inlineTrack = this.getInlineCaptionTrack();
			const inlineXmlPromise = inlineTrack
				? this.fetchCaptionXml(inlineTrack, chaptersPromise)
				: undefined;

			// API-based path: fetch player data for fresh caption tracks
			const playerData = await this.fetchPlayerData(videoId);
			const apiTrack = playerData
				? this.pickCaptionTrack(this.getCaptionTracks(playerData))
				: undefined;

			// If the API returned a different/better track, fetch its XML.
			// Skip if it's the same URL the inline path is already fetching.
			const apiXmlPromise = apiTrack?.baseUrl && apiTrack.baseUrl !== inlineTrack?.baseUrl
				? this.fetchCaptionXml(apiTrack, chaptersPromise)
				: undefined;

			// Prefer API result, fall back to inline
			const apiResult = apiXmlPromise ? await apiXmlPromise : undefined;
			if (apiResult) return apiResult;

			return inlineXmlPromise ? await inlineXmlPromise : undefined;
		} catch (error) {
			console.error('YoutubeExtractor: failed to fetch transcript', error);
			return undefined;
		}
	}

	private getInlineCaptionTrack(): any | undefined {
		const data = this.getValidatedPlayerResponse();
		const tracks = this.getCaptionTracks(data);
		if (tracks.length === 0) return undefined;
		const track = this.pickCaptionTrack(tracks);
		return track?.baseUrl ? track : undefined;
	}

	private async fetchCaptionXml(
		track: { baseUrl: string; languageCode?: string },
		chaptersPromise: Promise<{ title: string; start: number }[]>,
	): Promise<TranscriptResult | undefined> {
		try {
			// Validate URL to prevent SSRF in server-side contexts
			const captionUrl = new URL(track.baseUrl);
			if (!captionUrl.hostname.endsWith('.youtube.com')) return undefined;

			const captionHeaders: Record<string, string> = { 'User-Agent': 'Mozilla/5.0' };
			if (this.options.language) {
				captionHeaders['Accept-Language'] = this.options.language;
			}
			const response = await this.fetch(track.baseUrl, {
				headers: captionHeaders,
				signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
			});
			if (!response.ok) return undefined;

			let xml: string;
			try {
				xml = await response.text();
			} catch {
				return undefined;
			}
			if (!xml) return undefined;

			const chapters = await chaptersPromise;
			return this.parseTranscriptXml(xml, track.languageCode || 'en', chapters);
		} catch {
			return undefined;
		}
	}

	private pollFor<T>(predicate: () => T | null, maxAttempts = 20): Promise<T | null> {
		return new Promise<T | null>((resolve) => {
			let attempts = 0;
			const check = () => {
				const result = predicate();
				if (result) {
					resolve(result);
				} else if (attempts++ < maxAttempts) {
					setTimeout(check, 250);
				} else {
					resolve(null);
				}
			};
			check();
		});
	}

	private waitForTranscriptSegments(): Promise<Element | null> {
		return this.pollFor(() => {
			const container = this.getTranscriptContainer();
			if (!container || container.children.length === 0) return null;
			return container.querySelectorAll(MOBILE_TRANSCRIPT_SELECTORS.segments).length > 0
				? container : null;
		});
	}

	private waitForTranscriptContainer(): Promise<Element | null> {
		return this.pollFor(() => {
			const container = this.getTranscriptContainer();
			return container && container.children.length > 0 ? container : null;
		});
	}

	private waitForElement(selector: string): Promise<HTMLElement | null> {
		return this.pollFor(() =>
			this.document.querySelector(selector) as HTMLElement | null
		);
	}

	private isMobileYoutube(): boolean {
		return !!this.document.querySelector('ytm-slim-video-metadata-section-renderer');
	}

	/**
	 * Fallback: open YouTube's transcript panel and read segments from the DOM.
	 * Used when fetch-based extraction fails and the transcript is not already rendered.
	 */
	private async extractTranscriptFromOpenedDom(): Promise<TranscriptResult | undefined> {
		try {
			if (!this.canOpenTranscriptPanel()) return undefined;

			if (this.isMobileYoutube()) {
				return this.openMobileTranscriptPanel();
			}

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

	/**
	 * Mobile YouTube (m.youtube.com) transcript panel opening flow:
	 * 1. Click "...more" to expand description
	 * 2. Click "View all" next to Chapters to open the engagement panel
	 * 3. Click "Timeline" tab to switch to the transcript view
	 * 4. Wait for transcript segments to render
	 */
	private async openMobileTranscriptPanel(): Promise<TranscriptResult | undefined> {
		try {
			// Step 1: Expand description ("...more" button)
			const moreButton = this.document.querySelector(
				'button[aria-label="Show more"]'
			) as HTMLElement | null;
			if (moreButton) {
				moreButton.click();
			}

			// Step 2: Click "View all" to open the chapters/timeline panel
			const viewAllButton = await this.waitForElement('button[aria-label="View all"]');
			if (!viewAllButton) return undefined;
			viewAllButton.click();

			// Step 3: Click "Timeline" tab
			const timelineTab = await this.waitForElement('button[aria-label="Timeline"]');
			if (!timelineTab) return undefined;
			timelineTab.click();

			// Step 4: Wait for transcript segments to render
			const container = await this.waitForTranscriptSegments();
			if (!container) return undefined;

			return this.buildTranscriptFromContainer(container, []);
		} catch (error) {
			console.error('YoutubeExtractor: failed to open mobile transcript panel', error);
			return undefined;
		}
	}

	private async fetchPlayerData(videoId: string): Promise<any> {
		// Try iOS client first — doesn't require a special User-Agent header,
		// so it works in browser extensions where User-Agent is a forbidden header.
		try {
			const iosHeaders: Record<string, string> = {
				'Content-Type': 'application/json',
			};
			if (this.options.language) {
				iosHeaders['Accept-Language'] = this.options.language;
			}
			const resp = await this.fetch(INNERTUBE_API_URL, {
				method: 'POST',
				headers: iosHeaders,
				signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
				body: JSON.stringify({
					context: INNERTUBE_IOS_CONTEXT,
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
			// iOS client failed — fall through to Android client
		}

		// Try Android client (requires matching User-Agent — works server-side
		// and in content scripts on youtube.com, but not from extension pages)
		try {
			const headers: Record<string, string> = {
				'Content-Type': 'application/json',
				'User-Agent': INNERTUBE_USER_AGENT,
			};
			if (this.options.language) {
				headers['Accept-Language'] = this.options.language;
			}
			const resp = await this.fetch(INNERTUBE_API_URL, {
				method: 'POST',
				headers,
				signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
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
			// Android client failed — fall through to WEB client
		}

		// Try WEB client as last API fallback
		try {
			const webHeaders: Record<string, string> = {
				'Content-Type': 'application/json',
			};
			if (this.options.language) {
				webHeaders['Accept-Language'] = this.options.language;
			}
			const resp = await this.fetch(INNERTUBE_API_URL, {
				method: 'POST',
				headers: webHeaders,
				signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
				body: JSON.stringify({
					context: INNERTUBE_WEB_CONTEXT,
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
			// Fall through to unvalidated inline data below.
		}

		// Last resort: unvalidated inline data (may be stale after SPA navigation,
		// but better than nothing when all API calls fail)
		const fallbackData = this.parseInlineJson('ytInitialPlayerResponse');
		if (this.getCaptionTracks(fallbackData).length > 0) {
			return fallbackData;
		}

		return undefined;
	}

	private async fetchChapters(videoId: string): Promise<{ title: string; start: number }[]> {
		const inlineChapters = this.getInlineChapters();
		if (inlineChapters.length > 0) return inlineChapters;

		try {
			const chapterHeaders: Record<string, string> = { 'Content-Type': 'application/json' };
			if (this.options.language) {
				chapterHeaders['Accept-Language'] = this.options.language;
			}
			const resp = await this.fetch(INNERTUBE_NEXT_URL, {
				method: 'POST',
				headers: chapterHeaders,
				signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
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

			// Collapse subtitle line breaks to spaces
			text = text.replace(/\n/g, ' ').replace(/\s{2,}/g, ' ');

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
				let text = this.decodeEntities(match[2].replace(/<[^>]+>/g, '').replace(/\n/g, ' ').replace(/\s{2,}/g, ' '));
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

	private _videoId: string | undefined;
	private getVideoId(): string {
		if (this._videoId === undefined) {
			const url = new URL(this.url);
			this._videoId = url.hostname === 'youtu.be'
				? url.pathname.slice(1)
				: url.pathname.includes('/shorts/')
					? url.pathname.split('/shorts/')[1].split('/')[0]
				: new URLSearchParams(url.search).get('v') || '';
		}
		return this._videoId;
	}

	/**
	 * Group raw transcript segments into readable blocks.
	 * If speaker markers (>> or -) are present, groups by speaker turn.
	 * Otherwise, groups by sentence boundaries.
	 */
	private groupTranscriptSegments(segments: { start: number; text: string }[]): { start: number; text: string; speakerChange: boolean; speaker?: number }[] {
		if (segments.length === 0) return [];

		const hasSpeakerMarkers = segments.some(s => SPEAKER_MARKER.test(s.text));
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
			const isSpeakerChange = SPEAKER_MARKER.test(seg.text);
			const cleanText = seg.text.replace(SPEAKER_STRIP, '');

			// Only treat a marker as a real speaker change if the previous segment
			// ended at a sentence boundary — otherwise it's a mid-sentence
			// false positive from auto-captions
			const prevEndsWithComma = TRAILING_COMMA.test(prevSegText);
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
