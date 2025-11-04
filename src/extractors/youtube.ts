import { BaseExtractor } from './_base';
import { ExtractorResult } from '../types/extractors';

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

	extract(): ExtractorResult {
		const videoData = this.getVideoData();
		const channelName = this.getChannelName(videoData);
		const description = videoData.description || '';
		const formattedDescription = this.formatDescription(description);
		const contentHtml = `<iframe width="560" height="315" src="https://www.youtube.com/embed/${this.getVideoId()}" title="YouTube video player" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" referrerpolicy="strict-origin-when-cross-origin" allowfullscreen></iframe><br>${formattedDescription}`;

		return {
			content: contentHtml,
			contentHtml: contentHtml,
			extractedContent: {
				videoId: this.getVideoId(),
				author: channelName,
			},
			variables: {
				title: videoData.name || '',
				author: channelName,
				site: 'YouTube',
				image: Array.isArray(videoData.thumbnailUrl) ? videoData.thumbnailUrl[0] || '' : '',
				published: videoData.uploadDate,
				description: description.slice(0, 200).trim(),
			}
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

	private getVideoId(): string {
		const url = new URL(this.url);
		if (url.hostname === 'youtu.be') {
			return url.pathname.slice(1);
		} 
		return new URLSearchParams(url.search).get('v') || '';
	}
} 
