import { BaseExtractor, ExtractorOptions } from './_base';
import { ExtractorResult } from '../types/extractors';
import { escapeHtml } from '../utils/dom';
import { buildCommentTree, buildContentHtml, buildQuotedPost, type CommentData } from '../utils/comments';

interface ThreadsPost {
	username: string;
	date: string;
	permalink: string;
	content: string;
	element: Element;
}

export class ThreadsExtractor extends BaseExtractor {
	private pagelets: Element[] = [];
	private regionContainer: Element | null = null;

	constructor(document: Document, url: string, schemaOrgData?: any, options?: ExtractorOptions) {
		super(document, url, schemaOrgData, options);

		const all = Array.from(document.querySelectorAll('[data-pagelet^="threads_post_page_"]'));
		this.pagelets = all.filter(p => p.querySelector('a[href^="/@"], time[datetime]'));

		// Fallback for server-rendered HTML (no pagelets, but has a region
		// with Threads post content — identified by /@username links)
		if (this.pagelets.length === 0) {
			const region = document.querySelector('div[role="region"]');
			if (region?.querySelector('a[href^="/@"]')) {
				this.regionContainer = region;
			}
		}
	}

	canExtract(): boolean {
		return this.pagelets.length > 0 || !!this.regionContainer;
	}

	extract(): ExtractorResult {
		// Fallback: server-rendered HTML without pagelets
		if (this.pagelets.length === 0 && this.regionContainer) {
			return this.extractFromRegion(this.regionContainer);
		}

		const mainAuthor = this.getUsername(this.pagelets[0]);

		// Classify pagelets into thread posts (by main author) and replies.
		// Parse each pagelet once and cache the results.
		const threadPosts: ThreadsPost[] = [];
		const replyPosts: ThreadsPost[][] = [];
		let threadEnded = false;

		for (const pagelet of this.pagelets) {
			const posts = this.getPostsFromPagelet(pagelet);
			if (posts.length === 0) continue;

			if (!threadEnded && posts[0].username === mainAuthor && posts.length === 1) {
				threadPosts.push(posts[0]);
			} else {
				threadEnded = true;
				replyPosts.push(posts);
			}
		}

		const postContent = threadPosts.map(p => p.content).join('\n<hr>\n');

		const comments = this.options.includeReplies !== false
			? this.extractComments(replyPosts)
			: '';

		const contentHtml = buildContentHtml('threads', postContent, comments);
		const author = `@${mainAuthor}`;
		const description = this.createDescription(threadPosts[0]?.element);
		const title = this.postTitle(author, 'Threads');
		const published = threadPosts[0]?.date || '';

		return {
			content: contentHtml,
			contentHtml,
			extractedContent: {
				postAuthor: mainAuthor,
			},
			variables: {
				title,
				author,
				site: 'Threads',
				description,
				...(published && { published }),
			}
		};
	}

	/**
	 * Extract from server-rendered HTML where the post content is inside
	 * a div[role="region"] without pagelet wrappers.
	 */
	private extractFromRegion(region: Element): ExtractorResult {
		const mainAuthor = this.getUsername(region);
		if (!mainAuthor) return { content: '', contentHtml: '' };
		const author = `@${mainAuthor}`;

		const postContent = this.extractPostContent(region);

		// Extract replies from embedded JSON data
		const comments = this.options.includeReplies !== false
			? this.extractCommentsFromJson(mainAuthor)
			: '';

		const contentHtml = buildContentHtml('threads', postContent, comments);
		const description = this.createDescription(region);
		const date = this.getDate(region);

		return {
			content: contentHtml,
			contentHtml,
			extractedContent: {
				postAuthor: mainAuthor,
			},
			variables: {
				title: this.postTitle(author, 'Threads'),
				author,
				site: 'Threads',
				description,
				...(date && { published: date }),
			}
		};
	}

