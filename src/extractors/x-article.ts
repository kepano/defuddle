import { BaseExtractor } from './_base';
import { ExtractorResult } from '../types/extractors';
import { TwitterExtractor } from './twitter';

export class xArticleExtractor extends BaseExtractor {
	private article: Element | null = null;

	constructor(document: Document, url: string) {
		super(document, url);

		// Locate the main article content
		const article = document.querySelector('[data-testid="twitterArticleRichTextView"]');
		if (!article) {
			throw new Error('Failed to find the article content.');
		}
		this.article = article;
	}

	canExtract(): boolean {
		return !!this.article;
	}

	extract(): ExtractorResult {
		const article = this.extractContent(this.article);

		const contentHtml = article || '';

		const articleTitle = this.getArticleTitle();
		const articleId = this.getArticleId();
		const articleAuthor = this.getArticleAuthor();
		const description = this.createDescription(this.article);

		return {
			content: contentHtml,
			contentHtml: contentHtml,
			extractedContent: {
				articleId,
				articleAuthor,
			},
			variables: {
				title: articleTitle,
				author: articleAuthor,
				site: 'X (Twitter)',
				description,
			},
		};
	}

	/**
	 * Recursively cleans HTML content by removing redundant wrapper elements while preserving semantic markup.
	 *
	 * This method is designed to clean content from X articles where content is often wrapped in multiple
	 *  div/span elements for styling purposes, while preserving meaningful markup.
	 *
	 * Please only use this method as the last step in your content cleaning process.
	 *
	 * PRESERVES:
	 * - Semantic text formatting: <strong>, <b>, <em>, <i>, <code>
	 * - Links with href attributes: <a href="...">
	 * - Text content and whitespace
	 *
	 * REMOVES:
	 * - Wrapper divs and spans (but keeps their content)
	 * - All other HTML elements (converts to text content)
	 * - All attributes except href on links
	 * - CSS classes, data attributes, and styling
	 *
	 * AVOID USING WHEN:
	 * - You need to preserve complex HTML structures (tables, forms, etc.)
	 * - Layout or visual markup has semantic meaning
	 * - You need to preserve CSS classes or data attributes
	 * - Content contains interactive elements that should be preserved
	 * - The original markup structure is semantically important
	 *
	 * @param element - The DOM element to clean recursively
	 * @returns Cleaned HTML string with redundant wrappers removed and semantic markup preserved
	 *
	 * @example
	 * // Input: <div><span><strong>Bold text</strong></span><span> and normal text</span></div>
	 * // Output: "<strong>Bold text</strong> and normal text"
	 *
	 * @example
	 * // Input: <div class="wrapper"><a href="/link">Link</a><span> text</span></div>
	 * // Output: '<a href="/link">Link</a> text'
	 */
	private cleanContentRecursively(element: Element): string {
		let result = '';
		element.childNodes.forEach(node => {
			if (node.nodeType === Node.TEXT_NODE) {
				result += node.textContent || '';
			} else if (node.nodeType === Node.ELEMENT_NODE) {
				const el = node as Element;

				// Preserve important markup tags
				if (['STRONG', 'B', 'EM', 'I', 'A', 'CODE'].includes(el.tagName)) {
					const tag = el.tagName.toLowerCase();
					let attributes = '';
					if (tag === 'a' && el.getAttribute('href')) {
						attributes = ` href="${el.getAttribute('href')}"`;
					}
					result += `<${tag}${attributes}>${this.cleanContentRecursively(el)}</${tag}>`;
				}
				// Remove redundant div/span wrappers but preserve their content
				else if (['DIV', 'SPAN'].includes(el.tagName)) {
					result += this.cleanContentRecursively(el);
				}
				// For other elements, just extract text content
				else {
					result += el.textContent || '';
				}
			}
		});
		return result;
	}

