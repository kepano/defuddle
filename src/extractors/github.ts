import { BaseExtractor } from './_base';
import { ExtractorResult } from '../types/extractors';

export class GitHubExtractor extends BaseExtractor {
	constructor(document: Document, url: string) {
		super(document, url);
	}

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
			// Extract issue author - try multiple selectors to find the author
			let issueAuthor = 'Unknown';
			
			// Try different selectors for the issue author
			const authorSelectors = [
				'a[data-testid="issue-body-header-author"]',
				'.IssueBodyHeaderAuthor-module__authorLoginLink--_S7aT',
				'.ActivityHeader-module__AuthorLink--iofTU',
				'a[href*="/users/"][data-hovercard-url*="/users/"]'
			];
			
			for (const selector of authorSelectors) {
				const authorLink = issueContainer.querySelector(selector);
				if (authorLink) {
					const href = authorLink.getAttribute('href');
					if (href) {
						// Extract username from GitHub URL or path
						if (href.startsWith('/')) {
							issueAuthor = href.substring(1); // Remove leading slash
							break;
						} else if (href.includes('github.com/')) {
							const match = href.match(/github\.com\/([^\/\?#]+)/);
							if (match && match[1]) {
								issueAuthor = match[1];
								break;
							}
						}
					}
				}
			}
			
			// If still not found, try to extract from the avatar link
			if (issueAuthor === 'Unknown') {
				const avatarLink = issueContainer.querySelector('a[aria-label*="profile"]');
				if (avatarLink) {
					const href = avatarLink.getAttribute('href');
					if (href) {
						if (href.startsWith('/')) {
							issueAuthor = href.substring(1);
						} else if (href.includes('github.com/')) {
							const match = href.match(/github\.com\/([^\/\?#]+)/);
							if (match && match[1]) {
								issueAuthor = match[1];
							}
						}
					}
				}
			}
			
			// Extract issue timestamp
			const issueTimeElement = issueContainer.querySelector('relative-time');
			const issueTimestamp = issueTimeElement?.getAttribute('datetime') || '';
			
			// Extract issue body
			const issueBodyElement = issueContainer.querySelector('[data-testid="issue-body-viewer"] .markdown-body');
			
			if (issueBodyElement) {
				// Clean up the body content
				const cleanBody = issueBodyElement.cloneNode(true) as Element;
				cleanBody.querySelectorAll('button, [data-testid*="button"], [data-testid*="menu"]').forEach(el => el.remove());
				cleanBody.querySelectorAll('.js-clipboard-copy, .zeroclipboard-container').forEach(el => el.remove());
				
				const bodyContent = cleanBody.innerHTML.trim();
				
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
		
		// Extract comments - look for unique timeline elements with data-wrapper-timeline-id
		const commentElements = Array.from(this.document.querySelectorAll('[data-wrapper-timeline-id]'));
		const processedComments = new Set<string>(); // Track processed comments to avoid duplicates
		
		// Process each comment
		commentElements.forEach((commentElement) => {
			// Skip if this doesn't contain a comment
			const commentContainer = commentElement.querySelector('.react-issue-comment');
			if (!commentContainer) return;
			
			// Get a unique identifier for this comment to avoid duplicates
			const commentId = commentElement.getAttribute('data-wrapper-timeline-id');
			if (!commentId || processedComments.has(commentId)) return;
			processedComments.add(commentId);
			
			// Extract comment author - look for the author link in the activity header
			let author = 'Unknown';
			const authorSelectors = [
				'.ActivityHeader-module__AuthorLink--iofTU',
				'a[data-testid="avatar-link"]',
				'a[href^="/"][data-hovercard-url*="/users/"]'
			];
			
			for (const selector of authorSelectors) {
				const authorLink = commentContainer.querySelector(selector);
				if (authorLink) {
					const href = authorLink.getAttribute('href');
					if (href && href.startsWith('/')) {
						author = href.substring(1); // Remove leading slash
						break;
					}
				}
			}
			
			// Extract comment timestamp
			const timeElement = commentContainer.querySelector('relative-time');
			const timestamp = timeElement?.getAttribute('datetime') || '';
			
			// Extract comment body
			const bodyElement = commentContainer.querySelector('.markdown-body');
			
			if (bodyElement) {
				// Clean up the body content
				const cleanBody = bodyElement.cloneNode(true) as Element;
				cleanBody.querySelectorAll('button, [data-testid*="button"], [data-testid*="menu"]').forEach(el => el.remove());
				cleanBody.querySelectorAll('.js-clipboard-copy, .zeroclipboard-container').forEach(el => el.remove());
				
				const bodyContent = cleanBody.innerHTML.trim();
				
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

	private extractIssueNumber(): string {
		// Try to extract issue number from the page title or header
		const titleElement = this.document.querySelector('h1');
		if (titleElement) {
			const titleText = titleElement.textContent || '';
			const match = titleText.match(/#(\d+)/);
			if (match) return match[1];
		}
		
		// Try to extract from breadcrumb or navigation
		const breadcrumbLinks = this.document.querySelectorAll('nav a, .breadcrumb a');
		for (const link of breadcrumbLinks) {
			const href = link.getAttribute('href') || '';
			const match = href.match(/\/(issues|pull)\/(\d+)/);
			if (match) return match[2];
		}
		
		// Try to extract from meta tags
		const canonicalLink = this.document.querySelector('link[rel="canonical"]');
		if (canonicalLink) {
			const href = canonicalLink.getAttribute('href') || '';
			const match = href.match(/\/(issues|pull)\/(\d+)/);
			if (match) return match[2];
		}
		
		// Fallback to URL parsing if needed
		const match = this.url.match(/\/(issues|pull)\/(\d+)/);
		return match?.[2] || '';
	}

	private extractRepoInfo(): { owner: string; repo: string } {
		// Try to extract from repository header/navigation
		const repoLink = this.document.querySelector('[data-pjax="#repo-content-pjax-container"]');
		if (repoLink) {
			const href = repoLink.getAttribute('href') || '';
			const match = href.match(/^\/([^\/]+)\/([^\/]+)/);
			if (match) {
				return { owner: match[1], repo: match[2] };
			}
		}
		
		// Try to extract from breadcrumb navigation
		const breadcrumbItems = this.document.querySelectorAll('.breadcrumb a, nav a[href^="/"]');
		let owner = '';
		let repo = '';
		
		for (const item of breadcrumbItems) {
			const href = item.getAttribute('href') || '';
			const match = href.match(/^\/([^\/]+)(?:\/([^\/]+))?$/);
			if (match) {
				if (!owner) owner = match[1];
				else if (!repo && match[2]) {
					repo = match[2];
					break;
				}
			}
		}
		
		if (owner && repo) {
			return { owner, repo };
		}
		
		// Try to extract from page title or meta tags
		const titleElement = this.document.querySelector('title');
		if (titleElement) {
			const titleText = titleElement.textContent || '';
			const match = titleText.match(/([^\/\s]+)\/([^\/\s]+)/);
			if (match) {
				return { owner: match[1], repo: match[2] };
			}
		}
		
		// Try to extract from repository name in header
		const repoNameElement = this.document.querySelector('[itemprop="name"]');
		const ownerElement = this.document.querySelector('[itemprop="author"] a, .author a');
		
		if (repoNameElement && ownerElement) {
			return {
				owner: ownerElement.textContent?.trim() || '',
				repo: repoNameElement.textContent?.trim() || ''
			};
		}
		
		// Fallback to URL parsing if needed
		const match = this.url.match(/github\.com\/([^\/]+)\/([^\/]+)/);
		return {
			owner: match?.[1] || '',
			repo: match?.[2] || ''
		};
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