	/**
	 * Extract reply data from React hydration JSON scripts.
	 * Server-rendered Threads pages embed post data in script[type="application/json"].
	 */
	private extractCommentsFromJson(mainAuthor: string): string {
		const scripts = this.document.querySelectorAll('script[type="application/json"]');

		// Replies can be spread across multiple JSON scripts.
		// Parse all scripts that contain reply data and merge results.
		const allPosts: { username: string; text: string }[] = [];
		const seen = new Set<string>();

		for (const script of Array.from(scripts)) {
			const raw = script.textContent || '';
			if ((raw.match(/"text_fragments"/g) || []).length < 2) continue;
			if (!raw.includes('"username"')) continue;

			try {
				const data = JSON.parse(raw);
				for (const post of this.findPostsInJson(data, 0)) {
					// Deduplicate by text content
					const key = post.username + ':' + post.text.slice(0, 80);
					if (seen.has(key)) continue;
					seen.add(key);
					allPosts.push(post);
				}
			} catch { /* skip unparseable scripts */ }
		}

		if (allPosts.length < 2) return '';

		// First entry by the main author is the post itself — skip it
		const commentData: CommentData[] = [];
		let isFirstByMainAuthor = true;
		for (const post of allPosts) {
			if (isFirstByMainAuthor && post.username === mainAuthor) {
				isFirstByMainAuthor = false;
				continue;
			}
			commentData.push({
				author: `@${post.username}`,
				date: '',
				content: `<p>${escapeHtml(post.text)}</p>`,
				depth: 0,
			});
		}

		return commentData.length > 0 ? buildCommentTree(commentData) : '';
	}

	private findPostsInJson(obj: any, depth: number, results: { username: string; text: string }[] = []): { username: string; text: string }[] {
		if (depth > 35 || obj == null || typeof obj !== 'object') return results;

		if (obj.user?.username && typeof obj.user.username === 'string') {
			const text = this.extractTextFromJson(obj, 0);
			if (text) {
				results.push({ username: obj.user.username, text });
			}
		}

		for (const key of Object.keys(obj)) {
			if (key === 'quoted_post') continue;
			this.findPostsInJson(obj[key], depth + 1, results);
		}

		return results;
	}

	private extractTextFromJson(obj: any, depth: number): string | null {
		if (depth > 10 || obj == null || typeof obj !== 'object') return null;
		if (obj.text_fragments?.fragments) {
			return obj.text_fragments.fragments
				.map((f: any) => {
					if (f.plaintext) return f.plaintext;
					if (f.mention_fragment?.username) return `@${f.mention_fragment.username}`;
					if (f.linkified_web_url) return f.linkified_web_url;
					return '';
				})
				.join('');
		}
		for (const key of Object.keys(obj)) {
			if (key === 'quoted_post') continue;
			const result = this.extractTextFromJson(obj[key], depth + 1);
			if (result) return result;
		}
		return null;
	}

	private getPostsFromPagelet(pagelet: Element): ThreadsPost[] {
		const containers = pagelet.querySelectorAll('[data-pressable-container]');
		const posts: ThreadsPost[] = [];

		for (const container of Array.from(containers)) {
			// Skip nested quoted posts (pressable inside another pressable)
			if (container.parentElement?.closest('[data-pressable-container]')) {
				continue;
			}

			const username = this.getUsername(container);
			if (!username) continue;

			posts.push({
				username,
				date: this.getDate(container),
				permalink: this.getPermalink(container),
				content: this.extractPostContent(container),
				element: container,
			});
		}

		return posts;
	}

	private extractComments(replyPosts: ThreadsPost[][]): string {
		const commentData: CommentData[] = [];

		for (const posts of replyPosts) {
			// Single post = top-level reply (depth 0)
			// Multiple posts = linear reply chain (depth 0, 1, 2, ...)
			for (let i = 0; i < posts.length; i++) {
				commentData.push(this.toCommentData(posts[i], posts.length === 1 ? 0 : i));
			}
		}

		return commentData.length > 0 ? buildCommentTree(commentData) : '';
	}

	private toCommentData(post: ThreadsPost, depth: number): CommentData {
		return {
			author: `@${post.username}`,
			date: post.date,
			content: post.content,
			depth,
			url: post.permalink || undefined,
		};
	}

	private getUsername(container: Element): string {
		const links = container.querySelectorAll('a[href^="/@"][role="link"]');
		for (const link of Array.from(links)) {
			const text = link.textContent?.trim();
			if (text && !text.includes('profile picture')) {
				return text;
			}
		}

		// Fallback: extract from href
		const firstLink = container.querySelector('a[href^="/@"]');
		if (firstLink) {
			const match = firstLink.getAttribute('href')?.match(/\/@([^/]+)/);
			return match ? match[1] : '';
		}

		return '';
	}

