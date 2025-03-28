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
		const description = videoData.description || '';
		const formattedDescription = this.formatDescription(description);
		const contentHtml = `<iframe width="560" height="315" src="https://www.youtube.com/embed/${this.getVideoId()}?si=_m0qv33lAuJFoGNh" title="YouTube video player" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" referrerpolicy="strict-origin-when-cross-origin" allowfullscreen></iframe><br>${formattedDescription}`;

		return {
			content: contentHtml,
			contentHtml: contentHtml,
			extractedContent: {
				videoId: this.getVideoId(),
				author: videoData.author || '',
			},
			variables: {
				title: videoData.name || '',
				author: videoData.author || '',
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

	private getVideoId(): string {
		const urlParams = new URLSearchParams(new URL(this.url).search);
		return urlParams.get('v') || '';
	}
} 