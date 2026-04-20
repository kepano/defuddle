import { BaseExtractor, ExtractorOptions } from './_base';
import { ExtractorResult } from '../types/extractors';

export class MediumExtractor extends BaseExtractor {
	private article: Element | null;

	constructor(document: Document, url: string, schemaOrgData?: any, options?: ExtractorOptions) {
		super(document, url, schemaOrgData, options);
		this.article = document.querySelector('article.meteredContent') || document.querySelector('article');
	}

	canExtract(): boolean {
		if (!this.article) return false;

		// Verify this is a Medium page
		if (this.article.classList?.contains('meteredContent')) return true;
		const siteName = this.document.querySelector('meta[property="og:site_name"]')?.getAttribute('content') || '';
		const appName = this.document.querySelector('meta[property="al:android:app_name"]')?.getAttribute('content') || '';
		return siteName === 'Medium' || appName === 'Medium';
	}

	extract(): ExtractorResult {
		const title = this.getTitle();
		const subtitle = this.getSubtitle();
		const author = this.getAuthor();
		const publication = this.getPublication();

		// Clean before getDescription so it doesn't pick up UI text
		this.cleanArticle();
		const description = subtitle || this.getDescription();

		return {
			content: '',
			contentHtml: '',
			// Tell defuddle to run the standard pipeline on the article element
			contentSelector: 'article',
			extractedContent: {
				publication,
			},
			variables: {
				title,
				author,
				site: publication || 'Medium',
				description,
			}
		};
	}

	/**
	 * Remove Medium UI elements from the article before the standard
	 * pipeline processes it. This runs on the live DOM.
	 */
	private cleanArticle(): void {
		if (!this.article) return;

		// Unwrap role="button" containers around images — the pipeline
		// removes [role="button"] elements which would kill the images
		this.article.querySelectorAll('figure [role="button"]').forEach(btn => {
			btn.replaceWith(...Array.from(btn.childNodes));
		});

		// Also remove role="button" on tooltip containers around author info
		this.article.querySelectorAll('[role="tooltip"]').forEach(el => {
			el.removeAttribute('role');
		});

		// Remove subscription promo banners (links to medium.com/plans)
		this.article.querySelectorAll('a[href*="medium.com/plans"]').forEach(link => {
			// Remove the closest block-level ancestor that wraps only the promo
			const wrapper = link.closest('div');
			if (wrapper && wrapper !== this.article) {
				wrapper.remove();
			} else {
				link.remove();
			}
		});

		// Remove related article previews
		this.article.querySelectorAll('[data-testid="post-preview"]').forEach(el => el.remove());

		// Remove engagement buttons
		this.article.querySelectorAll('[data-testid*="Clap"], [data-testid*="Bookmark"], [data-testid*="Share"], [data-testid*="Response"]').forEach(el => el.remove());

		// Remove author photo, name, and read time
		this.article.querySelectorAll('[data-testid="authorPhoto"], [data-testid="authorName"], [data-testid="storyReadTime"]').forEach(el => el.remove());

		// Remove UI text, dates, read-time, and standalone noise
		const UI_TEXT = new Set([
			'Member-only story', 'Listen', 'Share', 'Top highlight', '·',
			'Press enter or click to view image in full size',
		]);
		this.article.querySelectorAll('p, span, div').forEach(el => {
			const text = el.textContent?.trim() || '';
			if (!text) return;
			if (UI_TEXT.has(text)) { el.remove(); return; }
			if (/^\w{3}\s+\d{1,2},\s+\d{4}/.test(text) && text.length < 30) { el.remove(); return; }
			if (/^·\s*\d+\s*\w+\s*ago$/.test(text)) { el.remove(); return; }
			if (/^·?\s*\d+\s*min\s*read$/.test(text)) el.remove();
		});
	}

	private getTitle(): string {
		const storyTitle = this.document.querySelector('[data-testid="storyTitle"]');
		if (storyTitle) return storyTitle.textContent?.trim() || '';
		return this.article?.querySelector('h1')?.textContent?.trim() || '';
	}

	private getSubtitle(): string {
		return this.document.querySelector('.pw-subtitle-paragraph')?.textContent?.trim() || '';
	}

	private getAuthor(): string {
		return this.document.querySelector('[data-testid="authorName"]')?.textContent?.trim() || '';
	}

	private getPublication(): string {
		const meta = this.document.querySelector('meta[property="og:site_name"]');
		const siteName = meta?.getAttribute('content') || '';
		if (siteName && siteName !== 'Medium') return siteName;

		const schemas = Array.isArray(this.schemaOrgData) ? this.schemaOrgData : [this.schemaOrgData];
		for (const schema of schemas) {
			if (schema?.publisher?.name) return schema.publisher.name;
		}

		return '';
	}

	private getDescription(): string {
		if (!this.article) return '';
		const paragraphs = this.article.querySelectorAll('p');
		for (const p of Array.from(paragraphs)) {
			const text = p.textContent?.trim() || '';
			// Skip empty, short punctuation-only, or numeric paragraphs
			if (text.length < 3 || /^[\d\W]+$/.test(text)) continue;
			return text.slice(0, 140).replace(/\s+/g, ' ');
		}
		return '';
	}
}
