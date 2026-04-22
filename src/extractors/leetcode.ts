import { BaseExtractor } from './_base';
import { ExtractorResult } from '../types/extractors';

export class LeetCodeExtractor extends BaseExtractor {
	canExtract(): boolean {
		return this.document.querySelector('[data-track-load="description_content"]') !== null;
	}

	extract(): ExtractorResult {
		const ogTitle = this.document.querySelector('meta[property="og:title"]')?.getAttribute('content') || '';
		const title = ogTitle.replace(/\s*[-–—]\s*LeetCode\s*$/, '') || ogTitle;

		return {
			content: '',
			contentHtml: '',
			contentSelector: '[data-track-load="description_content"]',
			variables: {
				title,
				site: 'LeetCode',
			},
		};
	}
}
