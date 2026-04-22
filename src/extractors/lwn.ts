import { BaseExtractor } from './_base';
import { ExtractorResult } from '../types/extractors';
import { serializeHTML, escapeHtml } from '../utils/dom';
import { buildCommentTree, buildContentHtml, type CommentData } from '../utils/comments';

export class LwnExtractor extends BaseExtractor {
	canExtract(): boolean {
		return !!this.document.querySelector('.PageHeadline') &&
			!!this.document.querySelector('.ArticleText');
	}

	extract(): ExtractorResult {
		const main = this.document.querySelector('.ArticleText main');
		const articleContent = main ? this.getArticleContent(main) : '';
		const comments = this.options.includeReplies !== false && main ? this.extractComments(main) : '';
		const contentHtml = buildContentHtml('lwn', articleContent, comments);

		const byline = this.document.querySelector('.Byline')?.textContent?.trim() || '';

		return {
			content: contentHtml,
			contentHtml: contentHtml,
			extractedContent: {},
			variables: {
				title: this.document.querySelector('.PageHeadline h1')?.textContent?.trim() || '',
				author: byline.match(/by\s+(\w+)/i)?.[1] || '',
				site: 'LWN.net',
				published: this.parseDate(byline),
				description: this.document.querySelector('meta[property="og:description"]')?.getAttribute('content') || '',
			}
		};
	}

	private parseDate(text: string): string {
		const match = text.match(/Posted\s+(\w+\s+\d+,\s+\d{4})/);
		if (!match) return '';
		const date = new Date(match[1]);
		return isNaN(date.getTime()) ? '' : date.toISOString().split('T')[0];
	}

	private getArticleContent(main: Element): string {
		const clone = main.cloneNode(true) as Element;
		for (const el of Array.from(clone.querySelectorAll('details.CommentBox, form, a[name^="Comm"]'))) {
			el.remove();
		}

		// Remove trailing <hr> and <br clear="all"> separating article from comments
		let lastEl = clone.lastElementChild;
		while (lastEl && (lastEl.tagName === 'HR' || (lastEl.tagName === 'BR' && lastEl.getAttribute('clear')))) {
			const prev = lastEl.previousElementSibling;
			lastEl.remove();
			lastEl = prev;
		}

		return serializeHTML(clone);
	}

	private extractComments(main: Element): string {
		const allBoxes = Array.from(main.querySelectorAll('details.CommentBox'));
		const commentData: CommentData[] = [];

		for (const box of allBoxes) {
			const depth = this.getCommentDepth(box, main);
			const data = this.extractCommentData(box, depth);
			if (data) commentData.push(data);
		}

		return commentData.length > 0 ? buildCommentTree(commentData) : '';
	}

	private getCommentDepth(el: Element, root: Element): number {
		let depth = 0;
		let parent = el.parentElement;
		while (parent && parent !== root) {
			if (parent.tagName === 'DETAILS' && parent.classList.contains('CommentBox')) {
				depth++;
			}
			parent = parent.parentElement;
		}
		return depth;
	}

	private extractCommentData(box: Element, depth: number): CommentData | null {
		const poster = box.querySelector(':scope > summary .CommentPoster');
		if (!poster) return null;

		const author = poster.querySelector('b')?.textContent?.trim() || '';
		const linkEl = poster.querySelector('a[href^="/Articles/"]');
		const articlePath = linkEl?.getAttribute('href') || '';
		const url = articlePath ? `https://lwn.net${articlePath}` : '';
		const date = this.parseDate(poster.textContent || '');

		const title = box.querySelector(':scope > summary h3.CommentTitle')?.textContent?.trim() || '';

		// Only include title if it differs from the parent comment's title
		const parentBox = box.parentElement?.closest('details.CommentBox');
		const parentTitle = parentBox?.querySelector(':scope > summary h3.CommentTitle')?.textContent?.trim() || '';
		const uniqueTitle = title && title !== parentTitle ? title : '';

		const content = this.getCommentContent(box, uniqueTitle);

		return { author, date, content, depth, url };
	}

	private getCommentContent(box: Element, title: string): string {
		let content = '';

		if (title) {
			content += `<p><strong>${escapeHtml(title)}</strong></p>`;
		}

		const formatted = box.querySelector(':scope > .FormattedComment');
		if (formatted) {
			content += serializeHTML(formatted);
		} else {
			// Collect direct content nodes, skipping structural elements
			const tempContainer = this.document.createElement('div');
			for (const child of Array.from(box.childNodes)) {
				if (child.nodeType === 1) {
					const el = child as Element;
					const tag = el.tagName;
					if (tag === 'SUMMARY' || tag === 'DETAILS' || el.classList.contains('CommentReplyButton')) continue;
					if (tag === 'FORM') continue;
					if (tag === 'A' && el.getAttribute('name')?.startsWith('CommAnchor')) continue;
					if (tag === 'P' && !el.textContent?.trim()) continue;
				}
				tempContainer.appendChild(child.cloneNode(true));
			}
			const text = serializeHTML(tempContainer).trim();
			if (text) content += text;
		}

		return content;
	}
}
