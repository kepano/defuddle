import { BaseExtractor, ExtractorOptions } from './_base';
import { ExtractorResult } from '../types/extractors';
import { escapeHtml } from '../utils/dom';
import { buildCommentTree, buildContentHtml, type CommentData } from '../utils/comments';

export class MastodonExtractor extends BaseExtractor {
	private mainPost: Element | null = null;
	private replyStatuses: Element[] = [];

	constructor(document: Document, url: string, schemaOrgData?: any, options?: ExtractorOptions) {
		super(document, url, schemaOrgData, options);

		this.mainPost = document.querySelector('.detailed-status__wrapper');

		const wrappers = Array.from(document.querySelectorAll('.status__wrapper'));
		this.replyStatuses = wrappers.filter(w => {
			return !!w.querySelector('.status[data-id]');
		});
	}

	canExtract(): boolean {
		if (!this.mainPost) return false;

		if (this.document.getElementById('mastodon')) return true;

		const initialState = this.document.querySelector('script#initial-state');
		if (initialState) {
			const text = initialState.textContent || '';
			if (text.includes('mastodon/mastodon') || text.includes('"mastodon"')) return true;
		}

		const links = Array.from(this.document.querySelectorAll('link[rel="stylesheet"]'));
		return links.some(link => (link.getAttribute('href') || '').includes('mastodon'));
	}

	extract(): ExtractorResult {
		const mainFullHandle = this.getFullHandle(this.mainPost!);
		const mainHandle = mainFullHandle.split('@')[0];
		const displayName = this.getDisplayName(this.mainPost!);

		// Classify replies: consecutive self-replies at the start form the thread
		const threadItems: Element[] = [];
		const replyItems: Element[] = [];
		let threadEnded = false;

		for (const status of this.replyStatuses) {
			const handle = this.getFullHandle(status).split('@')[0];
			if (!threadEnded && handle === mainHandle) {
				threadItems.push(status);
			} else {
				threadEnded = true;
				replyItems.push(status);
			}
		}

		const mainContent = this.extractPostContent(this.mainPost!);
		const threadParts = threadItems.map(item => this.extractPostContent(item));
		const allParts = [mainContent, ...threadParts].filter(Boolean);
		const postContent = allParts.join('\n<hr>\n');

		const comments = this.options.includeReplies !== false
			? this.extractComments(replyItems)
			: '';

		const contentHtml = buildContentHtml('mastodon', postContent, comments);
		const author = displayName || `@${mainFullHandle}`;
		const description = this.getDescription();
		const published = this.getPublishedDate();
		const siteName = this.document.querySelector('meta[property="og:site_name"]')?.getAttribute('content') || '';
		const title = this.postTitle(author, siteName || 'Mastodon');

		return {
			content: contentHtml,
			contentHtml,
			extractedContent: {
				postAuthor: mainFullHandle,
			},
			variables: {
				title,
				author,
				site: siteName || 'Mastodon',
				description,
				...(published && { published }),
			}
		};
	}

	private getFullHandle(container: Element): string {
		const account = container.querySelector('.display-name__account');
		const text = account?.textContent?.trim() || '';
		return text.replace(/^@/, '');
	}

	private getDisplayName(container: Element): string {
		const name = container.querySelector('.display-name__html');
		if (!name) return '';
		const clone = name.cloneNode(true) as Element;
		this.replaceEmojiImages(clone);
		return clone.textContent?.trim() || '';
	}

	private getReplyDate(wrapper: Element): string {
		const time = wrapper.querySelector('time[datetime]');
		if (!time) return '';
		const datetime = time.getAttribute('datetime') || '';
		try {
			return new Date(datetime).toISOString().split('T')[0];
		} catch { return ''; }
	}

	private getReplyPermalink(wrapper: Element): string {
		const link = wrapper.querySelector('a.status__relative-time[href]');
		if (!link) return '';
		const href = link.getAttribute('href') || '';
		if (!href) return '';

		try {
			const base = new URL(this.url);
			return href.startsWith('http') ? href : `${base.origin}${href}`;
		} catch {
			return href;
		}
	}

	private getPublishedDate(): string {
		const meta = this.document.querySelector('meta[property="og:published_time"]');
		if (meta) {
			const content = meta.getAttribute('content') || '';
			try {
				return new Date(content).toISOString().split('T')[0];
			} catch { /* fall through */ }
		}

		if (this.mainPost) {
			const time = this.mainPost.querySelector('time[datetime]');
			if (time) {
				try {
					return new Date(time.getAttribute('datetime') || '').toISOString().split('T')[0];
				} catch { /* fall through */ }
			}
		}

		return '';
	}