	private getDate(container: Element): string {
		const timeEl = container.querySelector('time[datetime]');
		if (!timeEl) return '';
		const datetime = timeEl.getAttribute('datetime') || '';
		try {
			return new Date(datetime).toISOString().split('T')[0];
		} catch {
			return '';
		}
	}

	private getPermalink(container: Element): string {
		const timeLink = container.querySelector('a[href*="/post/"]');
		if (!timeLink) return '';
		const href = timeLink.getAttribute('href') || '';
		return href.startsWith('http') ? href : `https://www.threads.com${href}`;
	}

	private extractPostContent(container: Element): string {
		const parts: string[] = [];

		const allSpans = Array.from(container.querySelectorAll('span[dir="auto"]'));

		for (const span of allSpans) {
			if (span.closest('a[href^="/@"], a[href*="/post/"], a[href*="l.threads.com"], time')) continue;
			if (span.closest('[role="button"]')) continue;

			const text = span.textContent?.trim() || '';
			if (!text || text === 'Author' || text === '·' || text === 'Top' || text === 'View activity') continue;
			if (/^\d{2}\/\d{2}\/\d{2}$/.test(text) || /^@?\w+\/post\/\w+$/.test(text)) continue;

			const cleaned = this.stripThreadNumber(text);
			if (!cleaned) continue;

			const cleanedHtml = this.cleanText(span);
			if (cleanedHtml) parts.push(`<p>${cleanedHtml}</p>`);
		}

		const images = this.extractImages(container);
		if (images) parts.push(images);

		const card = this.extractLinkCard(container);
		if (card) parts.push(card);

		const quoted = this.extractQuotedPost(container);
		if (quoted) parts.push(quoted);

		return parts.join('\n');
	}

