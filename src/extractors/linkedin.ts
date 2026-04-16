import { BaseExtractor } from './_base';
import { ExtractorResult } from '../types/extractors';
import { serializeHTML, escapeHtml } from '../utils/dom';
import { buildCommentTree, buildContentHtml, buildQuotedPost, type CommentData } from '../utils/comments';

export class LinkedInExtractor extends BaseExtractor {
	private postArticle: Element | null;

	constructor(document: Document, url: string, schemaOrgData?: any, options?: any) {
		super(document, url, schemaOrgData, options);
		this.postArticle = document.querySelector('[role="article"].feed-shared-update-v2');
	}

	canExtract(): boolean {
		return !!this.postArticle;
	}

	extract(): ExtractorResult {
		const postContent = this.getPostContent();
		const comments = this.options.includeReplies !== false ? this.extractComments() : '';
		const contentHtml = buildContentHtml('linkedin', postContent, comments);

		const author = this.getAuthorName();
		const description = this.createDescription();

		return {
			content: contentHtml,
			contentHtml,
			extractedContent: {
				postUrn: this.postArticle?.getAttribute('data-urn') || '',
			},
			variables: {
				title: this.postTitle(author, 'LinkedIn'),
				author,
				site: 'LinkedIn',
				description,
			}
		};
	}

	private getPostContent(): string {
		if (!this.postArticle) return '';

		// Get the main post text — only from the top-level commentary,
		// not from a quoted/reposted post nested inside
		const quotedWrapper = this.postArticle.querySelector('.feed-shared-update-v2__update-content-wrapper');
		const textEl = this.postArticle.querySelector(
			'.update-components-text.update-components-update-v2__commentary'
		);
		const text = (textEl && (!quotedWrapper || !quotedWrapper.contains(textEl)))
			? this.cleanTextContent(textEl)
			: '';

		const images = this.extractImages();
		const video = this.extractVideo();
		const quotedPost = this.extractQuotedPost(quotedWrapper);

		let html = '';
		if (text) html += text;
		if (images) html += `\n${images}`;
		if (video) html += `\n${video}`;
		if (quotedPost) html += `\n${quotedPost}`;

		return html;
	}

	/**
	 * Get visible text from an element, stripping screen-reader duplicates
	 * and optionally additional selectors (e.g. badges).
	 */
	private getVisibleText(el: Element, alsoRemove?: string): string {
		const clone = el.cloneNode(true) as Element;
		const selector = alsoRemove
			? `.visually-hidden, ${alsoRemove}`
			: '.visually-hidden';
		clone.querySelectorAll(selector).forEach(e => e.remove());
		return clone.textContent?.trim() || '';
	}

	private cleanTextContent(el: Element): string {
		const clone = el.cloneNode(true) as Element;

		// Remove screen-reader-only duplicates and UI elements
		clone.querySelectorAll('.visually-hidden, .feed-shared-inline-show-more-text__see-more-less-toggle').forEach(e => e.remove());

		// Clean up links: keep href and text, strip LinkedIn's internal attributes
		clone.querySelectorAll('a').forEach(link => {
			const href = link.getAttribute('href') || '';
			const text = link.textContent?.trim() || '';
			if (href && text) {
				const cleanLink = this.document.createElement('a');
				cleanLink.setAttribute('href', href);
				cleanLink.textContent = text;
				link.replaceWith(cleanLink);
			} else {
				link.replaceWith(link.textContent || '');
			}
		});

		// Unwrap all spans and divs (keep their content)
		clone.querySelectorAll('span, div').forEach(el => {
			el.replaceWith(...Array.from(el.childNodes));
		});

		let html = serializeHTML(clone).trim();

		// Strip HTML comments
		html = html.replace(/<!--.*?-->/g, '');

		// Split on double <br> or double newline for paragraphs
		const paragraphs = html.split(/(?:<br\s*\/?>\s*){2,}|\n{2,}/)
			.map(p => p.replace(/<br\s*\/?>/g, ' ').replace(/\s+/g, ' ').trim())
			.filter(p => p);

		return paragraphs.map(p => `<p>${p}</p>`).join('\n');
	}

