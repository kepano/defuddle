import { ConversationExtractor } from './_conversation';
import { ConversationMessage, ConversationMetadata, Footnote } from '../types/extractors';

export class ChatGPTExtractor extends ConversationExtractor {
	private articles: NodeListOf<Element> | null;
	private footnotes: Footnote[];
	private footnoteCounter: number;

	constructor(document: Document, url: string) {
		super(document, url);
		this.articles = document.querySelectorAll('article[data-testid^="conversation-turn-"]');
		this.footnotes = [];
		this.footnoteCounter = 0;
	}

	canExtract(): boolean {
		return !!this.articles && this.articles.length > 0;
	}

	protected extractMessages(): ConversationMessage[] {
		const messages: ConversationMessage[] = [];
		this.footnotes = [];
		this.footnoteCounter = 0;

		if (!this.articles) return messages;

		this.articles.forEach((article) => {
			// Get the localized author text from the sr-only heading and clean it
			const authorElement = article.querySelector('h5.sr-only, h6.sr-only');
			const authorText = authorElement?.textContent
				?.trim()
				?.replace(/:\s*$/, '') // Remove colon and any trailing whitespace
				|| '';

			let currentAuthorRole = '';

			const authorRole = article.getAttribute('data-message-author-role');
			if (authorRole) {
				currentAuthorRole = authorRole;
			}

			let messageContent = article.innerHTML || '';
			messageContent = messageContent.replace(/\u200B/g, '');

			// Remove specific elements from the message content
			const tempDiv = document.createElement('div');
			tempDiv.innerHTML = messageContent;
			tempDiv.querySelectorAll('h5.sr-only, h6.sr-only, span[data-state="closed"]').forEach(el => el.remove());
			messageContent = tempDiv.innerHTML;

			// Process inline references using regex to find the containers
			// Look for spans containing citation links, replacing entire structure
			const containerPattern = /(?:<\/p>)?<div class="relative inline-flex[^>]*>.*?<\/div>|<span[^>]*>(?:<div class="relative inline-flex[^>]*>|<div[^>]*class="[^"]*relative inline-flex[^>]*>).*?<\/div><\/span>/g;
			messageContent = messageContent.replace(containerPattern, (match) => {
				// Extract URL from the match
				const urlMatch = match.match(/href="([^"]+)"/);
				if (!urlMatch) return match;

				const url = urlMatch[1];
				let domain = '';
				let fragmentText = '';
				
				try {
					// Extract domain without www.
					domain = new URL(url).hostname.replace(/^www\./, '');
					
					// Extract and decode the fragment text if it exists
					const hashParts = url.split('#:~:text=');
					if (hashParts.length > 1) {
						fragmentText = decodeURIComponent(hashParts[1]);
						// Replace URL-encoded commas and clean up
						fragmentText = fragmentText.replace(/%2C/g, ',');
						
						// Split the fragment into start and end if it contains a comma
						const parts = fragmentText.split(',');
						if (parts.length > 1 && parts[0].trim()) {
							// Only show first part with ellipsis if it has content
							fragmentText = ` — ${parts[0].trim()}...`;
						} else if (parts[0].trim()) {
							// If no comma but has content, wrap the whole text
							fragmentText = ` — ${fragmentText.trim()}`;
						} else {
							// If no content, don't show fragment text at all
							fragmentText = '';
						}
					}
				} catch (e) {
					domain = url;
				}

				// Check if this URL already exists in our footnotes
				let footnoteIndex = this.footnotes.findIndex(fn => fn.url === url);
				if (footnoteIndex === -1) {
					// Only create new footnote if URL doesn't exist
					this.footnoteCounter++;
					footnoteIndex = this.footnoteCounter;  // Keep it 1-based
					this.footnotes.push({ 
						url, 
						text: `<a href="${url}">${domain}</a>${fragmentText}`
					});
				} else {
					// Use existing footnote index (already 1-based since we never subtracted 1)
					footnoteIndex++;
				}
				
				// Return just the footnote reference
				return `<span class="" data-state="closed"><sup id="fnref:${footnoteIndex}"><a href="#fn:${footnoteIndex}">${footnoteIndex}</a></sup></span>`;
			});

			// Clean up any empty spans and stray paragraph tags
			messageContent = messageContent
				.replace(/<span[^>]*>\s*<\/span>/g, '')
				.replace(/<p[^>]*>\s*<\/p>/g, '');

			messages.push({
				author: authorText,
				content: messageContent.trim(),
				metadata: {
					role: currentAuthorRole || 'unknown'
				}
			});

		});

		return messages;
	}

	protected getFootnotes(): Footnote[] {
		return this.footnotes;
	}

	protected getMetadata(): ConversationMetadata {
		const title = this.getTitle();
		const messages = this.extractMessages();

		return {
			title,
			site: 'ChatGPT',
			url: this.url,
			messageCount: messages.length,
			description: `ChatGPT conversation with ${messages.length} messages`
		};
	}

	private getTitle(): string {
		// Try to get the page title first
		const pageTitle = this.document.title?.trim();
		if (pageTitle && pageTitle !== 'ChatGPT') {
			return pageTitle;
		}

		// Fall back to first user message
		const firstUserTurn = this.articles?.item(0)?.querySelector('.text-message');
		if (firstUserTurn) {
			const text = firstUserTurn.textContent || '';
			// Truncate to first 50 characters if longer
			return text.length > 50 ? text.slice(0, 50) + '...' : text;
		}

		return 'ChatGPT Conversation';
	}
} 