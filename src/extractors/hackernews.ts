import { BaseExtractor } from './_base';
import { ExtractorResult } from '../types/extractors';

export class HackerNewsExtractor extends BaseExtractor {
	private mainPost: Element | null;
	private isCommentPage: boolean;
	private mainComment: Element | null;

	constructor(document: Document, url: string) {
		super(document, url);
		this.mainPost = document.querySelector('.fatitem');
		this.isCommentPage = this.detectCommentPage();
		this.mainComment = this.isCommentPage ? this.findMainComment() : null;
	}

	private detectCommentPage(): boolean {
		// Check if we're on a comment page by looking for a parent link in the navigation
		return !!this.mainPost?.querySelector('.navs a[href*="parent"]');
	}

	private findMainComment(): Element | null {
		// The main comment is the first comment in the fatitem
		const comment = this.mainPost?.querySelector('.comment');
		return comment || null;
	}

	canExtract(): boolean {
		return !!this.mainPost;
	}

	extract(): ExtractorResult {
		const postContent = this.getPostContent();
		const comments = this.extractComments();

		const contentHtml = this.createContentHtml(postContent, comments);
		const postTitle = this.getPostTitle();
		const postAuthor = this.getPostAuthor();
		const description = this.createDescription();
		const published = this.getPostDate();

		return {
			content: contentHtml,
			contentHtml: contentHtml,
			extractedContent: {
				postId: this.getPostId(),
				postAuthor,
			},
			variables: {
				title: postTitle,
				author: postAuthor,
				site: 'Hacker News',
				description,
				published,
			}
		};
	}

	private createContentHtml(postContent: string, comments: string): string {
		return `
			<div class="hackernews-post">
				<div class="post-content">
					${postContent}
				</div>
				${comments ? `
					<hr>
					<h2>Comments</h2>
					<div class="hackernews-comments">
						${comments}
					</div>
				` : ''}
			</div>
		`.trim();
	}

	private getPostContent(): string {
		if (!this.mainPost) return '';

		// If this is a comment page, use the comment as the main content
		if (this.isCommentPage && this.mainComment) {
			const author = this.mainComment.querySelector('.hnuser')?.textContent || '[deleted]';
			const commentText = this.mainComment.querySelector('.commtext')?.innerHTML || '';
			const timeElement = this.mainComment.querySelector('.age');
			const timestamp = timeElement?.getAttribute('title') || '';
			const date = timestamp.split('T')[0] || '';
			const points = this.mainComment.querySelector('.score')?.textContent?.trim() || '';
			const parentUrl = this.mainPost.querySelector('.navs a[href*="parent"]')?.getAttribute('href') || '';
			
			return `
				<div class="comment main-comment">
					<div class="comment-metadata">
						<span class="comment-author"><strong>${author}</strong></span> •
						<span class="comment-date">${date}</span>
						${points ? ` • <span class="comment-points">${points}</span>` : ''}
						${parentUrl ? ` • <a href="https://news.ycombinator.com/${parentUrl}" class="parent-link">parent</a>` : ''}
					</div>
					<div class="comment-content">${commentText}</div>
				</div>
			`.trim();
		}

		// Otherwise handle regular post content
		const titleRow = this.mainPost.querySelector('tr.athing');
		const subRow = titleRow?.nextElementSibling;
		const url = titleRow?.querySelector('.titleline a')?.getAttribute('href') || '';

		let content = '';
		if (url) {
			content += `<p><a href="${url}" target="_blank">${url}</a></p>`;
		}

		const text = this.mainPost.querySelector('.toptext');
		if (text) {
			content += `<div class="post-text">${text.innerHTML}</div>`;
		}

		return content;
	}

	private extractComments(): string {
		const comments = Array.from(this.document.querySelectorAll('tr.comtr'));
		return this.processComments(comments);
	}

	private processComments(comments: Element[]): string {
		let html = '';
		const processedIds = new Set<string>();
		let currentDepth = -1;
		let blockquoteStack: number[] = [];

		for (const comment of comments) {
			const id = comment.getAttribute('id');
			if (!id || processedIds.has(id)) continue;
			processedIds.add(id);

			const indent = comment.querySelector('.ind img')?.getAttribute('width') || '0';
			const depth = parseInt(indent) / 40;
			const commentText = comment.querySelector('.commtext');
			const author = comment.querySelector('.hnuser')?.textContent || '[deleted]';
			const timeElement = comment.querySelector('.age');
			const points = comment.querySelector('.score')?.textContent?.trim() || '';
			
			if (!commentText) continue;

			// Get the comment URL
			const commentUrl = `https://news.ycombinator.com/item?id=${id}`;
			
			// Get the timestamp from the title attribute and extract the date portion
			const timestamp = timeElement?.getAttribute('title') || '';
			const date = timestamp.split('T')[0] || '';
			
			// For top-level comments, close all previous blockquotes and start fresh
			if (depth === 0) {
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
		<a href="${commentUrl}" class="comment-link">${date}</a>
		${points ? ` • <span class="comment-points">${points}</span>` : ''}
	</div>
	<div class="comment-content">${commentText.innerHTML}</div>
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

	private getPostId(): string {
		const match = this.url.match(/id=(\d+)/);
		return match?.[1] || '';
	}

	private getPostTitle(): string {
		if (this.isCommentPage && this.mainComment) {
			const author = this.mainComment.querySelector('.hnuser')?.textContent || '[deleted]';
			const commentText = this.mainComment.querySelector('.commtext')?.textContent || '';
			// Use first 50 characters of comment as title
			const preview = commentText.trim().slice(0, 50) + (commentText.length > 50 ? '...' : '');
			return `Comment by ${author}: ${preview}`;
		}
		return this.mainPost?.querySelector('.titleline')?.textContent?.trim() || '';
	}

	private getPostAuthor(): string {
		return this.mainPost?.querySelector('.hnuser')?.textContent?.trim() || '';
	}

	private createDescription(): string {
		const title = this.getPostTitle();
		const author = this.getPostAuthor();
		if (this.isCommentPage) {
			return `Comment by ${author} on Hacker News`;
		}
		return `${title} - by ${author} on Hacker News`;
	}

	private getPostDate(): string {
		if (!this.mainPost) return '';
		
		const timeElement = this.mainPost.querySelector('.age');
		const timestamp = timeElement?.getAttribute('title') || '';
		return timestamp.split('T')[0] || '';
	}
} 