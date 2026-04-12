import { BaseExtractor } from './_base';
import { ExtractorResult } from '../types/extractors';
import { parseHTML, serializeHTML } from '../utils/dom';
import { buildCommentTree, buildContentHtml, type CommentData } from '../utils/comments';

export class RedditExtractor extends BaseExtractor {
	private shredditPost: Element | null;
	private isOldReddit: boolean;

	constructor(document: Document, url: string) {
		super(document, url);
		this.shredditPost = document.querySelector('shreddit-post');
		this.isOldReddit = !!document.querySelector('.thing.link');
	}

	canExtract(): boolean {
		return !!this.shredditPost || this.isOldReddit;
	}

	canExtractAsync(): boolean {
		return this.isCommentsPage() && !this.isOldReddit;
	}

	prefersAsync(): boolean {
		// In server/worker contexts, fetch old.reddit.com for full content including
		// comments. In browser (real window), use the rendered DOM directly since
		// old.reddit.com is CORS-blocked from www.reddit.com.
		const isBrowser = typeof window !== 'undefined' && this.document.defaultView === window;
		return this.isCommentsPage() && !this.isOldReddit && !isBrowser;
	}

	private isCommentsPage(): boolean {
		return /\/r\/.+\/comments\//.test(this.url);
	}

	async extractAsync(): Promise<ExtractorResult> {
		// Convert URL to old.reddit.com
		const oldUrl = new URL(this.url);
		oldUrl.hostname = 'old.reddit.com';

		const response = await this.fetch(oldUrl.toString(), {
			headers: {
				'User-Agent': 'Mozilla/5.0 (compatible; Defuddle/1.0)',
			},
		});

		if (!response.ok) {
			throw new Error(`Failed to fetch old.reddit.com: ${response.status}`);
		}

		const html = await response.text();
		const Parser = this.document.defaultView?.DOMParser ?? (typeof DOMParser !== 'undefined' ? DOMParser : null);
		if (!Parser) {
			throw new Error('DOMParser is not available in this environment');
		}
		const doc = new Parser().parseFromString(html, 'text/html');

		return this.extractOldReddit(doc);
	}

	extract(): ExtractorResult {
		if (this.isOldReddit) {
			return this.extractOldReddit(this.document);
		}

		const postTitle = this.document.querySelector('h1')?.textContent?.trim() || '';
		const subreddit = this.getSubreddit();
		const postAuthor = this.getPostAuthor();
		const postContent = this.getPostContent();
		const description = this.createDescription(postContent);

		// Extract any comments already in the DOM (browser renders these via JS;
		// SSR/Node HTML won't have them, so comments will be empty there).
		const comments = this.options.includeReplies !== false ? this.extractComments() : '';
		const contentHtml = this.createContentHtml(postContent, comments);
		// If contentHtml is empty (link/image post with no body and no DOM comments),
		// parseAsync() will fall through to extractAsync() → old.reddit.com fetch.

		return {
			content: contentHtml,
			contentHtml: contentHtml,
			extractedContent: {
				postId: this.getPostId(),
				subreddit,
				postAuthor,
			},
			variables: {
				title: postTitle,
				author: postAuthor,
				site: `r/${subreddit}`,
				description,
			}
		};
	}

	private extractOldReddit(root: Document | Element): ExtractorResult {
		const thingLink = root.querySelector('.thing.link');
		const postTitle = thingLink?.querySelector('a.title')?.textContent?.trim() || '';
		const postAuthor = thingLink?.getAttribute('data-author') || '';
		const subreddit = thingLink?.getAttribute('data-subreddit') || '';
		const postBodyEl = thingLink?.querySelector('.usertext-body .md');
		const postBody = postBodyEl ? serializeHTML(postBodyEl) : '';

		let comments = '';
		if (this.options.includeReplies !== false) {
			const commentArea = root.querySelector('.commentarea .sitetable');
			const commentData = commentArea ? this.collectOldRedditComments(commentArea) : [];
			comments = commentData.length > 0 ? buildCommentTree(commentData) : '';
		}

		const contentHtml = this.createContentHtml(postBody, comments);
		const description = this.createDescription(postBody);

		return {
			content: contentHtml,
			contentHtml: contentHtml,
			extractedContent: {
				postId: this.getPostId(),
				subreddit,
				postAuthor,
			},
			variables: {
				title: postTitle,
				author: postAuthor,
				site: `r/${subreddit}`,
				description,
			}
		};
	}

