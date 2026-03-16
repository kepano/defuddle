import { BaseExtractor } from './_base';
import { ExtractorResult } from '../types/extractors';
import { parseHTML, serializeHTML } from '../utils/dom';
import { buildCommentTree, buildContentHtml, type CommentData } from '../utils/comments';

export class GitHubExtractor extends BaseExtractor {
	private isIssue: boolean;
	private isPR: boolean;

	constructor(document: Document, url: string) {
		super(document, url);
		this.isIssue = /\/issues\/\d+/.test(url);
		this.isPR = /\/pull\/\d+/.test(url);
	}

	canExtract(): boolean {
		const githubIndicators = [
			'meta[name="expected-hostname"][content="github.com"]',
			'meta[name="octolytics-url"]',
			'meta[name="github-keyboard-shortcuts"]',
			'.js-header-wrapper',
			'#js-repo-pjax-container',
		];

		if (!githubIndicators.some(selector => this.document.querySelector(selector) !== null)) {
			return false;
		}

		if (this.isIssue) {
			return [
				'[data-testid="issue-metadata-sticky"]',
				'[data-testid="issue-title"]',
			].some(selector => this.document.querySelector(selector) !== null);
		}

		if (this.isPR) {
			return [
				'.pull-discussion-timeline',
				'.discussion-timeline',
				'.gh-header-title',
				'.js-issue-title',
			].some(selector => this.document.querySelector(selector) !== null);
		}

		return false;
	}

	extract(): ExtractorResult {
		const repoInfo = this.extractRepoInfo();
		const number = this.extractNumber();
		const type = this.isPR ? 'pull' : 'issue';

		const prBody = this.isPR ? this.getPRBody() : null;
		const { content: postContent, author, published } = this.isPR
			? this.getPRContent(prBody)
			: this.getIssueContent();
		const comments = this.options.includeReplies !== false
			? (this.isPR ? this.extractPRComments(prBody) : this.extractComments())
			: '';
		const contentHtml = this.createContentHtml(postContent, comments);

		return {
			content: contentHtml,
			contentHtml: contentHtml,
			extractedContent: {
				type,
				number,
				repository: repoInfo.repo,
				owner: repoInfo.owner,
			},
			variables: {
				title: this.document.title,
				author,
				published,
				site: `GitHub - ${repoInfo.owner}/${repoInfo.repo}`,
				description: this.createDescription(contentHtml),
			}
		};
	}

	private createContentHtml(postContent: string, comments: string): string {
		return buildContentHtml('github', postContent, comments);
	}

	private getIssueContent(): { content: string; author: string; published: string } {
		const issueContainer = this.document.querySelector('[data-testid="issue-viewer-issue-container"]');
		if (!issueContainer) return { content: '', author: '', published: '' };

		const author = this.extractAuthor(issueContainer, [
			'a[data-testid="issue-body-header-author"]',
			'.IssueBodyHeaderAuthor-module__authorLoginLink--_S7aT',
			'.ActivityHeader-module__AuthorLink--iofTU',
			'a[href*="/users/"][data-hovercard-url*="/users/"]',
			'a[aria-label*="profile"]'
		]);

		const issueTimeElement = issueContainer.querySelector('relative-time');
		const published = issueTimeElement?.getAttribute('datetime') || '';

		const issueBodyElement = issueContainer.querySelector('[data-testid="issue-body-viewer"] .markdown-body');
		if (!issueBodyElement) return { content: '', author, published };

		const content = this.cleanBodyContent(issueBodyElement);

		return { content, author, published };
	}

	private extractComments(): string {
		const commentElements = Array.from(this.document.querySelectorAll('[data-wrapper-timeline-id]'));
		const processedComments = new Set<string>();
		const commentData: CommentData[] = [];

		for (const commentElement of commentElements) {
			const commentContainer = commentElement.querySelector('.react-issue-comment');
			if (!commentContainer) continue;

			const commentId = commentElement.getAttribute('data-wrapper-timeline-id');
			if (!commentId || processedComments.has(commentId)) continue;
			processedComments.add(commentId);

			const author = this.extractAuthor(commentContainer, [
				'.ActivityHeader-module__AuthorLink--iofTU',
				'a[data-testid="avatar-link"]',
				'a[href^="/"][data-hovercard-url*="/users/"]'
			]);

			const timeElement = commentContainer.querySelector('relative-time');
			const timestamp = timeElement?.getAttribute('datetime') || '';
			const date = timestamp ? new Date(timestamp).toISOString().split('T')[0] : '';

			const bodyElement = commentContainer.querySelector('.markdown-body');
			if (!bodyElement) continue;

			const bodyContent = this.cleanBodyContent(bodyElement);
			if (!bodyContent) continue;

			commentData.push({
				author,
				date,
				content: bodyContent,
			});
		}

		return buildCommentTree(commentData);
	}

	private getPRBody(): Element | null {
		// PR body is in [id^="pullrequest-"] or the first .timeline-comment
		return this.document.querySelector('[id^="pullrequest-"]')
			|| this.document.querySelector('.timeline-comment');
	}

