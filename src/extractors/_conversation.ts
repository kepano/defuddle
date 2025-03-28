import { BaseExtractor } from './_base';
import { ConversationMessage, ConversationMetadata, Footnote, ExtractorResult } from '../types/extractors';
import { Defuddle } from '../defuddle';

export abstract class ConversationExtractor extends BaseExtractor {
	protected abstract extractMessages(): ConversationMessage[];
	protected abstract getMetadata(): ConversationMetadata;
	protected getFootnotes(): Footnote[] {
		return [];
	}

	extract(): ExtractorResult {
		const messages = this.extractMessages();
		const metadata = this.getMetadata();
		const footnotes = this.getFootnotes();
		const rawContentHtml = this.createContentHtml(messages, footnotes);

		// Create a temporary document to run Defuddle on our content
		const tempDoc = document.implementation.createHTMLDocument();
		const container = tempDoc.createElement('article');
		container.innerHTML = rawContentHtml;
		tempDoc.body.appendChild(container);

		// Run Defuddle on our formatted content
		const defuddled = new Defuddle(tempDoc).parse();
		const contentHtml = defuddled.content;

		return {
			content: contentHtml,
			contentHtml: contentHtml,
			extractedContent: {
				messageCount: messages.length.toString(),
			},
			variables: {
				title: metadata.title || 'Conversation',
				site: metadata.site,
				description: metadata.description || `${metadata.site} conversation with ${messages.length} messages`,
				wordCount: defuddled.wordCount?.toString() || '',
			}
		};
	}

	protected createContentHtml(messages: ConversationMessage[], footnotes: Footnote[]): string {
		const messagesHtml = messages.map((message, index) => {
			const timestampHtml = message.timestamp ? 
				`<div class="message-timestamp">${message.timestamp}</div>` : '';

			// Check if content already has paragraph tags
			const hasParagraphs = /<p[^>]*>[\s\S]*?<\/p>/i.test(message.content);
			const contentHtml = hasParagraphs ? message.content : `<p>${message.content}</p>`;

			// Add metadata to data attributes
			const dataAttributes = message.metadata ? 
				Object.entries(message.metadata)
					.map(([key, value]) => `data-${key}="${value}"`)
					.join(' ') : '';

			return `
			<div class="message message-${message.author.toLowerCase()}" ${dataAttributes}>
				<div class="message-header">
					<p class="message-author"><strong>${message.author}</strong></p>
					${timestampHtml}
				</div>
				<div class="message-content">
					${contentHtml}
				</div>
			</div>${index < messages.length - 1 ? '\n<hr>' : ''}`;
		}).join('\n').trim();

		// Add footnotes section if we have any
		const footnotesHtml = footnotes.length > 0 ? `
			<div id="footnotes">
				<ol>
					${footnotes.map((footnote, index) => `
						<li class="footnote" id="fn:${index + 1}">
							<p>
								<a href="${footnote.url}" target="_blank">${footnote.text}</a>&nbsp;<a href="#fnref:${index + 1}" class="footnote-backref">↩</a>
							</p>
						</li>
					`).join('')}
				</ol>
			</div>` : '';

		return `${messagesHtml}\n${footnotesHtml}`.trim();
	}
} 