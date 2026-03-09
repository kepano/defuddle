import { BaseExtractor } from './_base';
import { ExtractorResult } from '../types/extractors';

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
		return this.buildResult(transcript?.html, transcript?.text, transcript?.languageCode);
	}

	private buildResult(transcriptHtml?: string, transcriptText?: string, languageCode?: string): ExtractorResult {
		const videoData = this.getVideoData();
		const channelName = this.getChannelName(videoData);
		const description = videoData.description || '';
		const formattedDescription = this.formatDescription(description);
		let contentHtml = `<iframe width="560" height="315" src="https://www.youtube.com/embed/${this.getVideoId()}" title="YouTube video player" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" referrerpolicy="strict-origin-when-cross-origin" allowfullscreen></iframe>${formattedDescription}`;

		if (transcriptHtml) {
			contentHtml += transcriptHtml;
		}

		const variables: { [key: string]: string } = {
			title: videoData.name || '',
			author: channelName,
			site: 'YouTube',
			image: Array.isArray(videoData.thumbnailUrl) ? videoData.thumbnailUrl[0] || '' : '',
			published: videoData.uploadDate,
			description: description.slice(0, 200).trim(),
		};

		if (transcriptText) {
			variables.transcript = transcriptText;
		}

		if (languageCode) {
			variables.language = languageCode;
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

			// Use innertube player API to get caption track URLs
			const playerResp = await fetch(INNERTUBE_API_URL, {
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

			if (!playerResp.ok) return undefined;
			const playerData = await playerResp.json() as any;

			const captionTracks = playerData?.captions
				?.playerCaptionsTracklistRenderer?.captionTracks;
			if (!Array.isArray(captionTracks) || captionTracks.length === 0) return undefined;

			// Prefer English, fall back to first available track
			const track = captionTracks.find((t: any) => t.languageCode === 'en')
				|| captionTracks[0];
			if (!track?.baseUrl) return undefined;

			const response = await fetch(track.baseUrl, {
				headers: { 'User-Agent': 'Mozilla/5.0' },
			});
			if (!response.ok) return undefined;

			const xml = await response.text();
			if (!xml) return undefined;

			return this.parseTranscriptXml(xml, track.languageCode || 'en');
		} catch (error) {
			console.error('YoutubeExtractor: failed to fetch transcript', error);
			return undefined;
		}
	}

	private parseTranscriptXml(xml: string, languageCode: string): { html: string; text: string; languageCode: string } | undefined {
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

		const htmlLines = segments.map(seg => {
			const timestamp = this.formatTimestamp(seg.start);
			return `<li><span data-timestamp="${seg.start}">${timestamp}</span> ${this.escapeHtml(seg.text)}</li>`;
		});

		const textLines = segments.map(seg => {
			const timestamp = this.formatTimestamp(seg.start);
			return `- ${timestamp} ${seg.text}`;
		});

		return {
			html: `<h2>Transcript</h2>\n<ul class="transcript">\n${htmlLines.join('\n')}\n</ul>`,
			text: textLines.join('\n'),
			languageCode,
		};
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

	private formatTimestamp(seconds: number): string {
		const h = Math.floor(seconds / 3600);
		const m = Math.floor((seconds % 3600) / 60);
		const s = Math.floor(seconds % 60);

		if (h > 0) {
			return `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
		}
		return `${m}:${String(s).padStart(2, '0')}`;
	}

	private escapeHtml(text: string): string {
		return text
			.replace(/&/g, '&amp;')
			.replace(/</g, '&lt;')
			.replace(/>/g, '&gt;')
			.replace(/"/g, '&quot;');
	}

	private getVideoId(): string {
		const url = new URL(this.url);
		if (url.hostname === 'youtu.be') {
			return url.pathname.slice(1);
		}
		return new URLSearchParams(url.search).get('v') || '';
	}
} 
