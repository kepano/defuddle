import { BaseExtractor } from './_base';
import { ExtractorResult } from '../types/extractors';

export class RedditExtractor extends BaseExtractor {
	private shredditPost: Element | null;

	constructor(document: Document, url: string) {
		super(document, url);
		this.shredditPost = document.querySelector('shreddit-post');
	}

	canExtract(): boolean {
		return !!this.shredditPost;
	}

	extract(): ExtractorResult {
		const postContent = this.getPostContent();
		const comments = this.extractComments();

		const contentHtml = this.createContentHtml(postContent, comments);
		const postTitle = this.document.querySelector('h1')?.textContent?.trim() || '';
		const subreddit = this.getSubreddit();
		const postAuthor = this.getPostAuthor();
		const description = this.createDescription(postContent);

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
		const textBody = this.shredditPost?.querySelector('[slot="text-body"]')?.innerHTML || '';
		const mediaBody = this.shredditPost?.querySelector('#post-image')?.outerHTML || '';
		
		return textBody + mediaBody;
	}

	private createContentHtml(postContent: string, comments: string): string {
		return `
			<div class="reddit-post">
				<div class="post-content">
					${postContent}
				</div>
			</div>
			${comments ? `
				<hr>
				<h2>Comments</h2>
				<div class="reddit-comments">
					${comments}
				</div>
			` : ''}
		`.trim();
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
		tempDiv.innerHTML = postContent;
		return tempDiv.textContent?.trim()
			.slice(0, 140)
			.replace(/\s+/g, ' ') || '';
	}

	private processComments(comments: Element[]): string {
		let html = '';
		let currentDepth = -1;
		let blockquoteStack: number[] = []; // Keep track of open blockquotes at each depth

		for (const comment of comments) {
			const depth = parseInt(comment.getAttribute('depth') || '0');
			const author = comment.getAttribute('author') || '';
			const score = comment.getAttribute('score') || '0';
			const permalink = comment.getAttribute('permalink') || '';
			const content = comment.querySelector('[slot="comment"]')?.innerHTML || '';
			
			// Get timestamp from faceplate-timeago element
			const timeElement = comment.querySelector('faceplate-timeago');
			const timestamp = timeElement?.getAttribute('ts') || '';
			const date = timestamp ? new Date(timestamp).toISOString().split('T')[0] : '';
			
			// For top-level comments, close all previous blockquotes and start fresh
			if (depth === 0) {
				// Close all open blockquotes
				while (blockquoteStack.length > 0) {
					html += '</blockquote>';
					blockquoteStack.pop();
				}
				html += '<blockquote>';
				blockquoteStack = [0];
				currentDepth = 0;
			}
			// For nested comments
			else {
				// If we're moving back up the tree
				if (depth < currentDepth) {
					// Close blockquotes until we reach the current depth
					while (blockquoteStack.length > 0 && blockquoteStack[blockquoteStack.length - 1] >= depth) {
						html += '</blockquote>';
						blockquoteStack.pop();
					}
				}
				// If we're going deeper
				else if (depth > currentDepth) {
					html += '<blockquote>';
					blockquoteStack.push(depth);
				}
				// If we're at the same depth, no need to close or open blockquotes
			}

			html += `<div class="comment">
	<div class="comment-metadata">
		<span class="comment-author"><strong>${author}</strong></span> •
		<a href="https://reddit.com${permalink}" class="comment-link">${score} points</a> •
		<span class="comment-date">${date}</span>
	</div>
	<div class="comment-content">${content}</div>
</div>`;

			currentDepth = depth;
		}

		// Close any remaining blockquotes
		while (blockquoteStack.length > 0) {
			html += '</blockquote>';
			blockquoteStack.pop();
		}

		return html;
	}
} 