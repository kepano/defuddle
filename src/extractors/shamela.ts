import { BaseExtractor } from './_base';
import { ExtractorResult } from '../types/extractors';

export class ShamelaExtractor extends BaseExtractor {
	canExtract(): boolean {
		if (this.options.contentSelector) return false;
		const url = new URL(this.url);
		if (!['shamela.ws', 'www.shamela.ws'].includes(url.hostname) ||
			!/^\/book\/\d+\/\d+\/?$/.test(url.pathname)) return false;
		const roots = this.document.querySelectorAll('.nass');
		return roots.length === 1 && !!roots[0].textContent?.trim();
	}

	extract(): ExtractorResult {
		// Book text and annotations share this root; #content belongs to search.
		// Reuse the pipeline for standardization, URL resolution and sanitization.
		return { content: '', contentHtml: '', contentSelector: '.nass' };
	}
}
