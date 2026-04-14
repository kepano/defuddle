import { BaseExtractor } from './_base';
import { ExtractorResult } from '../types/extractors';

export class WikipediaExtractor extends BaseExtractor {
	canExtract(): boolean {
		return this.document.querySelector('#mw-content-text') !== null;
	}

	extract(): ExtractorResult {
		const ogTitle = this.document.querySelector('meta[property="og:title"]')?.getAttribute('content') || '';
		const title = ogTitle.replace(/\s*[-–—]\s*Wikipedia\s*$/, '') || ogTitle;

		return {
			content: '',
			contentHtml: '',
			contentSelector: '#mw-content-text',
			variables: {
				title,
				author: 'Wikipedia',
				site: 'Wikipedia',
			},
		};
	}
}