	private getPRContent(prBody: Element | null): { content: string; author: string; published: string } {

		const bodyEl = prBody?.querySelector('.comment-body.markdown-body')
			|| this.document.querySelector('.comment-body.markdown-body');
		const content = bodyEl ? this.cleanBodyContent(bodyEl) : '';

		const authorEl = prBody?.querySelector('.author')
			|| this.document.querySelector('.gh-header-meta .author');
		const author = authorEl?.textContent?.trim() || '';

		const timeEl = prBody?.querySelector('relative-time');
		const published = timeEl?.getAttribute('datetime') || '';

		return { content, author, published };
	}

	private extractPRComments(prBody: Element | null): string {
		// Find all comment containers: regular comments (.timeline-comment)
		// and code review comments (.review-comment)
		const allComments = Array.from(
			this.document.querySelectorAll('.timeline-comment, .review-comment')
		);
		const commentData: CommentData[] = [];

		for (const comment of allComments) {
			// Skip the PR description
			if (prBody && (comment === prBody || prBody.contains(comment))) continue;

			const authorEl = comment.querySelector('.author');
			const author = authorEl?.textContent?.trim() || '';

			const timeEl = comment.querySelector('relative-time');
			const timestamp = timeEl?.getAttribute('datetime') || '';
			const date = timestamp ? new Date(timestamp).toISOString().split('T')[0] : '';

			const bodyEl = comment.querySelector('.comment-body.markdown-body');
			if (!bodyEl) continue;

			const bodyContent = this.cleanBodyContent(bodyEl);
			if (!bodyContent) continue;

			commentData.push({
				author,
				date,
				content: bodyContent,
			});
		}

		return buildCommentTree(commentData);
	}

	private extractAuthor(container: Element, selectors: string[]): string {
		for (const selector of selectors) {
			const authorLink = container.querySelector(selector);
			if (authorLink) {
				const href = authorLink.getAttribute('href');
				if (href) {
					if (href.startsWith('/')) {
						return href.substring(1);
					} else if (href.includes('github.com/')) {
						const match = href.match(/github\.com\/([^\/\?#]+)/);
						if (match && match[1]) {
							return match[1];
						}
					}
				}
			}
		}
		return 'Unknown';
	}

	private cleanBodyContent(bodyElement: Element): string {
		const cleanBody = bodyElement.cloneNode(true) as Element;
		cleanBody.querySelectorAll('button, [data-testid*="button"], [data-testid*="menu"]').forEach(el => el.remove());
		cleanBody.querySelectorAll('.js-clipboard-copy, .zeroclipboard-container').forEach(el => el.remove());

		// Convert GitHub's highlighted code blocks to standard <pre><code>
		// GitHub uses <div class="highlight highlight-source-{lang}"><pre>spans...</pre></div>
		// The <pre> has no <code> child, which breaks markdown conversion.
		cleanBody.querySelectorAll('div.highlight[class*="highlight-source-"] pre, div.highlight pre').forEach(pre => {
			const wrapper = pre.parentElement;
			if (!wrapper) return;

			// Extract language from wrapper class (e.g. "highlight-source-ts")
			const langMatch = wrapper.className.match(/highlight-source-(\w+)/);
			const lang = langMatch?.[1] || '';

			// Use data-snippet-clipboard-copy-content if available (clean text),
			// otherwise fall back to textContent
			const content = wrapper.getAttribute('data-snippet-clipboard-copy-content')
				|| pre.textContent || '';

			const code = this.document.createElement('code');
			if (lang) {
				code.setAttribute('class', `language-${lang}`);
				code.setAttribute('data-lang', lang);
			}
			code.textContent = content;

			const newPre = this.document.createElement('pre');
			newPre.appendChild(code);
			wrapper.replaceWith(newPre);
		});

		return serializeHTML(cleanBody).trim();
	}

	private extractNumber(): string {
		// Try URL first (most reliable)
		const urlMatch = this.url.match(/\/(issues|pull)\/(\d+)/);
		if (urlMatch) return urlMatch[2];

		// Fallback to HTML extraction
		const titleElement = this.document.querySelector('h1');
		const titleMatch = titleElement?.textContent?.match(/#(\d+)/);
		return titleMatch ? titleMatch[1] : '';
	}

	private extractRepoInfo(): { owner: string; repo: string } {
		// Try URL first (most reliable)
		const urlMatch = this.url.match(/github\.com\/([^\/]+)\/([^\/]+)/);
		if (urlMatch) {
			return { owner: urlMatch[1], repo: urlMatch[2] };
		}

		// Fallback to HTML extraction
		const titleMatch = this.document.title.match(/([^\/\s]+)\/([^\/\s]+)/);
		return titleMatch ? { owner: titleMatch[1], repo: titleMatch[2] } : { owner: '', repo: '' };
	}


	private createDescription(content: string): string {
		if (!content) return '';

		const tempDiv = this.document.createElement('div');
		tempDiv.appendChild(parseHTML(this.document, content));
		return tempDiv.textContent?.trim()
			.slice(0, 140)
			.replace(/\s+/g, ' ') || '';
	}
}
