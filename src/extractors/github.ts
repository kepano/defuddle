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

		return githubIndicators.some(selector => this.document.querySelector(selector) !== null);
	}

	extract(): ExtractorResult {
		switch (this.detectPageType()) {
			case 'issue':
				return this.extractIssue();
			case 'pull-request':
				return this.extractPullRequest();
			case 'repository':
				return this.extractRepository();
			case 'user-profile':
				return this.extractUserProfile();
			default:
				return this.extractGeneric();
		}
	}

	private detectPageType(): string {
		// Issue page detection - look for issue-specific elements
		if (this.document.querySelector('[data-testid="issue-metadata-sticky"]') ||
			this.document.querySelector('[data-testid="issue-title"]')) {
			return 'issue';
		}

		// Pull request detection - look for PR-specific elements
		if (this.document.querySelector('.pull-discussion-timeline') && 
			(this.document.querySelector('#files_tab_counter'))) {
			return 'pull-request';
		}

		// Repository detection - look for repo-specific elements
		if (this.document.querySelector('#repository-container-header') ||
			this.document.querySelector('.react-directory-row')) {
			return 'repository';
		}

		// User profile detection - look for profile-specific elements
		if (this.document.querySelector('#user-profile-frame')) {
			return 'user-profile';
		}

		return 'generic';
	}

	private extractIssue(): ExtractorResult {
		// Try multiple selectors for title
		const title = this.document.querySelector('.js-issue-title')?.textContent?.trim() || 
					  this.document.querySelector('h1 bdi')?.textContent?.trim() ||
					  this.document.querySelector('[data-testid="issue-title"]')?.textContent?.trim() ||
					  this.document.querySelector('h1')?.textContent?.trim() || '';
		
		const issueNumber = this.extractIssueNumber();
		
		// Try multiple selectors for author
		const author = this.document.querySelector('.author')?.textContent?.trim() || 
					   this.document.querySelector('[data-hovercard-type="user"]')?.textContent?.trim() ||
					   this.document.querySelector('.timeline-comment-header .author')?.textContent?.trim() || '';
		
		// Try multiple selectors for state
		const state = this.document.querySelector('.State')?.textContent?.trim() || 
					  this.document.querySelector('[data-testid="issue-state-badge"]')?.textContent?.trim() ||
					  this.document.querySelector('.State--open, .State--closed')?.textContent?.trim() || '';
		
		const labels = this.extractLabels();
		const assignees = this.extractAssignees();
		
		// Get issue body - try multiple selectors
		const issueBody = this.document.querySelector('.comment-body')?.innerHTML || 
						  this.document.querySelector('[data-testid="issue-body"] .markdown-body')?.innerHTML ||
						  this.document.querySelector('.timeline-comment .comment-body')?.innerHTML || '';
		
		// Get comments
		const comments = this.extractComments();
		
		const repoInfo = this.extractRepoInfo();
		
		const contentHtml = this.createIssueHtml(title, issueNumber, author, state, labels, assignees, issueBody, comments);
		
		return {
			content: contentHtml,
			contentHtml: contentHtml,
			extractedContent: {
				type: 'issue',
				issueNumber,
				author,
				state,
				repository: repoInfo.repo,
				owner: repoInfo.owner,
			},
			variables: {
				title: `${title} #${issueNumber}`,
				author,
				site: `GitHub - ${repoInfo.owner}/${repoInfo.repo}`,
				description: this.createDescription(issueBody),
			}
		};
	}

	private extractPullRequest(): ExtractorResult {
		// Try multiple selectors for title
		const title = this.document.querySelector('.js-issue-title')?.textContent?.trim() || 
					  this.document.querySelector('h1 bdi')?.textContent?.trim() ||
					  this.document.querySelector('[data-testid="pr-title"]')?.textContent?.trim() ||
					  this.document.querySelector('h1')?.textContent?.trim() || '';
		
		const prNumber = this.extractIssueNumber();
		
		// Try multiple selectors for author
		const author = this.document.querySelector('.author')?.textContent?.trim() || 
					   this.document.querySelector('[data-hovercard-type="user"]')?.textContent?.trim() ||
					   this.document.querySelector('.timeline-comment-header .author')?.textContent?.trim() || '';
		
		// Try multiple selectors for state
		const state = this.document.querySelector('.State')?.textContent?.trim() || 
					  this.document.querySelector('[data-testid="pr-state-badge"]')?.textContent?.trim() ||
					  this.document.querySelector('.State--open, .State--closed, .State--merged')?.textContent?.trim() || '';
		
		const labels = this.extractLabels();
		const assignees = this.extractAssignees();
		
		// Get PR body - try multiple selectors
		const prBody = this.document.querySelector('.comment-body')?.innerHTML || 
					   this.document.querySelector('[data-testid="pr-body"] .markdown-body')?.innerHTML ||
					   this.document.querySelector('.timeline-comment .comment-body')?.innerHTML || '';
		
		// Get comments
		const comments = this.extractComments();
		
		// Get file changes info - try multiple selectors
		const filesChanged = this.document.querySelector('#files_tab_counter')?.textContent?.trim() || 
							  this.document.querySelector('[data-testid="pr-files-changed"]')?.textContent?.trim() || '0';
		const additions = this.document.querySelector('.text-diff-added')?.textContent?.trim() || 
						  this.document.querySelector('[data-testid="pr-additions"]')?.textContent?.trim() || '0';
		const deletions = this.document.querySelector('.text-diff-deleted')?.textContent?.trim() || 
						  this.document.querySelector('[data-testid="pr-deletions"]')?.textContent?.trim() || '0';
		
		const repoInfo = this.extractRepoInfo();
		
		const contentHtml = this.createPullRequestHtml(title, prNumber, author, state, labels, assignees, prBody, comments, filesChanged, additions, deletions);
		
		return {
			content: contentHtml,
			contentHtml: contentHtml,
			extractedContent: {
				type: 'pull-request',
				prNumber,
				author,
				state,
				repository: repoInfo.repo,
				owner: repoInfo.owner,
				filesChanged,
				additions,
				deletions,
			},
			variables: {
				title: `${title} #${prNumber}`,
				author,
				site: `GitHub - ${repoInfo.owner}/${repoInfo.repo}`,
				description: this.createDescription(prBody),
			}
		};
	}

	private extractRepository(): ExtractorResult {
		const repoInfo = this.extractRepoInfo();
		
		// Try multiple selectors for description
		const description = this.document.querySelector('[data-pjax="#repo-content-pjax-container"] p')?.textContent?.trim() || 
						   this.document.querySelector('.repository-content .f4')?.textContent?.trim() ||
						   this.document.querySelector('[data-testid="repository-description"]')?.textContent?.trim() ||
						   this.document.querySelector('.BorderGrid-cell p')?.textContent?.trim() || '';
		
		// Try multiple selectors for stats
		const stars = this.document.querySelector('#repo-stars-counter-star')?.textContent?.trim() || 
					  this.document.querySelector('[data-testid="repo-stars-count"]')?.textContent?.trim() ||
					  this.document.querySelector('a[href$="/stargazers"] strong')?.textContent?.trim() || '0';
		
		const forks = this.document.querySelector('#repo-network-counter')?.textContent?.trim() || 
					  this.document.querySelector('[data-testid="repo-forks-count"]')?.textContent?.trim() ||
					  this.document.querySelector('a[href$="/forks"] strong')?.textContent?.trim() || '0';
		
		const language = this.document.querySelector('[data-ga-click*="primary language"]')?.textContent?.trim() || 
						 this.document.querySelector('[data-testid="repo-language"]')?.textContent?.trim() ||
						 this.document.querySelector('.BorderGrid-cell .ml-0')?.textContent?.trim() || '';
		
		// Get README content - try multiple selectors
		const readmeContent = this.document.querySelector('#readme .markdown-body')?.innerHTML || 
							  this.document.querySelector('[data-testid="readme"] .markdown-body')?.innerHTML ||
							  this.document.querySelector('.Box-body .markdown-body')?.innerHTML || '';
		
		// Get recent commits or activity
		const recentActivity = this.extractRecentActivity();
		
		const contentHtml = this.createRepositoryHtml(repoInfo, description, stars, forks, language, readmeContent, recentActivity);
		
		return {
			content: contentHtml,
			contentHtml: contentHtml,
			extractedContent: {
				type: 'repository',
				repository: repoInfo.repo,
				owner: repoInfo.owner,
				description,
				stars,
				forks,
				language,
			},
			variables: {
				title: `${repoInfo.owner}/${repoInfo.repo}`,
				author: repoInfo.owner,
				site: 'GitHub',
				description: description || `GitHub repository: ${repoInfo.owner}/${repoInfo.repo}`,
			}
		};
	}

	private extractUserProfile(): ExtractorResult {
		const username = this.extractUsername();
		
		// Try multiple selectors for display name
		const displayName = this.document.querySelector('.p-name')?.textContent?.trim() || 
						   this.document.querySelector('[data-testid="profile-name"]')?.textContent?.trim() ||
						   this.document.querySelector('.vcard-fullname')?.textContent?.trim() || username;
		
		// Try multiple selectors for bio
		const bio = this.document.querySelector('.p-note')?.textContent?.trim() || 
				   this.document.querySelector('[data-testid="profile-bio"]')?.textContent?.trim() ||
				   this.document.querySelector('.user-profile-bio')?.textContent?.trim() || '';
		
		// Try multiple selectors for profile metadata
		const company = this.document.querySelector('[data-test-selector="profile-company"]')?.textContent?.trim() || 
					   this.document.querySelector('[data-testid="profile-company"]')?.textContent?.trim() ||
					   this.document.querySelector('.vcard-detail[itemprop="worksFor"]')?.textContent?.trim() || '';
		
		const location = this.document.querySelector('[data-test-selector="profile-location"]')?.textContent?.trim() || 
						this.document.querySelector('[data-testid="profile-location"]')?.textContent?.trim() ||
						this.document.querySelector('.vcard-detail[itemprop="homeLocation"]')?.textContent?.trim() || '';
		
		const website = this.document.querySelector('[data-test-selector="profile-website-url"]')?.textContent?.trim() || 
					   this.document.querySelector('[data-testid="profile-website"]')?.textContent?.trim() ||
					   this.document.querySelector('.vcard-detail[itemprop="url"]')?.textContent?.trim() || '';
		
		// Try multiple selectors for follower/following counts
		const followers = this.document.querySelector('a[href$="/followers"] .text-bold')?.textContent?.trim() || 
						 this.document.querySelector('[data-testid="followers-count"]')?.textContent?.trim() ||
						 this.document.querySelector('.Counter')?.textContent?.trim() || '0';
		
		const following = this.document.querySelector('a[href$="/following"] .text-bold')?.textContent?.trim() || 
						 this.document.querySelector('[data-testid="following-count"]')?.textContent?.trim() ||
						 this.document.querySelectorAll('.Counter')?.[1]?.textContent?.trim() || '0';
		
		// Get pinned repositories
		const pinnedRepos = this.extractPinnedRepositories();
		
		// Get recent activity
		const recentActivity = this.extractUserActivity();
		
		const contentHtml = this.createUserProfileHtml(username, displayName, bio, company, location, website, followers, following, pinnedRepos, recentActivity);
		
		return {
			content: contentHtml,
			contentHtml: contentHtml,
			extractedContent: {
				type: 'user-profile',
				username,
				displayName,
				bio,
				company,
				location,
				website,
				followers,
				following,
			},
			variables: {
				title: `${displayName} (@${username})`,
				author: username,
				site: 'GitHub',
				description: bio || `GitHub profile for ${username}`,
			}
		};
	}

	private extractGeneric(): ExtractorResult {
		const title = this.document.querySelector('title')?.textContent?.trim() || '';
		const content = this.document.querySelector('main')?.innerHTML || 
					   this.document.querySelector('.application-main')?.innerHTML || 
					   this.document.body.innerHTML;
		
		return {
			content: content,
			contentHtml: content,
			extractedContent: {
				type: 'generic',
			},
			variables: {
				title,
				author: '',
				site: 'GitHub',
				description: '',
			}
		};
	}

	private extractIssueNumber(): string {
		const match = this.url.match(/\/(issues|pull)\/(\d+)/);
		return match?.[2] || '';
	}

	private extractRepoInfo(): { owner: string; repo: string } {
		const match = this.url.match(/github\.com\/([^\/]+)\/([^\/]+)/);
		return {
			owner: match?.[1] || '',
			repo: match?.[2] || ''
		};
	}

	private extractUsername(): string {
		const match = this.url.match(/github\.com\/([^\/]+)$/);
		return match?.[1] || '';
	}

	private extractLabels(): string[] {
		return Array.from(this.document.querySelectorAll('.labels .IssueLabel'))
			.map(label => label.textContent?.trim() || '')
			.filter(Boolean);
	}

	private extractAssignees(): string[] {
		return Array.from(this.document.querySelectorAll('.assignee .assignee-avatar'))
			.map(assignee => assignee.getAttribute('alt')?.replace('@', '') || '')
			.filter(Boolean);
	}

	private extractComments(): string {
		const comments = Array.from(this.document.querySelectorAll('.timeline-comment'));
		let html = '';
		
		comments.forEach(comment => {
			const author = comment.querySelector('.author')?.textContent?.trim() || '';
			const timestamp = comment.querySelector('relative-time')?.getAttribute('datetime') || '';
			const content = comment.querySelector('.comment-body')?.innerHTML || '';
			
			if (content) {
				html += `
					<div class="github-comment">
						<div class="comment-header">
							<strong>${author}</strong>
							${timestamp ? `<span class="comment-date">${new Date(timestamp).toLocaleDateString()}</span>` : ''}
						</div>
						<div class="comment-content">${content}</div>
					</div>
				`;
			}
		});
		
		return html;
	}

	private extractRecentActivity(): string {
		const commits = Array.from(this.document.querySelectorAll('.commit-tease, .Box-row'));
		let html = '';
		
		commits.slice(0, 5).forEach(commit => {
			const message = commit.querySelector('.commit-message, .text-bold')?.textContent?.trim() || '';
			const author = commit.querySelector('.commit-author, .text-gray')?.textContent?.trim() || '';
			const date = commit.querySelector('relative-time')?.getAttribute('datetime') || '';
			
			if (message) {
				html += `
					<div class="github-activity-item">
						<div class="activity-message">${message}</div>
						${author ? `<div class="activity-author">by ${author}</div>` : ''}
						${date ? `<div class="activity-date">${new Date(date).toLocaleDateString()}</div>` : ''}
					</div>
				`;
			}
		});
		
		return html;
	}

	private extractPinnedRepositories(): string {
		const pinnedRepos = Array.from(this.document.querySelectorAll('.pinned-item-list-item'));
		let html = '';
		
		pinnedRepos.forEach(repo => {
			const name = repo.querySelector('.repo')?.textContent?.trim() || '';
			const description = repo.querySelector('.pinned-item-desc')?.textContent?.trim() || '';
			const language = repo.querySelector('[itemprop="programmingLanguage"]')?.textContent?.trim() || '';
			const stars = repo.querySelector('.octicon-star')?.parentElement?.textContent?.trim() || '';
			
			if (name) {
				html += `
					<div class="pinned-repo">
						<div class="repo-name"><strong>${name}</strong></div>
						${description ? `<div class="repo-description">${description}</div>` : ''}
						<div class="repo-meta">
							${language ? `<span class="repo-language">${language}</span>` : ''}
							${stars ? `<span class="repo-stars">⭐ ${stars}</span>` : ''}
						</div>
					</div>
				`;
			}
		});
		
		return html;
	}

	private extractUserActivity(): string {
		const activities = Array.from(this.document.querySelectorAll('.contribution-activity .Box-row'));
		let html = '';
		
		activities.slice(0, 10).forEach(activity => {
			const content = activity.textContent?.trim() || '';
			if (content) {
				html += `<div class="user-activity-item">${content}</div>`;
			}
		});
		
		return html;
	}

	private createIssueHtml(title: string, issueNumber: string, author: string, state: string, labels: string[], assignees: string[], body: string, comments: string): string {
		return `
			<div class="github-issue">
				<div class="issue-header">
					<h1>${title} #${issueNumber}</h1>
					<div class="issue-meta">
						<span class="issue-state ${state.toLowerCase()}">${state}</span>
						<span class="issue-author">opened by ${author}</span>
					</div>
					${labels.length > 0 ? `<div class="issue-labels">${labels.map(label => `<span class="label">${label}</span>`).join('')}</div>` : ''}
					${assignees.length > 0 ? `<div class="issue-assignees">Assigned to: ${assignees.join(', ')}</div>` : ''}
				</div>
				<div class="issue-body">
					${body}
				</div>
				${comments ? `
					<hr>
					<h2>Comments</h2>
					<div class="issue-comments">
						${comments}
					</div>
				` : ''}
			</div>
		`.trim();
	}

	private createPullRequestHtml(title: string, prNumber: string, author: string, state: string, labels: string[], assignees: string[], body: string, comments: string, filesChanged: string, additions: string, deletions: string): string {
		return `
			<div class="github-pull-request">
				<div class="pr-header">
					<h1>${title} #${prNumber}</h1>
					<div class="pr-meta">
						<span class="pr-state ${state.toLowerCase()}">${state}</span>
						<span class="pr-author">opened by ${author}</span>
					</div>
					<div class="pr-stats">
						<span class="files-changed">${filesChanged} files changed</span>
						<span class="additions">+${additions}</span>
						<span class="deletions">-${deletions}</span>
					</div>
					${labels.length > 0 ? `<div class="pr-labels">${labels.map(label => `<span class="label">${label}</span>`).join('')}</div>` : ''}
					${assignees.length > 0 ? `<div class="pr-assignees">Assigned to: ${assignees.join(', ')}</div>` : ''}
				</div>
				<div class="pr-body">
					${body}
				</div>
				${comments ? `
					<hr>
					<h2>Comments</h2>
					<div class="pr-comments">
						${comments}
					</div>
				` : ''}
			</div>
		`.trim();
	}

	private createRepositoryHtml(repoInfo: { owner: string; repo: string }, description: string, stars: string, forks: string, language: string, readmeContent: string, recentActivity: string): string {
		return `
			<div class="github-repository">
				<div class="repo-header">
					<h1>${repoInfo.owner}/${repoInfo.repo}</h1>
					${description ? `<p class="repo-description">${description}</p>` : ''}
					<div class="repo-stats">
						<span class="repo-stars">⭐ ${stars}</span>
						<span class="repo-forks">🍴 ${forks}</span>
						${language ? `<span class="repo-language">${language}</span>` : ''}
					</div>
				</div>
				${readmeContent ? `
					<div class="repo-readme">
						<h2>README</h2>
						${readmeContent}
					</div>
				` : ''}
				${recentActivity ? `
					<div class="repo-activity">
						<h2>Recent Activity</h2>
						${recentActivity}
					</div>
				` : ''}
			</div>
		`.trim();
	}

	private createUserProfileHtml(username: string, displayName: string, bio: string, company: string, location: string, website: string, followers: string, following: string, pinnedRepos: string, recentActivity: string): string {
		return `
			<div class="github-user-profile">
				<div class="profile-header">
					<h1>${displayName}</h1>
					<p class="username">@${username}</p>
					${bio ? `<p class="bio">${bio}</p>` : ''}
					<div class="profile-meta">
						${company ? `<div class="company">🏢 ${company}</div>` : ''}
						${location ? `<div class="location">📍 ${location}</div>` : ''}
						${website ? `<div class="website">🔗 ${website}</div>` : ''}
					</div>
					<div class="profile-stats">
						<span class="followers">${followers} followers</span>
						<span class="following">${following} following</span>
					</div>
				</div>
				${pinnedRepos ? `
					<div class="pinned-repositories">
						<h2>Pinned Repositories</h2>
						${pinnedRepos}
					</div>
				` : ''}
				${recentActivity ? `
					<div class="user-activity">
						<h2>Recent Activity</h2>
						${recentActivity}
					</div>
				` : ''}
			</div>
		`.trim();
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
