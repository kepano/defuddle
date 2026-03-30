import { BaseExtractor } from './_base';
import { ExtractorResult } from '../types/extractors';

export class SubstackExtractor extends BaseExtractor {
	private noteText: Element | null = null;
	private noteImage: Element | null = null;

	constructor(document: Document, url: string, schemaOrgData?: any, options?: any) {
		super(document, url, schemaOrgData, options);

		// Text is in the first ProseMirror editor div on the page
		this.noteText = document.querySelector('div.ProseMirror.FeedProseMirror');

		if (this.noteText) {
			// Structure: ProseMirror → feedCommentBodyInner → feedCommentBody → contentWrapper
			// imageGrid is a sibling of contentWrapper (one level above feedCommentBody)
			const feedCommentBody = this.noteText.closest('[class*="feedCommentBody"]:not([class*="feedCommentBodyInner"])');
			const sibling = feedCommentBody?.parentElement?.nextElementSibling;
			const siblingClass = sibling?.getAttribute('class') || '';
			if (sibling && siblingClass.includes('imageGrid')) {
				this.noteImage = sibling;
			}
		}
	}

	canExtract(): boolean {
		return this.noteText !== null;
	}

	extract(): ExtractorResult {
		const textHtml = this.noteText!.outerHTML;
		const imageHtml = this.buildImageHtml();
		const content = imageHtml ? `${textHtml}\n${imageHtml}` : textHtml;

		const title = this.document.querySelector('meta[property="og:title"]')?.getAttribute('content') || '';
		const description = this.document.querySelector('meta[property="og:description"]')?.getAttribute('content') || '';
		const author = title.replace(/\s*\(@[^)]+\)\s*$/, '').trim();

		return {
			content,
			contentHtml: content,
			variables: {
				title,
				author,
				site: 'Substack',
				description,
			},
		};
	}

	private buildImageHtml(): string {
		if (!this.noteImage) return '';

		// og:image has the best quality URL (f_auto without resize params)
		const ogImage = this.document.querySelector('meta[property="og:image"]')?.getAttribute('content');
		if (ogImage) return `<img src="${ogImage}" alt="" />`;

		// Fallback: pick the largest srcset entry and strip CDN resize params
		const img = this.noteImage.querySelector('img');
		if (!img) return '';
		const src = this.getLargestSrc(img);
		return src ? `<img src="${src}" alt="" />` : '';
	}

	private getLargestSrc(img: Element): string {
		const srcset = img.getAttribute('srcset') || '';
		if (srcset) {
			const entryPattern = /(.+?)\s+(\d+(?:\.\d+)?)w/g;
			let bestUrl = '';
			let bestWidth = 0;
			let match;
			let lastIndex = 0;
			while ((match = entryPattern.exec(srcset)) !== null) {
				let url = match[1].trim();
				if (lastIndex > 0) url = url.replace(/^,\s*/, '');
				lastIndex = entryPattern.lastIndex;
				const width = parseFloat(match[2]);
				if (url && width > bestWidth) {
					bestWidth = width;
					bestUrl = url;
				}
			}
			if (bestUrl) return bestUrl.replace(/,w_\d+/g, '').replace(/,c_\w+/g, '');
		}
		return img.getAttribute('src') || '';
	}
}
