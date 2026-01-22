import { BaseExtractor } from './_base';
import { ExtractorResult } from '../types/extractors';

const SELECTORS = {
	ARTICLE_CONTAINER: '[data-testid="twitterArticleRichTextView"]',
	TITLE: '[data-testid="twitter-article-title"]',
	AUTHOR: '[itemprop="author"]',
	AUTHOR_NAME: 'meta[itemprop="name"]',
	AUTHOR_HANDLE: 'meta[itemprop="additionalName"]',
	IMAGES: '[data-testid="tweetPhoto"] img',
	DRAFT_PARAGRAPHS: '.longform-unstyled, .public-DraftStyleDefault-block',
	BOLD_SPANS: 'span[style*="font-weight: bold"]',
	DRAFT_ATTRIBUTES: '[data-offset-key]',
} as const;

export class XArticleExtractor extends BaseExtractor {
	private articleContainer: Element | null;

	constructor(document: Document, url: string, schemaOrgData?: any) {
		super(document, url, schemaOrgData);
		this.articleContainer = document.querySelector(SELECTORS.ARTICLE_CONTAINER);
	}

	canExtract(): boolean {
		return !!this.articleContainer;
	}

	extract(): ExtractorResult {
		const title = this.extractTitle();
		const author = this.extractAuthor();
		const contentHtml = this.extractContent();
		const description = this.createDescription();

		return {
			content: contentHtml,
			contentHtml,
			extractedContent: {
				articleId: this.getArticleId(),
			},
			variables: {
				title,
				author,
				site: 'X (Twitter)',
				description,
			}
		};
	}

	private extractTitle(): string {
		const titleEl = this.document.querySelector(SELECTORS.TITLE);
		return titleEl?.textContent?.trim() || 'Untitled X Article';
	}

	private extractAuthor(): string {
		const authorContainer = this.document.querySelector(SELECTORS.AUTHOR);
		if (!authorContainer) return this.getAuthorFromUrl();

		const name = authorContainer.querySelector(SELECTORS.AUTHOR_NAME)?.getAttribute('content');
		const handle = authorContainer.querySelector(SELECTORS.AUTHOR_HANDLE)?.getAttribute('content');

		if (name && handle) return `${name} (@${handle})`;
		return name || handle || this.getAuthorFromUrl();
	}

	private getAuthorFromUrl(): string {
		// match username before /article/ or /status/, excluding system paths like /i/
		const match = this.url.match(/\/([a-zA-Z][a-zA-Z0-9_]{0,14})\/(article|status)\/\d+/);
		return match ? `@${match[1]}` : 'Unknown';
	}

	private getArticleId(): string {
		const match = this.url.match(/(article|status)\/(\d+)/);
		return match ? match[2] : '';
	}

	private extractContent(): string {
		if (!this.articleContainer) return '';

		const clone = this.articleContainer.cloneNode(true) as HTMLElement;
		this.cleanContent(clone);

		return `<article class="x-article">${clone.innerHTML}</article>`;
	}

	private cleanContent(container: HTMLElement): void {
		const ownerDoc = container.ownerDocument || this.document;

		this.upgradeImageQuality(container);
		this.convertDraftParagraphs(container, ownerDoc);
		this.convertBoldSpans(container, ownerDoc);
		this.removeDraftAttributes(container);
	}

	private upgradeImageQuality(container: HTMLElement): void {
		container.querySelectorAll(SELECTORS.IMAGES).forEach(img => {
			const src = img.getAttribute('src');
			if (!src) return;

			if (src.includes('&name=')) {
				img.setAttribute('src', src.replace(/&name=\w+/, '&name=large'));
			} else if (src.includes('?')) {
				img.setAttribute('src', `${src}&name=large`);
			} else {
				img.setAttribute('src', `${src}?name=large`);
			}
		});
	}

	private convertDraftParagraphs(container: HTMLElement, ownerDoc: Document): void {
		container.querySelectorAll(SELECTORS.DRAFT_PARAGRAPHS).forEach(div => {
			const p = ownerDoc.createElement('p');
			p.textContent = div.textContent || '';
			div.replaceWith(p);
		});
	}

	private convertBoldSpans(container: HTMLElement, ownerDoc: Document): void {
		container.querySelectorAll(SELECTORS.BOLD_SPANS).forEach(span => {
			const strong = ownerDoc.createElement('strong');
			strong.textContent = span.textContent || '';
			span.replaceWith(strong);
		});
	}

	private removeDraftAttributes(container: HTMLElement): void {
		container.querySelectorAll(SELECTORS.DRAFT_ATTRIBUTES).forEach(el => {
			el.removeAttribute('data-offset-key');
		});
	}

	private createDescription(): string {
		const text = this.articleContainer?.textContent?.trim() || '';
		return text.slice(0, 140) + (text.length > 140 ? '...' : '');
	}
}
