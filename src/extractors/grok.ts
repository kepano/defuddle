import { ConversationExtractor } from './_conversation';
import { ConversationMessage, ConversationMetadata, Footnote } from '../types/extractors';
import { serializeHTML } from '../utils/dom';

export class GrokExtractor extends ConversationExtractor {
	// Note: This selector relies heavily on CSS utility classes and may break if Grok's UI changes.
	private messageContainerSelector = '.relative.group.flex.flex-col.justify-center.w-full';
	private messageBubbles: NodeListOf<Element> | null;
	private footnotes: Footnote[];
	private footnoteCounter: number;

	constructor(document: Document, url: string) {
		super(document, url);
		this.messageBubbles = document.querySelectorAll(this.messageContainerSelector);
		this.footnotes = [];
		this.footnoteCounter = 0;
	}

	canExtract(): boolean {
		return !!this.messageBubbles && this.messageBubbles.length > 0;
	}

	protected extractMessages(): ConversationMessage[] {
		const messages: ConversationMessage[] = [];
		this.footnotes = [];
		this.footnoteCounter = 0;

		if (!this.messageBubbles || this.messageBubbles.length === 0) return messages;

		this.messageBubbles.forEach((container) => {
			// Note: Relies on layout classes 'items-end' and 'items-start' which might change.
			const isUserMessage = container.classList.contains('items-end');
			const isGrokMessage = container.classList.contains('items-start');

			if (!isUserMessage && !isGrokMessage) return; // Skip elements that aren't clearly user or Grok messages

			const messageBubble = container.querySelector('.message-bubble');
			if (!messageBubble) return; // Skip if the core message bubble isn't found

			let content: string = '';
			let role: string = '';
			let author: string = '';

			if (isUserMessage) {
				// Assume user message bubble's textContent is the desired content.
				// This is simpler and potentially less brittle than selecting specific spans.
				content = messageBubble.textContent || '';
				role = 'user';
				author = 'You'; // Or potentially extract from an attribute if available later
			} else if (isGrokMessage) {
				role = 'assistant';
				author = 'Grok'; // Or potentially extract from an attribute if available later

				// Clone the bubble to modify it without affecting the original page
				const clonedBubble = messageBubble.cloneNode(true) as Element;

				// Remove known non-content elements like the DeepSearch artifact
				clonedBubble.querySelector('.relative.border.border-border-l1.bg-surface-base')?.remove();
				// Add selectors here for any other known elements to remove (e.g., buttons, toolbars within the bubble)

				content = serializeHTML(clonedBubble);

				// Process footnotes/links in the cleaned content
				content = this.processFootnotes(content);
			}

			if (content.trim()) {
				messages.push({
					author: author,
					content: content.trim(),
					metadata: {
						role: role
					}
				});
			}
		});

		return messages;
	}

	protected getFootnotes(): Footnote[] {
		return this.footnotes;
	}

	protected getMetadata(): ConversationMetadata {
		const title = this.getTitle();
		const messageCount = this.messageBubbles?.length || 0;

		return {
			title,
			site: 'Grok',
			url: this.url,
			messageCount: messageCount, // Use estimated count
			description: `Grok conversation with ${messageCount} messages`
		};
	}

	private getTitle(): string {
		// Try to get the page title first (more reliable)
		const pageTitle = this.document.title?.trim();
		if (pageTitle && pageTitle !== 'Grok' && !pageTitle.startsWith('Grok by ')) {
			// Remove ' - Grok' suffix if present
			return pageTitle.replace(/\s-\s*Grok$/, '').trim();
		}

		// Fallback: Find the first user message bubble and use its text content
		// Note: Still relies on 'items-end' class.
		const firstUserContainer = this.document.querySelector(`${this.messageContainerSelector}.items-end`);
		if (firstUserContainer) {
			const messageBubble = firstUserContainer.querySelector('.message-bubble');
			if (messageBubble) {
				const text = messageBubble.textContent?.trim() || '';
				// Truncate to first 50 characters if longer
				return text.length > 50 ? text.slice(0, 50) + '...' : text;
			}
		}

		return 'Grok Conversation'; // Default fallback
	}

	private processFootnotes(content: string): string {
		// Regex to find <a> tags, capture href and link text
		const linkPattern = /<a\s+(?:[^>]*?\s+)?href="([^"]*)"[^>]*>(.*?)<\/a>/gi; // Use 'g' and 'i' flags

		return content.replace(linkPattern, (match, url, linkText) => {
			 // Skip processing for internal anchor links, empty URLs, or non-http(s) protocols
			if (!url || url.startsWith('#') || !url.match(/^https?:\/\//i)) {
				return match;
			}

			// Check if this URL already exists in our footnotes
			let footnote = this.footnotes.find(fn => fn.url === url);
			let footnoteIndex: number;

			if (!footnote) {
				// Create a new footnote if URL doesn't exist
				this.footnoteCounter++;
				footnoteIndex = this.footnoteCounter;

				let domainText = url; // Default to full URL if parsing fails
				try {
					const domain = new URL(url).hostname.replace(/^www\./, '');
					domainText = `<a href="${url}" target="_blank" rel="noopener noreferrer">${domain}</a>`;
				} catch (e) {
					// Keep domainText as the original URL if parsing fails
					domainText = `<a href="${url}" target="_blank" rel="noopener noreferrer">${url}</a>`;
					console.warn(`GrokExtractor: Could not parse URL for footnote: ${url}`);
				}

				this.footnotes.push({
					url,
					text: domainText // Store the link HTML directly
				});
			} else {
				// Find the 1-based index of the existing footnote
				footnoteIndex = this.footnotes.findIndex(fn => fn.url === url) + 1;
			}

			// Return the original link text wrapped with a footnote reference
			// Ensure the link text itself is not clickable again if it was part of the original match
			return `${linkText}<sup id="fnref:${footnoteIndex}" class="footnote-ref"><a href="#fn:${footnoteIndex}" class="footnote-link">${footnoteIndex}</a></sup>`;
		});
	}
}
