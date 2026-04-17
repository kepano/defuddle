import { BaseExtractor, ExtractorOptions } from './_base';
import { ExtractorResult } from '../types/extractors';
import { escapeHtml } from '../utils/dom';
import { buildCommentTree, buildContentHtml, buildQuotedPost, type CommentData } from '../utils/comments';

export class BlueskyExtractor extends BaseExtractor {
	private threadScreen: Element | null;
	private postItems: Element[] = [];

	constructor(document: Document, url: string, schemaOrgData?: any, options?: ExtractorOptions) {
		super(document, url, schemaOrgData, options);
		this.threadScreen = document.querySelector('[data-testid="postThreadScreen"]');
		if (this.threadScreen) {
			this.postItems = Array.from(
				this.threadScreen.querySelectorAll('[data-testid^="postThreadItem-by-"]')
			);
		}
	}

	canExtract(): boolean {
		return this.postItems.length > 0;
	}

	extract(): ExtractorResult {
		const mainHandle = this.getHandle(this.postItems[0]);

		// Classify posts: consecutive posts by the main author form the thread,
		// everything after the first post by a different person is a reply.
		const threadItems: Element[] = [];
		const replyItems: Element[] = [];
		let threadEnded = false;

		for (const item of this.postItems) {
			const handle = this.getHandle(item);
			if (!threadEnded && handle === mainHandle) {
				threadItems.push(item);
			} else {
				threadEnded = true;
				replyItems.push(item);
			}
		}

		const postParts = threadItems.map(item => this.extractPostContent(item));
		const postContent = postParts.join('\n<hr>\n');

		const comments = this.options.includeReplies !== false
			? this.extractComments(replyItems)
			: '';

		const contentHtml = buildContentHtml('bluesky', postContent, comments);
		const author = `@${mainHandle}`;
		const displayName = this.getDisplayName(this.postItems[0]);
		const description = this.createDescription(this.postItems[0]);
		const published = this.getPublishedDate();
		const title = this.postTitle(displayName || author, 'Bluesky');

		return {
			content: contentHtml,
			contentHtml,
			extractedContent: {
				postAuthor: mainHandle,
			},
			variables: {
				title,
				author: displayName || author,
				site: 'Bluesky',
				description,
				...(published && { published }),
			}
		};
	}

