import { BaseExtractor, ExtractorOptions } from './_base';
import { ExtractorResult } from '../types/extractors';
import { serializeHTML } from '../utils/dom';
import { buildCommentTree, buildContentHtml, type CommentData } from '../utils/comments';

export class DiscourseExtractor extends BaseExtractor {
	private isDiscourse: boolean;

	constructor(document: Document, url: string, schemaOrgData?: any, options?: ExtractorOptions) {
		super(document, url, schemaOrgData, options);
		const generator = document.querySelector('meta[name="generator"]')?.getAttribute('content') || '';
		this.isDiscourse = generator.startsWith('Discourse');
	}

	canExtract(): boolean {
		return this.isDiscourse && !!this.document.querySelector('.topic-post');
	}

	extract(): ExtractorResult {
		const title = this.getTopicTitle();
		const siteName = this.document.querySelector('meta[property="og:site_name"]')?.getAttribute('content') || '';
		const category = this.document.querySelector('.badge-category__name')?.textContent?.trim() || '';
		const tags = this.getTags();
		const published = this.getPublishedDate();

		const posts = Array.from(this.document.querySelectorAll('.topic-post'));
		const op = posts.find(p => p.classList.contains('topic-owner'));

		// OP content — may be absent on later pages
		const postContent = op ? this.extractPostContent(op) : '';
		const opAuthor = op ? this.getAuthor(op) : '';

		// Remaining posts are replies
		const replyPosts = posts.filter(p => p !== op);
		const comments = this.options.includeReplies !== false
			? this.extractComments(replyPosts)
			: '';

		const contentHtml = buildContentHtml('discourse', postContent, comments);
		const author = opAuthor || this.getAuthor(posts[0]);
		const description = op ? this.getPostText(op).slice(0, 140).replace(/\s+/g, ' ') : '';

		return {
			content: contentHtml,
			contentHtml,
			extractedContent: {
				topicId: this.document.querySelector('h1[data-topic-id]')?.getAttribute('data-topic-id') || '',
				category,
				tags: tags.join(', '),
			},
			variables: {
				title,
				author,
				site: siteName || 'Discourse',
				description,
				...(published && { published }),
			}
		};
	}

	private getTopicTitle(): string {
		const fancy = this.document.querySelector('.fancy-title');
		if (fancy) return fancy.textContent?.trim() || '';

		const h1 = this.document.querySelector('h1[data-topic-id]');
		if (h1) {
			const clone = h1.cloneNode(true) as Element;
			clone.querySelectorAll('svg, .topic-statuses').forEach(e => e.remove());
			return clone.textContent?.trim() || '';
		}

		return '';
	}

	private getTags(): string[] {
		return Array.from(this.document.querySelectorAll('a.discourse-tag'))
			.map(el => el.getAttribute('data-tag-name') || el.textContent?.trim() || '')
			.filter(t => t);
	}

	private getPublishedDate(): string {
		const meta = this.document.querySelector('meta[property="article:published_time"]');
		if (meta) {
			const content = meta.getAttribute('content') || '';
			try {
				return new Date(content).toISOString().split('T')[0];
			} catch { /* fall through */ }
		}
		return '';
	}

	private getAuthor(post: Element): string {
		const nameLink = post.querySelector('.names a[data-user-card]');
		return nameLink?.getAttribute('data-user-card') || nameLink?.textContent?.trim() || '';
	}

	private getPostDate(post: Element): string {
		const dateEl = post.querySelector('.relative-date[data-time]');
		if (!dateEl) return '';
		const time = parseInt(dateEl.getAttribute('data-time') || '0');
		if (!time) return '';
		try {
			return new Date(time).toISOString().split('T')[0];
		} catch {
			return '';
		}
	}

	private getPostPermalink(post: Element): string {
		const link = post.querySelector('a.post-date[href]');
		if (!link) return '';
		const href = link.getAttribute('href') || '';
		if (!href) return '';

		try {
			const base = new URL(this.url);
			return `${base.origin}${href}`;
		} catch {
			return href;
		}
	}

	private getLikeCount(post: Element): string {
		const btn = post.querySelector('button.like-count');
		const count = btn?.textContent?.trim() || '';
		return count ? `${count} likes` : '';
	}

	private getPostText(post: Element): string {
		const cooked = post.querySelector('.cooked');
		if (!cooked) return '';
		return cooked.textContent?.trim() || '';
	}

	private extractPostContent(post: Element): string {
		const cooked = post.querySelector('.cooked');
		if (!cooked) return '';

		const clone = cooked.cloneNode(true) as Element;

		// Remove selection barriers
		clone.querySelectorAll('.cooked-selection-barrier').forEach(e => e.remove());

		// Remove heading anchor links (visual noise)
		clone.querySelectorAll('a.anchor').forEach(a => a.remove());

		return serializeHTML(clone);
	}

	private extractComments(replyPosts: Element[]): string {
		if (replyPosts.length === 0) return '';

		const commentData: CommentData[] = replyPosts.map(post => {
			const author = this.getAuthor(post);
			const content = this.extractPostContent(post);
			const date = this.getPostDate(post);
			const url = this.getPostPermalink(post);
			const likes = this.getLikeCount(post);

			return {
				author,
				date,
				content,
				depth: 0,
				score: likes || undefined,
				url: url || undefined,
			};
		});

		return buildCommentTree(commentData);
	}
}
