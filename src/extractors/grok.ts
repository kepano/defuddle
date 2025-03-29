import { ConversationExtractor } from './_conversation';
import { ConversationMessage, ConversationMetadata, Footnote } from '../types/extractors';

export class GrokExtractor extends ConversationExtractor {
	private messageBubbles: NodeListOf<Element> | null;
	private footnotes: Footnote[];
	private footnoteCounter: number;

	constructor(document: Document, url: string) {
		super(document, url);
		this.messageBubbles = document.querySelectorAll('.relative.group.flex.flex-col.justify-center.w-full');
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
		
		this.messageBubbles.forEach((bubble) => {
			// Check if this is a user message (items-end) or Grok response (items-start)
			const isUserMessage = bubble.classList.contains('items-end');
			const isGrokMessage = bubble.classList.contains('items-start');
			
			if (!isUserMessage && !isGrokMessage) return;
			
			let content: string = '';
			let role: string = '';
			
			const messageBubble = bubble.querySelector('.message-bubble');
			if (!messageBubble) return;
			
			if (isUserMessage) {
				// Extract user message content
				const userContent = messageBubble.querySelector('span.whitespace-pre-wrap');
				if (userContent) {
					content = userContent.innerHTML;
					role = 'user';
				}
			} else {
				// Extract Grok response - get the full content of the message bubble
				content = messageBubble.innerHTML;
				role = 'assistant';
				
				// Process any footnotes/links in the content
				content = this.processFootnotes(content);
			}
			
			if (content) {
				messages.push({
					author: role === 'user' ? 'You' : 'Grok',
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
		const messages = this.extractMessages();

		return {
			title,
			site: 'Grok',
			url: this.url,
			messageCount: messages.length,
			description: `Grok conversation with ${messages.length} messages`
		};
	}

	private getTitle(): string {
		// Try to get the page title first
		const pageTitle = this.document.title?.trim();
		if (pageTitle && pageTitle !== 'Grok') {
			// Remove ' - Grok' suffix if present
			return pageTitle.replace(/ - Grok$/, '');
		}
		
		// Find first user message as fallback
		const firstUserBubble = this.document.querySelector('.relative.group.flex.flex-col.justify-center.w-full.items-end');
		if (firstUserBubble) {
			const userContent = firstUserBubble.querySelector('.message-bubble span.whitespace-pre-wrap');
			if (userContent) {
				const text = userContent.textContent || '';
				// Truncate to first 50 characters if longer
				return text.length > 50 ? text.slice(0, 50) + '...' : text;
			}
		}
		
		return 'Grok Conversation';
	}
	
	private processFootnotes(content: string): string {
		// Look for links that should be converted to footnotes
		const linkPattern = /<a\s+(?:[^>]*?\s+)?href="([^"]*)"[^>]*>(.*?)<\/a>/g;
		
		return content.replace(linkPattern, (match, url, linkText) => {
			 // Skip processing for internal anchor links or empty URLs
			if (!url || url.startsWith('#')) {
				return match;
			}
			
			// Check if this URL already exists in our footnotes
			let footnoteIndex = this.footnotes.findIndex(fn => fn.url === url);
			
			if (footnoteIndex === -1) {
				// Create a new footnote if URL doesn't exist
				this.footnoteCounter++;
				footnoteIndex = this.footnoteCounter;
				
				try {
					const domain = new URL(url).hostname.replace(/^www\./, '');
					this.footnotes.push({ 
						url, 
						text: `<a href="${url}">${domain}</a>`
					});
				} catch (e) {
					this.footnotes.push({ 
						url, 
						text: `<a href="${url}">${url}</a>`
					});
				}
			} else {
				// Add 1 to get 1-based index for display
				footnoteIndex++;
			}
			
			// Return the original link text with a footnote reference
			return `${linkText}<span class="" data-state="closed"><sup id="fnref:${footnoteIndex}"><a href="#fn:${footnoteIndex}">${footnoteIndex}</a></sup></span>`;
		});
	}
}
