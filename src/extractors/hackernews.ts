import { BaseExtractor } from './_base';
import { ExtractorResult } from '../types/extractors';
import { serializeHTML } from '../utils/dom';
import { buildComment, buildCommentTree, buildContentHtml, CommentData } from '../utils/comments';

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
		// Comment pages have an "on: <story title>" link but no story title row
		return !!this.mainPost?.querySelector('.onstory') && !this.mainPost?.querySelector('.titleline');
	}

	private findMainComment(): Element | null {
		// Use the tr.athing row which contains both the comment metadata (.comhead)
		// and the comment text (.commtext). The .comment div alone doesn't include
		// the author (.hnuser) or timestamp (.age) which are in the sibling .comhead.
		return this.mainPost?.querySelector('tr.athing') || null;
	}

	canExtract(): boolean {
		return !!this.mainPost;
	}

	extract(): ExtractorResult {
		const postContent = this.getPostContent();
		const comments = this.options.includeReplies !== false ? this.extractComments() : '';

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
		return buildContentHtml('hackernews', postContent, comments);
	}

	private getPostContent(): string {
		if (!this.mainPost) return '';

		// If this is a comment page, use the comment as the main content
		if (this.isCommentPage && this.mainComment) {
			const author = this.mainComment.querySelector('.hnuser')?.textContent || '[deleted]';
			const commtext = this.mainComment.querySelector('.commtext');
			const commentText = commtext ? serializeHTML(commtext) : '';
			const timeElement = this.mainComment.querySelector('.age');
			const timestamp = timeElement?.getAttribute('title') || '';
			const date = timestamp.split('T')[0] || '';
			const points = this.mainComment.querySelector('.score')?.textContent?.trim() || '';

			return buildComment({
				author,
				date,
				content: commentText,
				score: points || undefined,
			});
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
			content += `<div class="post-text">${serializeHTML(text)}</div>`;
		}

		return content;
	}

	private extractComments(): string {
		const comments = Array.from(this.document.querySelectorAll('tr.comtr'));
		return this.processComments(comments);
	}

	private processComments(comments: Element[]): string {
		const commentData: CommentData[] = [];
		const processedIds = new Set<string>();

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

			const commentUrl = `https://news.ycombinator.com/item?id=${id}`;
			const timestamp = timeElement?.getAttribute('title') || '';
			const date = timestamp.split('T')[0] || '';

			commentData.push({
				author,
				date,
				content: serializeHTML(commentText),
				depth,
				score: points || undefined,
				url: commentUrl,
			});
		}

		return buildCommentTree(commentData);
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