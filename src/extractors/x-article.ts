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
	EMBEDDED_TWEET: '[data-testid="simpleTweet"]',
	TWEET_TEXT: '[data-testid="tweetText"]',
	USER_NAME: '[data-testid="User-Name"]',
	CODE_BLOCK: '[data-testid="markdown-code-block"]',
	HEADER_BLOCK: '[data-testid="longform-header"]',
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

		// convert complex elements first (before other transformations)
		this.convertEmbeddedTweets(container, ownerDoc);
		this.convertCodeBlocks(container, ownerDoc);
		this.convertHeaders(container, ownerDoc);
		this.unwrapLinkedImages(container, ownerDoc);
		this.upgradeImageQuality(container);
		// convert bold spans BEFORE paragraphs so formatting is preserved
		this.convertBoldSpans(container, ownerDoc);
		this.convertDraftParagraphs(container, ownerDoc);
		this.removeDraftAttributes(container);
	}

	private convertEmbeddedTweets(container: HTMLElement, ownerDoc: Document): void {
		container.querySelectorAll(SELECTORS.EMBEDDED_TWEET).forEach(tweet => {
			const blockquote = ownerDoc.createElement('blockquote');
			blockquote.className = 'embedded-tweet';

			// extract author info
			const userNameEl = tweet.querySelector(SELECTORS.USER_NAME);
			const authorLinks = userNameEl?.querySelectorAll('a');
			const fullName = authorLinks?.[0]?.textContent?.trim() || '';
			const handle = authorLinks?.[1]?.textContent?.trim() || '';

			// extract tweet text
			const tweetTextEl = tweet.querySelector(SELECTORS.TWEET_TEXT);
			const tweetText = tweetTextEl?.textContent?.trim() || '';

			// build clean blockquote content
			if (fullName || handle) {
				const cite = ownerDoc.createElement('cite');
				cite.textContent = handle ? `${fullName} ${handle}` : fullName;
				blockquote.appendChild(cite);
			}

			if (tweetText) {
				const p = ownerDoc.createElement('p');
				p.textContent = tweetText;
				blockquote.appendChild(p);
			}

			tweet.replaceWith(blockquote);
		});
	}

	private convertCodeBlocks(container: HTMLElement, ownerDoc: Document): void {
		container.querySelectorAll(SELECTORS.CODE_BLOCK).forEach(block => {
			const pre = block.querySelector('pre');
			const code = block.querySelector('code');
			if (!pre || !code) return;

			// extract language from class (e.g., "language-bash") or from span
			let language = '';
			const langClass = code.className.match(/language-(\w+)/);
			if (langClass) {
				language = langClass[1];
			} else {
				// fallback: look for language label in the block header
				const langSpan = block.querySelector('span');
				language = langSpan?.textContent?.trim() || '';
			}

			// create clean pre/code structure
			const newPre = ownerDoc.createElement('pre');
			const newCode = ownerDoc.createElement('code');
			if (language) {
				newCode.setAttribute('data-lang', language);
				newCode.className = `language-${language}`;
			}
			newCode.textContent = code.textContent || '';
			newPre.appendChild(newCode);

			// replace the entire block container
			block.replaceWith(newPre);
		});
	}

	private convertHeaders(container: HTMLElement, ownerDoc: Document): void {
		// X articles use h2/h3 elements but content may be nested in spans/divs
		container.querySelectorAll('h1, h2, h3, h4, h5, h6').forEach(header => {
			const level = header.tagName.toLowerCase();
			const text = header.textContent?.trim() || '';
			if (!text) return;

			const newHeader = ownerDoc.createElement(level);
			newHeader.textContent = text;
			header.replaceWith(newHeader);
		});
	}

	private unwrapLinkedImages(container: HTMLElement, ownerDoc: Document): void {
		// find all tweetPhoto images and extract them from any ancestor anchors
		container.querySelectorAll(SELECTORS.IMAGES).forEach(img => {
			// find closest anchor ancestor
			const anchor = img.closest('a');
			if (!anchor || !container.contains(anchor)) return;

			// create clean img tag with upgraded quality (like TwitterExtractor does)
			let src = img.getAttribute('src') || '';
			const alt = img.getAttribute('alt')?.replace(/\s+/g, ' ').trim() || 'Image';

			// upgrade image quality
			if (src.includes('&name=')) {
				src = src.replace(/&name=\w+/, '&name=large');
			} else if (src.includes('?')) {
				src = `${src}&name=large`;
			} else {
				src = `${src}?name=large`;
			}

			const cleanImg = ownerDoc.createElement('img');
			cleanImg.setAttribute('src', src);
			cleanImg.setAttribute('alt', alt);

			// replace anchor with clean image
			anchor.replaceWith(cleanImg);
		});
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
		// node type constants (avoid using Node global which isn't available in all environments)
		const TEXT_NODE = 3;
		const ELEMENT_NODE = 1;

		container.querySelectorAll(SELECTORS.DRAFT_PARAGRAPHS).forEach(div => {
			const p = ownerDoc.createElement('p');

			// preserve formatting (strong, links, code) by processing children
			const processNode = (node: Node): void => {
				if (node.nodeType === TEXT_NODE) {
					p.appendChild(ownerDoc.createTextNode(node.textContent || ''));
				} else if (node.nodeType === ELEMENT_NODE) {
					const el = node as Element;
					const tag = el.tagName.toLowerCase();

					if (tag === 'strong') {
						const strong = ownerDoc.createElement('strong');
						strong.textContent = el.textContent || '';
						p.appendChild(strong);
					} else if (tag === 'a') {
						const link = ownerDoc.createElement('a');
						link.setAttribute('href', el.getAttribute('href') || '');
						link.textContent = el.textContent || '';
						p.appendChild(link);
					} else if (tag === 'code') {
						const code = ownerDoc.createElement('code');
						code.textContent = el.textContent || '';
						p.appendChild(code);
					} else {
						// recurse into other elements (spans, divs, etc.)
						el.childNodes.forEach(child => processNode(child));
					}
				}
			};

			div.childNodes.forEach(child => processNode(child));
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
