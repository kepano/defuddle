import { BaseExtractor, ExtractorOptions } from './_base';
import { ExtractorResult } from '../types/extractors';

export class RoyalRoadExtractor extends BaseExtractor {
	private chapterContent: Element | null;

	constructor(document: Document, url: string, schemaOrgData?: any, options?: ExtractorOptions) {
		super(document, url, schemaOrgData, options);
		this.chapterContent = document.querySelector('.chapter-inner.chapter-content');
	}

	canExtract(): boolean {
		if (!this.chapterContent) return false;
		return /(?:^|\.)royalroad\.com$/i.test(new URL(this.url).hostname);
	}

	extract(): ExtractorResult {
		return {
			content: '',
			contentHtml: '',
			contentSelector: '.chapter-inner.chapter-content',
			variables: {
				author: this.getAuthor(),
				site: 'Royal Road',
			},
		};
	}

	private getAuthor(): string {
		const selectors = [
			'.fic-header h3 a',
			'.profile-info h1 a',
		];

		for (const selector of selectors) {
			const link = this.document.querySelector(selector);
			const href = link?.getAttribute('href') || '';
			if (href && !href.includes('/profile/')) continue;
			const text = link?.textContent?.trim();
			if (text) return text;
		}

		return '';
	}
}
