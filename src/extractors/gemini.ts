import { ConversationExtractor } from './_conversation';
import { ConversationMessage, ConversationMetadata, Footnote } from '../types/extractors';

export class GeminiExtractor extends ConversationExtractor {
	private conversationContainers: NodeListOf<Element> | null;
	private footnotes: Footnote[];
	private messageCount: number | null = null;

	constructor(document: Document, url: string) {
		super(document, url);
		this.conversationContainers = document.querySelectorAll('div.conversation-container');
		this.footnotes = [];
	}

	canExtract(): boolean {
		return !!this.conversationContainers && this.conversationContainers.length > 0;
	}

	protected extractMessages(): ConversationMessage[] {
		this.messageCount = 0;
		const messages: ConversationMessage[] = [];

		if (!this.conversationContainers) return messages;

		this.extractSources();

		this.conversationContainers.forEach((container) => {
			const userQuery = container.querySelector('user-query');
			if (userQuery) {
				const queryText = userQuery.querySelector('.query-text');
				if (queryText) {
					const content = queryText.innerHTML || '';
					messages.push({
						author: 'You',
						content: content.trim(),
						metadata: { role: 'user' }
					});
				}
			}

			const modelResponse = container.querySelector('model-response');
			if (modelResponse) {
				const regularContent = modelResponse.querySelector('.model-response-text .markdown');
				const extendedContent = modelResponse.querySelector('#extended-response-markdown-content');
				const contentElement = extendedContent || regularContent;

				if (contentElement) {
					let content = contentElement.innerHTML || '';
					
					const tempDiv = document.createElement('div');
					tempDiv.innerHTML = content;
					
					tempDiv.querySelectorAll('.table-content').forEach(el => {
						// `table-content` is a PARTIAL selector in defuddle (table of contents, will be removed), but a real table in Gemini (should be kept).
						el.classList.remove('table-content');
					});
					
					content = tempDiv.innerHTML;
					
					messages.push({
						author: 'Gemini',
						content: content.trim(),
						metadata: { role: 'assistant' }
					});
				}
			}
		});
		this.messageCount = messages.length;
		return messages;
	}

	private extractSources(): void {
		const browseItems = this.document.querySelectorAll('browse-item');
		
		if (browseItems && browseItems.length > 0) {
			browseItems.forEach(item => {
				const link = item.querySelector('a');
				if (link instanceof HTMLAnchorElement) {
					const url = link.href;
					const domain = link.querySelector('.domain')?.textContent?.trim() || '';
					const title = link.querySelector('.title')?.textContent?.trim() || '';
					
					if (url && (domain || title)) {
						this.footnotes.push({
							url,
							text: title ? `${domain}: ${title}` : domain
						});
					}
				}
			});
		}
	}

	protected getFootnotes(): Footnote[] {
		return this.footnotes;
	}

	protected getMetadata(): ConversationMetadata {
		const title = this.getTitle();
		const messageCount = this.messageCount ?? this.extractMessages().length;
		return {
			title,
			site: 'Gemini',
			url: this.url,
			messageCount,
			description: `Gemini conversation with ${messageCount} messages`
		};
	}

	private getTitle(): string {
		const pageTitle = this.document.title?.trim();
		if (pageTitle && pageTitle !== 'Gemini' && !pageTitle.includes('Gemini')) {
			return pageTitle;
		}

		const researchTitle = this.document.querySelector('.title-text')?.textContent?.trim();
		if (researchTitle) {
			return researchTitle;
		}

		const firstUserQuery = this.conversationContainers?.item(0)?.querySelector('.query-text');
		if (firstUserQuery) {
			const text = firstUserQuery.textContent || '';
			return text.length > 50 ? text.slice(0, 50) + '...' : text;
		}

		return 'Gemini Conversation';
	}
}