	private getPostContent(): string {
		const textBodyEl = this.shredditPost?.querySelector('[slot="text-body"]');
		const textBody = textBodyEl ? serializeHTML(textBodyEl) : '';
		const mediaBody = this.shredditPost?.querySelector('#post-image')?.outerHTML || '';
		
		return textBody + mediaBody;
	}

	private createContentHtml(postContent: string, comments: string): string {
		return buildContentHtml('reddit', postContent, comments);
	}

	private extractComments(): string {
		const comments = Array.from(this.document.querySelectorAll('shreddit-comment'));
		return this.processComments(comments);
	}

	private getPostId(): string {
		const match = this.url.match(/comments\/([a-zA-Z0-9]+)/);
		return match?.[1] || '';
	}

	private getSubreddit(): string {
		const match = this.url.match(/\/r\/([^/]+)/);
		return match?.[1] || '';
	}

	private getPostAuthor(): string {
		return this.shredditPost?.getAttribute('author') || '';
	}

	private createDescription(postContent: string): string {
		if (!postContent) return '';

		const tempDiv = this.document.createElement('div');
		tempDiv.appendChild(parseHTML(this.document, postContent));
		return tempDiv.textContent?.trim()
			.slice(0, 140)
			.replace(/\s+/g, ' ') || '';
	}

	private collectOldRedditComments(container: Element, depth: number = 0): CommentData[] {
		const result: CommentData[] = [];
		const comments = Array.from(container.querySelectorAll(':scope > .thing.comment'));

		for (const comment of comments) {
			const author = comment.getAttribute('data-author') || '';
			const permalink = comment.getAttribute('data-permalink') || '';
			const score = comment.querySelector('.entry .tagline .score.unvoted')?.textContent?.trim() || '';
			const timeEl = comment.querySelector('.entry .tagline time[datetime]');
			const datetime = timeEl?.getAttribute('datetime') || '';
			const date = datetime ? new Date(datetime).toISOString().split('T')[0] : '';
			const bodyEl = comment.querySelector('.entry .usertext-body .md');
			const body = bodyEl ? serializeHTML(bodyEl) : '';

			result.push({
				author,
				date,
				content: body,
				depth,
				score: score || undefined,
				url: permalink ? `https://reddit.com${permalink}` : undefined,
			});

			const childContainer = comment.querySelector('.child > .sitetable');
			if (childContainer) {
				result.push(...this.collectOldRedditComments(childContainer, depth + 1));
			}
		}

		return result;
	}

	private processComments(comments: Element[]): string {
		const commentData: CommentData[] = [];

		for (const comment of comments) {
			const depth = parseInt(comment.getAttribute('depth') || '0');
			const author = comment.getAttribute('author') || '';
			const score = comment.getAttribute('score') || '0';
			const permalink = comment.getAttribute('permalink') || '';
			const commentEl = comment.querySelector('[slot="comment"]');
			const content = commentEl ? serializeHTML(commentEl) : '';

			const timestamp = comment.getAttribute('created')
				|| comment.querySelector('time')?.getAttribute('datetime')
				|| '';
			const date = timestamp ? new Date(timestamp).toISOString().split('T')[0] : '';

			commentData.push({
				author,
				date,
				content,
				depth,
				score: `${score} points`,
				url: permalink ? `https://reddit.com${permalink}` : undefined,
			});
		}

		return buildCommentTree(commentData);
	}
} 