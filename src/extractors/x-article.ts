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

	private cleanArticleContent(article: Element): Element {
		// Extract and clean embedded tweets
		let tweetSelector = '[data-testid="simpleTweet"]';
		const embeddedTweets = article.querySelectorAll(tweetSelector);

		const twitterExtractor = new TwitterExtractor(this.document, this.url);
		embeddedTweets.forEach(tweet => {
			const extractedTweet = twitterExtractor.extractTweet(tweet);

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
		const authorElement = this.article?.querySelector('[itemprop="author"]');

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
		const titleElement = this.article?.querySelector('[data-testid="twitter-article-title"]');
		return titleElement?.textContent?.trim() || '';
	}
}