	private cleanText(span: Element): string {
		const clone = span.cloneNode(true) as Element;

		this.removeThreadNumbers(clone);

		clone.querySelectorAll('a').forEach(link => {
			const href = link.getAttribute('href') || '';
			const text = link.textContent?.trim() || '';

			// Remove post permalink links entirely
			if (href.match(/\/@[\w.]+\/post\//)) {
				link.remove();
				return;
			}

			const cleanLink = clone.ownerDocument.createElement('a');

			if (href.includes('l.threads.com')) {
				cleanLink.setAttribute('href', this.unwrapRedirectUrl(href));
			} else if (href.startsWith('/@')) {
				const username = href.replace(/^\/@/, '');
				cleanLink.setAttribute('href', `https://www.threads.com/@${username}`);
				cleanLink.textContent = `@${username}`;
				link.replaceWith(cleanLink);
				return;
			} else {
				cleanLink.setAttribute('href', href.startsWith('http') ? href : `https://www.threads.com${href}`);
			}

			cleanLink.textContent = text;
			link.replaceWith(cleanLink);
		});

		clone.querySelectorAll('span, div').forEach(el => {
			el.replaceWith(...Array.from(el.childNodes));
		});

		let html = (clone.innerHTML || clone.textContent || '').trim();
		html = html.replace(/<!--.*?-->/g, '');
		html = html.replace(/\s+/g, ' ').trim();

		return html || '';
	}

	private stripThreadNumber(text: string): string {
		return text.replace(/\s*\d+\s*\/\s*\d+\s*$/, '').trim();
	}

	private removeThreadNumbers(container: Element): void {
		// Thread numbers are structured as separate spans in a div (e.g. "1" "/" "2").
		// Match divs whose full text is a fraction like "1/2".
		const divs = Array.from(container.querySelectorAll('div'));
		for (const div of divs) {
			const text = div.textContent?.trim() || '';
			if (/^\d+\/\d+$/.test(text) && div.querySelectorAll('span').length >= 2) {
				div.remove();
			}
		}
	}

	private unwrapRedirectUrl(href: string): string {
		try {
			const url = new URL(href);
			const actual = url.searchParams.get('u');
			return actual ? decodeURIComponent(actual) : href;
		} catch {
			return href;
		}
	}

	private extractImages(container: Element): string {
		const images: string[] = [];

		container.querySelectorAll('img').forEach(img => {
			const alt = img.getAttribute('alt') || '';
			const src = img.getAttribute('src') || '';
			if (alt.includes('profile picture') || !src) return;
			if (img.closest('a[href*="l.threads.com"]')) return;
			const width = parseInt(img.getAttribute('width') || '0');
			if (width > 0 && width <= 48) return;

			images.push(`<img src="${escapeHtml(src)}" alt="${escapeHtml(alt)}" />`);
		});

		return images.join('\n');
	}

	private extractLinkCard(container: Element): string {
		const cardLinks = container.querySelectorAll('a[href*="l.threads.com"]');
		for (const cardLink of Array.from(cardLinks)) {
			const img = cardLink.querySelector('img');
			if (!img) continue;

			const href = cardLink.getAttribute('href') || '';
			const actualUrl = this.unwrapRedirectUrl(href);
			const imgSrc = img.getAttribute('src') || '';
			const imgAlt = img.getAttribute('alt') || '';

			if (imgSrc) {
				return `<a href="${escapeHtml(actualUrl)}"><img src="${escapeHtml(imgSrc)}" alt="${escapeHtml(imgAlt)}" /></a>`;
			}
		}
		return '';
	}

	private extractQuotedPost(container: Element): string {
		// Browser DOM: quoted posts are nested [data-pressable-container] elements
		const nestedPressable = container.querySelector('[data-pressable-container]');
		if (nestedPressable) {
			return this.extractQuotedPostFrom(nestedPressable);
		}

		// Server HTML fallback: look for a second /@user/post/ link that
		// contains text content (the main post's permalink only has a date)
		const postLinks = container.querySelectorAll('a[href*="/post/"]');
		for (const link of Array.from(postLinks)) {
			const text = link.textContent?.trim() || '';
			// Skip timestamp-only links (just a date like "04/04/26")
			if (/^\d{2}\/\d{2}\/\d{2}$/.test(text)) continue;
			// This link has real text content — it's a quoted post
			const href = link.getAttribute('href') || '';
			const match = href.match(/\/@([^/]+)\/post\//);
			if (!match) continue;

			const username = match[1];
			const content = `<p>${escapeHtml(text)}</p>`;
			const permalink = href.startsWith('http') ? href : `https://www.threads.com${href}`;

			return buildQuotedPost({
				author: `@${username}`,
				content,
				url: permalink,
			});
		}

		return '';
	}

	private extractQuotedPostFrom(quotedContainer: Element): string {
		const username = this.getUsername(quotedContainer);
		const date = this.getDate(quotedContainer);

		// Quoted post text is often inside the post permalink link,
		// so only skip username-only @-links, not post links.
		const textSpans = Array.from(quotedContainer.querySelectorAll('span[dir="auto"]'));
		let content = '';
		for (const span of textSpans) {
			if (span.closest('[role="button"], time')) continue;
			const link = span.closest('a[href^="/@"]');
			if (link && !link.getAttribute('href')?.includes('/post/')) continue;

			const text = span.textContent?.trim();
			if (!text || text === '·' || text === 'Author') continue;
			if (/^\d{2}\/\d{2}\/\d{2}$/.test(text)) continue;
			const cleaned = this.stripThreadNumber(text);
			if (cleaned) {
				content += `<p>${escapeHtml(cleaned)}</p>\n`;
			}
		}

		return buildQuotedPost({
			author: username ? `@${username}` : undefined,
			date: date || undefined,
			content: content.trim(),
		});
	}

	private createDescription(container: Element | undefined): string {
		if (!container) return '';

		const spans = container.querySelectorAll('span[dir="auto"]');
		for (const span of Array.from(spans)) {
			if (span.closest('a[href^="/@"], [role="button"], a[href*="/post/"], time')) continue;
			const text = span.textContent?.trim() || '';
			if (!text || text === 'Author' || text === '·' || text === 'Top' || text === 'View activity') continue;
			if (/^\d{2}\/\d{2}\/\d{2}$/.test(text)) continue;
			const cleaned = this.stripThreadNumber(text);
			if (cleaned) {
				return cleaned.slice(0, 140).replace(/\s+/g, ' ');
			}
		}
		return '';
	}
}