	private cleanArticleContent(article: Element): Element {
		// Extract and clean embedded tweets
		let tweetSelector = '[data-testid="simpleTweet"]';
		const embeddedTweets = article.querySelectorAll(tweetSelector);

		const twitterExtractor = new TwitterExtractor(this.document, this.url);
		embeddedTweets.forEach(tweet => {
			const extractedTweet = twitterExtractor.extractTweet(tweet, false);

			// Replace the tweet element with formatted content
			if (extractedTweet) {
				const tweetDiv = article.ownerDocument.createElement('div');
				tweetDiv.className = 'embedded-tweet';
				tweetDiv.innerHTML = `
					<blockquote>
						${extractedTweet}
					</blockquote>
				`;
				tweet.parentNode?.replaceChild(tweetDiv, tweet);
			}
		});

		// Replace header divs with clean headers
		['h1', 'h2', 'h3', 'h4', 'h5', 'h6'].forEach(tagName => {
			article.querySelectorAll(tagName).forEach(header => {
				const newHeader = article.ownerDocument.createElement(tagName);
				newHeader.textContent = header.textContent;
				const parentDiv = header.parentNode as Element;
				parentDiv.parentNode?.replaceChild(newHeader, parentDiv);
			});
		});

		// Replace ul and ol divs clean ul/ol elements
		article.querySelectorAll('ul, ol').forEach(list => {
			const newList = article.ownerDocument.createElement(list.tagName.toLowerCase());
			newList.innerHTML = list.innerHTML;
			list.parentNode?.replaceChild(newList, list);
		});

		// Replace list div items with clean li elements
		article.querySelectorAll('li').forEach(li => {
			const newLi = article.ownerDocument.createElement('li');
			newLi.innerHTML = this.cleanContentRecursively(li);
			li.parentNode?.replaceChild(newLi, li);
		});

		// Transform wrapped links into clean anchor tags (excluding those in blockquotes)
		article.querySelectorAll('div > a > span').forEach(span => {
			const anchor = span.parentElement as HTMLAnchorElement;
			const div = anchor.parentElement as HTMLElement;

			if (!anchor || !div || !anchor.href) return;

			// Skip if this link is inside a blockquote (quoted content)
			if (div.closest('blockquote')) return;

			// Create clean link with preserved attributes
			const cleanLink = article.ownerDocument.createElement('a');
			cleanLink.href = anchor.href;
			cleanLink.textContent = span.textContent || '';

			// Preserve important attributes
			if (anchor.rel) cleanLink.rel = anchor.rel;
			if (anchor.target) cleanLink.target = anchor.target;
			if (anchor.title) cleanLink.title = anchor.title;

			// Replace the entire div with the clean link
			div.parentNode?.replaceChild(cleanLink, div);
		});

		// remove data-offset-key and dir attributes
		article.querySelectorAll('[data-offset-key], [dir]').forEach(el => {
			el.removeAttribute('data-offset-key');
			el.removeAttribute('dir');
		});

		// remove public-DraftStyleDefault-ltr class
		article.querySelectorAll('.public-DraftStyleDefault-ltr').forEach(el => {
			el.classList.remove('public-DraftStyleDefault-ltr');
		});

		// Flatten nested spans - convert bold spans to strong tags
		article.querySelectorAll('span[style*="font-weight: bold"]').forEach(span => {
			const strong = article.ownerDocument.createElement('strong');
			strong.textContent = span.textContent || '';
			span.parentNode?.replaceChild(strong, span);
		});

		// Replace longform-unstyled divs that contain public-DraftStyleDefault-block with paragraphs
		// Process from innermost to outermost to handle nested structures
		const longformDivs = Array.from(article.querySelectorAll('.longform-unstyled')).reverse();
		longformDivs.forEach(longformDiv => {
			const draftBlock = longformDiv.querySelector('.public-DraftStyleDefault-block');
			if (draftBlock) {
				const paragraph = article.ownerDocument.createElement('p');
				paragraph.innerHTML = this.cleanContentRecursively(longformDiv);
				longformDiv.parentNode?.replaceChild(paragraph, longformDiv);
			}
		});

		// Find and clean images within the article
		article.querySelectorAll('section [data-testid="tweetPhoto"] img').forEach(img => {
			const parentSection = img.closest('section');
			if (parentSection) {
				const cleanImg = article.ownerDocument.createElement('img');
				const highQualitySrc = img.getAttribute('src')?.replace(/&name=\w+$/, '&name=large') || '';
				const cleanAlt = img.getAttribute('alt')?.replace(/\s+/g, ' ').trim() || '';
				cleanImg.src = highQualitySrc;
				cleanImg.alt = cleanAlt;
				cleanImg.style.maxWidth = '100%'; // Ensure images fit within the content area
				parentSection.parentNode?.replaceChild(cleanImg, parentSection);
			}
		});

		// Replace section elements that contain only separator divs with clean hr elements
		article.querySelectorAll('section[data-block="true"]').forEach(section => {
			const separatorDiv = section.querySelector('div[role="separator"]');
			if (separatorDiv && section.children.length === 1) {
				const hr = article.ownerDocument.createElement('hr');
				section.parentNode?.replaceChild(hr, section);
			}
		});

		// Remove wrapper divs around div[data-contents="true"] elements and replace with article tags
		article.querySelectorAll('div[data-contents="true"]').forEach(contentDiv => {
			let current = contentDiv.parentNode;
			while (current && current !== article) {
				const parent = current.parentNode;
				if (parent && current !== contentDiv) {
					parent.insertBefore(contentDiv, current);
					parent.removeChild(current);
					current = parent;
				} else {
					break;
				}
			}
			const articleElement = contentDiv.ownerDocument.createElement('article');
			articleElement.innerHTML = contentDiv.innerHTML;
			contentDiv.parentNode?.replaceChild(articleElement, contentDiv);
		});

		return article;
	}

	private extractContent(article: Element | null): string {
		if (!article) return '';

		// Clone the article to avoid modifying the original DOM
		const clonedArticle = article.cloneNode(true) as Element;

		const formattedArticle = this.cleanArticleContent(clonedArticle);

		return formattedArticle.innerHTML;
	}

	private getArticleId(): string {
		const match = this.url.match(/(status|article)\/(\d+)/);
		return match?.[1] || '';
	}

	private getArticleAuthor(): string {
		const authorElement = this.document?.querySelector('[itemprop="author"]');

		if (!authorElement) {
			console.debug('Author element not found in article. Falling back to URL parsing.');
			const match = this.url.match(/\/(\w+)\/(article|status)\/\d+/);
			return match?.[1] || '';
		}

		const authorName = authorElement?.querySelector('meta[itemprop="name"]')?.getAttribute('content') || '';
		const authorHandle = authorElement?.querySelector('meta[itemprop="additionalName"]')?.getAttribute('content') || '';
		return authorName || authorHandle || '';
	}

	private createDescription(article: Element | null): string {
		if (!article) return '';
		const textContent = article.textContent || '';
		return textContent.trim().slice(0, 140).replace(/\s+/g, ' ');
	}

	private getArticleTitle(): string {
		const titleElement = this.document?.querySelector('[data-testid="twitter-article-title"]');
		return titleElement?.textContent?.trim() || '';
	}
}