	private getDescription(): string {
		if (!this.mainPost) return '';
		const textEl = this.mainPost.querySelector('.status__content__text');
		if (!textEl) return '';
		return (textEl.textContent || '')
			.trim()
			.slice(0, 140)
			.replace(/\s+/g, ' ');
	}

	private extractPostContent(container: Element): string {
		const parts: string[] = [];

		const text = this.extractTextContent(container.querySelector('.status__content'));
		if (text) parts.push(text);

		const images = this.extractImages(container);
		if (images) parts.push(images);

		const card = this.extractLinkCard(container);
		if (card) parts.push(card);

		return parts.join('\n');
	}

	private extractTextContent(contentEl: Element | null): string {
		if (!contentEl) return '';

		const textEl = contentEl.querySelector('.status__content__text');
		if (!textEl) return '';

		const clone = textEl.cloneNode(true) as Element;

		this.replaceEmojiImages(clone);

		// Mastodon uses invisible spans to hide parts of displayed URLs
		clone.querySelectorAll('span.invisible').forEach(el => el.remove());

		// Unwrap remaining spans (ellipsis, mention wrappers, etc.)
		clone.querySelectorAll('span').forEach(el => {
			el.replaceWith(...Array.from(el.childNodes));
		});

		return (clone.innerHTML || clone.textContent || '').trim();
	}

	/** Replace emoji `<img>` tags with their alt text (Unicode emoji or :shortcode:). */
	private replaceEmojiImages(container: Element): void {
		container.querySelectorAll('img.emojione').forEach(img => {
			const alt = img.getAttribute('alt') || '';
			if (alt) {
				img.replaceWith(img.ownerDocument.createTextNode(alt));
			} else {
				img.remove();
			}
		});
	}

	private extractImages(container: Element): string {
		const gallery = container.querySelector('.media-gallery');
		if (!gallery) return '';

		const images: string[] = [];
		gallery.querySelectorAll('.media-gallery__item-thumbnail').forEach(link => {
			const href = link.getAttribute('href') || '';
			const img = link.querySelector('img');
			const alt = img?.getAttribute('alt') || '';

			if (href) {
				images.push(`<img src="${escapeHtml(href)}" alt="${escapeHtml(alt)}" />`);
			}
		});

		return images.join('\n');
	}

	private extractLinkCard(container: Element): string {
		const card = container.querySelector('a.status-card[href]');
		if (!card) return '';

		const href = card.getAttribute('href') || '';
		const title = card.querySelector('.status-card__title')?.textContent?.trim() || '';
		const description = card.querySelector('.status-card__description')?.textContent?.trim() || '';
		const img = card.querySelector('.status-card__image-image');

		if (!title && !href) return '';

		let html = '';
		if (img) {
			const src = img.getAttribute('src') || '';
			if (src) {
				html += `<a href="${escapeHtml(href)}"><img src="${escapeHtml(src)}" alt="${escapeHtml(title)}" /></a>\n`;
			}
		}
		html += `<p><a href="${escapeHtml(href)}">${escapeHtml(title || href)}</a></p>`;
		if (description) {
			html += `\n<p>${escapeHtml(description)}</p>`;
		}

		return html;
	}

	private extractComments(replyItems: Element[]): string {
		if (replyItems.length === 0) return '';

		let currentDepth = 0;

		const commentData: CommentData[] = replyItems.map((wrapper, index) => {
			const handle = this.getFullHandle(wrapper);
			const displayName = this.getDisplayName(wrapper);
			const content = this.extractPostContent(wrapper);
			const date = this.getReplyDate(wrapper);
			const permalink = this.getReplyPermalink(wrapper);

			// status--first-in-thread = new top-level reply (depth 0)
			// otherwise = sub-reply (increment depth)
			const statusEl = wrapper.querySelector('.status--first-in-thread');
			if (statusEl || index === 0) {
				currentDepth = 0;
			} else {
				currentDepth++;
			}

			return {
				author: displayName ? `${displayName} @${handle}` : `@${handle}`,
				date,
				content,
				depth: currentDepth,
				url: permalink || undefined,
			};
		});

		return buildCommentTree(commentData);
	}
}
