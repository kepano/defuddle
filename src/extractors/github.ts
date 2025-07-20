import { BaseExtractor } from './_base';
import { ExtractorResult } from '../types/extractors';

export class GitHubExtractor extends BaseExtractor {
	canExtract(): boolean {
		const githubIndicators = [
			'meta[name="expected-hostname"][content="github.com"]',
			'meta[name="octolytics-url"]',
			'meta[name="github-keyboard-shortcuts"]',
			'.js-header-wrapper',
			'#js-repo-pjax-container',
		];

		const githubPageIndicators = {
			issue: [
				'[data-testid="issue-metadata-sticky"]',
				'[data-testid="issue-title"]',
			],
		}

		return githubIndicators.some(selector => this.document.querySelector(selector) !== null)
			&& Object.values(githubPageIndicators).some(selectors => selectors.some(selector => this.document.querySelector(selector) !== null));
	}

	extract(): ExtractorResult {
		return this.extractIssue();
	}

	private extractIssue(): ExtractorResult {
		const repoInfo = this.extractRepoInfo();
		const issueNumber = this.extractIssueNumber();

		let content = '';
		
		// Extract the main issue body first
		const issueContainer = this.document.querySelector('[data-testid="issue-viewer-issue-container"]');
		if (issueContainer) {
			const issueAuthor = this.extractAuthor(issueContainer, [
				'a[data-testid="issue-body-header-author"]',
				'.IssueBodyHeaderAuthor-module__authorLoginLink--_S7aT',
				'.ActivityHeader-module__AuthorLink--iofTU',
				'a[href*="/users/"][data-hovercard-url*="/users/"]',
				'a[aria-label*="profile"]'
			]);
			
			const issueTimeElement = issueContainer.querySelector('relative-time');
			const issueTimestamp = issueTimeElement?.getAttribute('datetime') || '';
			
			const issueBodyElement = issueContainer.querySelector('[data-testid="issue-body-viewer"] .markdown-body');
			
			if (issueBodyElement) {
				const bodyContent = this.cleanBodyContent(issueBodyElement);
				
				// Add the main issue
				content += `<div class="issue-author"><strong>${issueAuthor}</strong>`;
				if (issueTimestamp) {
					const date = new Date(issueTimestamp);
					content += ` opened this issue on ${date.toLocaleDateString()}`;
				}
				content += `</div>\n\n`;
				content += `<div class="issue-body">${bodyContent}</div>\n\n`;
			}
		}
		
		// Extract comments
		const commentElements = Array.from(this.document.querySelectorAll('[data-wrapper-timeline-id]'));
		const processedComments = new Set<string>();
		
		commentElements.forEach((commentElement) => {
			const commentContainer = commentElement.querySelector('.react-issue-comment');
			if (!commentContainer) return;
			
			const commentId = commentElement.getAttribute('data-wrapper-timeline-id');
			if (!commentId || processedComments.has(commentId)) return;
			processedComments.add(commentId);
			
			const author = this.extractAuthor(commentContainer, [
				'.ActivityHeader-module__AuthorLink--iofTU',
				'a[data-testid="avatar-link"]',
				'a[href^="/"][data-hovercard-url*="/users/"]'
			]);
			
			const timeElement = commentContainer.querySelector('relative-time');
			const timestamp = timeElement?.getAttribute('datetime') || '';
			
			const bodyElement = commentContainer.querySelector('.markdown-body');
			
			if (bodyElement) {
				const bodyContent = this.cleanBodyContent(bodyElement);
				
				if (bodyContent) {
					content += `<div class="comment">\n`;
					content += `<div class="comment-header"><strong>${author}</strong>`;
					if (timestamp) {
						const date = new Date(timestamp);
						content += ` commented on ${date.toLocaleDateString()}`;
					}
					content += `</div>\n`;
					content += `<div class="comment-body">${bodyContent}</div>\n`;
					content += `</div>\n\n`;
				}
			}
		});

		return {
			content: content,
			contentHtml: content,
			extractedContent: {
				type: 'issue',
				issueNumber,
				repository: repoInfo.repo,
				owner: repoInfo.owner,
			},
			variables: {
				title: this.document.title,
				author: '',
				site: `GitHub - ${repoInfo.owner}/${repoInfo.repo}`,
				description: this.createDescription(content),
			}
		};
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
		return cleanBody.innerHTML.trim();
	}

	private extractIssueNumber(): string {
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
		tempDiv.innerHTML = content;
		return tempDiv.textContent?.trim()
			.slice(0, 140)
			.replace(/\s+/g, ' ') || '';
	}
}