	private extractQuotedPost(wrapper: Element | null): string {
		if (!wrapper) return '';

		const actorTitle = wrapper.querySelector('.update-components-actor__title');
		const authorName = actorTitle
			? this.getVisibleText(actorTitle, '.update-components-actor__supplementary-actor-info, .text-view-model__verified-icon')
			: '';

		// Get date from sub-description (e.g. "1w • 🌐")
		const subDesc = wrapper.querySelector('.update-components-actor__sub-description');
		let date = '';
		if (subDesc) {
			const visible = subDesc.querySelector('[aria-hidden="true"]');
			const raw = (visible || subDesc).textContent?.trim() || '';
			const match = raw.match(/^(\d+\w+)/);
			date = match ? match[1] : '';
		}

		const textEl = wrapper.querySelector('.update-components-text.update-components-update-v2__commentary');
		const content = textEl ? this.cleanTextContent(textEl) : '';

		const linkEl = wrapper.querySelector('a.update-components-mini-update-v2__link-to-details-page');
		const postUrl = linkEl?.getAttribute('href') || '';
		const url = postUrl
			? (postUrl.startsWith('http') ? postUrl : `https://www.linkedin.com${postUrl}`).split('?')[0]
			: '';

		return buildQuotedPost({
			author: authorName || undefined,
			date: date || undefined,
			content,
			url: url || undefined,
		});
	}

	private extractImages(): string {
		if (!this.postArticle) return '';

		const images: string[] = [];
		this.postArticle.querySelectorAll(
			'.update-components-image img, .feed-shared-image img'
		).forEach(img => {
			const src = img.getAttribute('src') || '';
			const alt = img.getAttribute('alt') || '';
			if (src && !src.includes('profile-displayphoto') && !src.includes('avm-avatar')) {
				images.push(`<img src="${escapeHtml(src)}" alt="${escapeHtml(alt)}" />`);
			}
		});

		return images.join('\n');
	}

	private extractVideo(): string {
		if (!this.postArticle) return '';

		const video = this.postArticle.querySelector('.update-components-linkedin-video video[poster]');
		if (!video) return '';

		const poster = video.getAttribute('poster') || '';
		return `<img src="${escapeHtml(poster)}" alt="Video thumbnail" />`;
	}

	private extractComments(): string {
		if (!this.postArticle) return '';

		const commentData: CommentData[] = [];

		const topLevelComments = this.postArticle.querySelectorAll(
			'article.comments-comment-entity:not(.comments-comment-entity--reply)'
		);

		for (const comment of Array.from(topLevelComments)) {
			const data = this.extractCommentData(comment, 0);
			if (data) commentData.push(data);

			const replies = comment.querySelectorAll(
				'.comments-replies-list article.comments-comment-entity--reply'
			);
			for (const reply of Array.from(replies)) {
				const replyData = this.extractCommentData(reply, 1);
				if (replyData) commentData.push(replyData);
			}
		}

		return commentData.length > 0 ? buildCommentTree(commentData) : '';
	}

	private extractCommentData(comment: Element, depth: number): CommentData | null {
		const author = comment.querySelector('.comments-comment-meta__description-title')
			?.textContent?.trim() || '';
		if (!author) return null;

		const textEl = comment.querySelector('.comments-comment-entity__content .update-components-text');
		const content = textEl ? this.cleanTextContent(textEl) : '';

		const timeEl = comment.querySelector('time.comments-comment-meta__data');
		const date = timeEl?.textContent?.trim() || '';

		const profileLink = comment.querySelector('a.comments-comment-meta__description-container');
		const profileHref = profileLink?.getAttribute('href')?.split('?')[0] || '';
		let url = '';
		if (profileHref) {
			url = profileHref.startsWith('http') ? profileHref : `https://www.linkedin.com${profileHref}`;
		}

		const reactionsEl = comment.querySelector('.comments-comment-social-bar__reactions-count--cr span.v-align-middle');
		const reactions = reactionsEl?.textContent?.trim() || '';

		return {
			author,
			date,
			content,
			depth,
			score: reactions ? `${reactions} reactions` : undefined,
			url: url || undefined,
		};
	}

	private getAuthorName(): string {
		if (!this.postArticle) return '';
		const nameEl = this.postArticle.querySelector('.update-components-actor__title');
		if (!nameEl) return '';
		return this.getVisibleText(nameEl, '.text-view-model__verified-icon, .update-components-actor__supplementary-actor-info');
	}

	private createDescription(): string {
		if (!this.postArticle) return '';

		// Skip text inside quoted posts, same as getPostContent
		const quotedWrapper = this.postArticle.querySelector('.feed-shared-update-v2__update-content-wrapper');
		const textEl = this.postArticle.querySelector(
			'.update-components-text.update-components-update-v2__commentary'
		);
		if (!textEl || (quotedWrapper && quotedWrapper.contains(textEl))) return '';

		return this.getVisibleText(textEl)
			.slice(0, 140)
			.replace(/\s+/g, ' ');
	}
}
