import { BaseExtractor } from './_base';
import { ExtractorResult } from '../types/extractors';
import { parseHTML } from '../utils/dom';

const INJECTED_ATTR = 'data-defuddle-substack-post';

interface SubstackPostData {
	title?: string;
	subtitle?: string;
	body_html?: string;
	post_date?: string;
	canonical_url?: string;
	publishedBylines?: Array<{ name?: string; handle?: string }>;
}

export class SubstackExtractor extends BaseExtractor {
	private noteText: Element | null = null;
	private noteImage: Element | null = null;
	private postData: SubstackPostData | null = null;
	private postContentSelector: string | null = null;

	constructor(document: Document, url: string, schemaOrgData?: any, options?: any) {
		super(document, url, schemaOrgData, options);

		// Check for rendered post body first (browser/extension context, after React hydration)
		if (document.querySelector('div.body.markup')) {
			this.postData = this.extractPreloadData(); // metadata only
			this.postContentSelector = 'div.body.markup';
			return;
		}

		// Fall back to window._preloads script (SSR/curl/worker context)
		this.postData = this.extractPreloadData();
		if (this.postData?.body_html) {
			// Inject body_html into the document so the pipeline can process it
			const existing = document.querySelector(`[${INJECTED_ATTR}]`);
			if (!existing) {
				const wrapper = document.createElement('div');
				wrapper.setAttribute(INJECTED_ATTR, '');
				wrapper.appendChild(parseHTML(document, this.postData.body_html));
				document.body.appendChild(wrapper);
			}
			this.postContentSelector = `[${INJECTED_ATTR}]`;
			return;
		}

		// Fall back to Notes extraction (ProseMirror editor div)
		// On permalink note pages, the main note is inside a feedPermalinkUnit container.
		// Other ProseMirror elements on the page belong to feed recommendations.
		const permalinkUnit = document.querySelector('[class*="feedPermalinkUnit"]');
		this.noteText = (permalinkUnit || document).querySelector('div.ProseMirror.FeedProseMirror');
		if (this.noteText) {
			const feedCommentBody = this.noteText.closest('[class*="feedCommentBody"]:not([class*="feedCommentBodyInner"])');
			if (feedCommentBody) {
				// imageGrid can be a sibling of feedCommentBody or of its parent wrapper
				const candidates = [feedCommentBody.nextElementSibling, feedCommentBody.parentElement?.nextElementSibling];
				for (const el of candidates) {
					if (el && (el.getAttribute('class') || '').includes('imageGrid')) {
						this.noteImage = el;
						break;
					}
				}
			}
		}
	}

	canExtract(): boolean {
		return this.postContentSelector !== null || this.noteText !== null;
	}

	extract(): ExtractorResult {
		if (this.postContentSelector) {
			return this.extractPost();
		}
		return this.extractNote();
	}

	private extractPost(): ExtractorResult {
		const title = this.postData?.title || this.document.querySelector('meta[property="og:title"]')?.getAttribute('content') || '';
		const description = this.postData?.subtitle || this.document.querySelector('meta[property="og:description"]')?.getAttribute('content') || '';
		const author = this.postData?.publishedBylines?.[0]?.name
			|| this.document.querySelector('a[href*="substack.com/@"]')?.textContent?.trim()
			|| '';
		const published = this.postData?.post_date
			|| this.parseDateFromByline()
			|| '';

		return {
			content: '',
			contentHtml: '',
			contentSelector: this.postContentSelector!,
			variables: {
				title,
				author,
				site: 'Substack',
				description,
				published,
			},
		};
	}

	private extractNote(): ExtractorResult {
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

	private parseDateFromByline(): string {
		const byline = this.document.querySelector('[class*="byline-wrapper"]');
		if (!byline) return '';
		// textContent runs adjacent words together (e.g. "ZhutovFeb") — insert space at case boundaries
		const text = (byline.textContent || '').trim().replace(/([a-z])([A-Z])/g, '$1 $2');
		// Match "Feb 24, 2026" style (Substack uses abbreviated month names in the UI)
		const ABBREV_MONTHS = 'Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec';
		const MONTH_MAP: Record<string, string> = {
			Jan: '01', Feb: '02', Mar: '03', Apr: '04', May: '05', Jun: '06',
			Jul: '07', Aug: '08', Sep: '09', Oct: '10', Nov: '11', Dec: '12',
		};
		const match = text.match(new RegExp(`\\b(${ABBREV_MONTHS})\\s+(\\d{1,2}),?\\s+(\\d{4})\\b`));
		if (match) {
			const month = MONTH_MAP[match[1]];
			const day = match[2].padStart(2, '0');
			return `${match[3]}-${month}-${day}T00:00:00+00:00`;
		}
		return '';
	}

	private extractPreloadData(): SubstackPostData | null {
		const scripts = Array.from(this.document.querySelectorAll('script'));
		for (const script of scripts) {
			const text = script.textContent || '';
			if (!text.includes('window._preloads') || !text.includes('body_html')) continue;

			const jsonParseIdx = text.indexOf('JSON.parse("');
			if (jsonParseIdx === -1) continue;

			const startIdx = jsonParseIdx + 'JSON.parse("'.length;
			let i = startIdx;
			while (i < text.length) {
				if (text[i] === '\\') {
					i += 2;
				} else if (text[i] === '"') {
					break;
				} else {
					i++;
				}
			}

			try {
				const innerStr = text.slice(startIdx, i);
				const jsonString = JSON.parse('"' + innerStr + '"') as string;
				const data = JSON.parse(jsonString);
				const post: SubstackPostData = data?.feedData?.initialPost?.post;
				if (post?.body_html) return post;
			} catch {
				// ignore parse errors
			}
		}
		return null;
	}

	private buildImageHtml(): string {
		if (!this.noteImage) return '';

		const ogImage = this.document.querySelector('meta[property="og:image"]')?.getAttribute('content');
		if (ogImage) return `<img src="${ogImage}" alt="" />`;

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