	private extractComments(replyItems: Element[]): string {
		if (replyItems.length === 0) return '';

		let currentDepth = 0;
		const commentData: CommentData[] = replyItems.map(item => {
			const handle = this.getHandle(item);
			const displayName = this.getDisplayName(item);
			const content = this.extractPostContent(item);
			const date = this.getReplyDate(item);
			const permalink = this.getPermalink(item);

			// Thread connector line in the top spacer area indicates this
			// post is a reply to the one above it (increment depth).
			// No connector = new top-level reply (reset to 0).
			if (this.hasTopConnector(item)) {
				currentDepth++;
			} else {
				currentDepth = 0;
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

	private hasTopConnector(item: Element): boolean {
		// The first child of a reply is the connector area (height: 12px).
		// If it contains a 2px-wide div with a background-color, there's a
		// thread line connecting this post to the one above.
		const connector = item.children[0];
		if (!connector) return false;
		const divs = connector.querySelectorAll('div');
		for (const div of Array.from(divs)) {
			const style = div.getAttribute('style') || '';
			if (style.includes('width: 2px') && style.includes('background-color')) {
				return true;
			}
		}
		return false;
	}

	private getHandle(item: Element): string {
		const testId = item.getAttribute('data-testid') || '';
		const match = testId.match(/^postThreadItem-by-(.+)$/);
		return match ? match[1] : '';
	}

	private getDisplayName(item: Element): string {
		// Root post: avatar link has aria-label="{name}'s avatar"
		const avatarLink = item.querySelector('a[aria-label*="avatar"]');
		if (avatarLink) {
			const label = avatarLink.getAttribute('aria-label') || '';
			const match = label.match(/^(.+)'s avatar$/);
			if (match) return match[1];
		}

		// Reply posts: first link to profile with text content
		const profileLinks = item.querySelectorAll('a[href^="/profile/"]');
		for (const link of Array.from(profileLinks)) {
			const text = link.textContent?.trim() || '';
			if (text && !text.startsWith('@') && !text.includes('avatar') && !text.includes('·')) {
				return text;
			}
		}

		return '';
	}

	private getPublishedDate(): string {
		// Try twitter:value1 meta tag first (ISO date for root post)
		const metaTag = this.document.querySelector('meta[name="twitter:value1"]');
		if (metaTag) {
			const datetime = metaTag.getAttribute('content') || '';
			try {
				return new Date(datetime).toISOString().split('T')[0];
			} catch { /* fall through */ }
		}
		return '';
	}

	private getReplyDate(item: Element): string {
		const timeLink = item.querySelector('a[href*="/post/"]');
		if (!timeLink) return '';

		// aria-label format: "March 27, 2026 at 8:35 AM"
		const label = timeLink.getAttribute('aria-label') || '';
		if (!label) return '';

		try {
			// Remove " at " so Date can parse "March 27, 2026 8:35 AM"
			const parsed = new Date(label.replace(' at ', ' '));
			if (!isNaN(parsed.getTime())) {
				return parsed.toISOString().split('T')[0];
			}
		} catch { /* fall through */ }

		return '';
	}

	private getPermalink(item: Element): string {
		const link = item.querySelector('a[href*="/post/"]');
		if (!link) return '';
		const href = link.getAttribute('href') || '';
		return href.startsWith('http') ? href : `https://bsky.app${href}`;
	}

	private extractPostContent(item: Element): string {
		const parts: string[] = [];

		// Extract text from data-word-wrap div
		const textDiv = item.querySelector('div[data-word-wrap="1"]');
		if (textDiv) {
			const text = this.cleanText(textDiv);
			if (text) parts.push(text);
		}

		// Extract images
		const images = this.extractImages(item);
		if (images) parts.push(images);

		// Extract link card
		const card = this.extractLinkCard(item);
		if (card) parts.push(card);

		// Extract quoted post
		const quoted = this.extractQuotedPost(item);
		if (quoted) parts.push(quoted);

		return parts.join('\n');
	}

	private cleanText(textDiv: Element): string {
		const clone = textDiv.cloneNode(true) as Element;

		// Clean up mention links: convert DID-based hrefs to readable URLs
		clone.querySelectorAll('a[href*="/profile/"]').forEach(link => {
			const text = link.textContent?.trim() || '';
			const href = link.getAttribute('href') || '';
			if (text.startsWith('@')) {
				const handle = text.slice(1);
				const cleanLink = clone.ownerDocument.createElement('a');
				cleanLink.setAttribute('href', `https://bsky.app/profile/${handle}`);
				cleanLink.textContent = text;
				link.replaceWith(cleanLink);
			} else if (href.startsWith('/profile/')) {
				link.setAttribute('href', `https://bsky.app${href}`);
			}
		});

		// Clean external links: ensure absolute URLs
		clone.querySelectorAll('a[href^="http"]').forEach(link => {
			// Strip obfuscated classes but keep href and text
			const href = link.getAttribute('href') || '';
			const text = link.textContent?.trim() || '';
			const cleanLink = clone.ownerDocument.createElement('a');
			cleanLink.setAttribute('href', href);
			cleanLink.textContent = text;
			link.replaceWith(cleanLink);
		});

		// Unwrap all spans and divs (keep content)
		clone.querySelectorAll('span, div').forEach(el => {
			el.replaceWith(...Array.from(el.childNodes));
		});

		// Remove Unicode bidi markers that Bluesky adds around handles
		let html = (clone.innerHTML || clone.textContent || '').trim();
		html = html.replace(/[\u200E\u200F\u200B]/g, '');
		// Collapse whitespace but preserve newlines for paragraph splitting
		html = html.replace(/[^\S\n]+/g, ' ').trim();

		if (!html) return '';

		// Split on newlines for paragraphs
		const paragraphs = html.split(/\n+/)
			.map(p => p.trim())
			.filter(p => p);

		return paragraphs.map(p => `<p>${p}</p>`).join('\n');
	}

	private extractImages(item: Element): string {
		const images: string[] = [];

		// Content images use feed_thumbnail/feed_fullsize CDN paths.
		// Avatar images use avatar_thumbnail — skip those.
		item.querySelectorAll('img[src*="/feed_thumbnail/"], img[src*="/feed_fullsize/"]').forEach(img => {
			const src = img.getAttribute('src') || '';
			if (!src) return;
			const fullSrc = src.replace('/feed_thumbnail/', '/feed_fullsize/');
			images.push(`<img src="${escapeHtml(fullSrc)}" alt="" />`);
		});

		return images.join('\n');
	}

	private extractLinkCard(item: Element): string {
		// Link cards are <a> elements with an aria-label (the title) containing
		// a bordered container with image + title + domain
		const links = item.querySelectorAll('a[aria-label][href^="http"]');
		for (const link of Array.from(links)) {
			// Skip if this is a simple inline link (no bordered container)
			const hasBorder = link.querySelector('div[style*="border"]');
			if (!hasBorder) continue;

			const href = link.getAttribute('href') || '';
			const title = link.getAttribute('aria-label') || '';
			const img = link.querySelector('img');

			if (title) {
				let html = '';
				if (img) {
					const src = img.getAttribute('src') || '';
					html += `<a href="${escapeHtml(href)}"><img src="${escapeHtml(src)}" alt="${escapeHtml(title)}" /></a>\n`;
				}
				html += `<p><a href="${escapeHtml(href)}">${escapeHtml(title)}</a></p>`;
				return html;
			}
		}

		return '';
	}

	private extractQuotedPost(item: Element): string {
		// Quoted posts appear as embedded post cards — look for a nested
		// postThreadItem or a container with profile links and post text
		// that isn't the item's own content
		const embeds = item.querySelectorAll('[data-testid^="postThreadItem-by-"]');
		for (const embed of Array.from(embeds)) {
			if (embed === item) continue;

			const handle = this.getHandle(embed);
			const displayName = this.getDisplayName(embed);
			const textDiv = embed.querySelector('div[data-word-wrap="1"]');
			const text = textDiv ? this.cleanText(textDiv) : '';

			return buildQuotedPost({
				author: displayName ? `${displayName} @${handle}` : `@${handle}`,
				content: text,
			});
		}

		return '';
	}

	private createDescription(item: Element): string {
		const textDiv = item.querySelector('div[data-word-wrap="1"]');
		if (!textDiv) return '';
		return (textDiv.textContent || '')
			.replace(/[\u200E\u200F\u200B]/g, '')
			.trim()
			.slice(0, 140)
			.replace(/\s+/g, ' ');
	}
}
