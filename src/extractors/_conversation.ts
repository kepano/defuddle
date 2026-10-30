import { BaseExtractor } from './_base';
import { ConversationMessage, ConversationMetadata, Footnote, ExtractorResult } from '../types/extractors';
import { Defuddle } from '../defuddle';
import { parseHTML, escapeHtml } from '../utils/dom';

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
		const tempDoc = this.createTemporaryDocument();
		const container = tempDoc.createElement('article');
		container.appendChild(parseHTML(tempDoc, rawContentHtml));
		tempDoc.body.appendChild(container);

		// Run Defuddle on our formatted content
		const defuddled = new Defuddle(tempDoc, { url: 'about:blank' }).parse();
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

	private createTemporaryDocument(): Document {
		const implementation = this.document.implementation;
		if (implementation?.createHTMLDocument) {
			return implementation.createHTMLDocument();
		}

		const DOMParserCtor = this.document.defaultView?.DOMParser || globalThis.DOMParser;
		if (DOMParserCtor) {
			return new DOMParserCtor().parseFromString('<!doctype html><html><body></body></html>', 'text/html');
		}

		throw new Error('Unable to create a temporary document for conversation extraction');
	}

	protected createContentHtml(messages: ConversationMessage[], footnotes: Footnote[]): string {
		const messagesHtml = messages.map((message, index) => {
			const timestampHtml = message.timestamp ?
				`<div class="message-timestamp">${escapeHtml(message.timestamp)}</div>` : '';

			// Check if content already has paragraph tags
			const hasParagraphs = /<p[^>]*>[\s\S]*?<\/p>/i.test(message.content);
			// The one value that is deliberately raw: subclasses build it from page
			// nodes they have already serialized. Everything else here is escaped.
			const contentHtml = hasParagraphs ? message.content : `<p>${message.content}</p>`;

			// Add metadata to data attributes. The key becomes part of an attribute
			// name, where escaping does not apply. A key holding a space or a quote
			// would start a new attribute, so restrict it to the characters a name
			// can hold and drop anything else.
			const dataAttributes = message.metadata ?
				Object.entries(message.metadata)
					.filter(([key]) => /^[a-z][a-z0-9-]*$/i.test(key))
					.map(([key, value]) => `data-${key}="${escapeHtml(value)}"`)
					.join(' ') : '';

			return `
			<div class="message message-${escapeHtml(message.author.toLowerCase())}" ${dataAttributes}>
				<div class="message-header">
					<p class="message-author"><strong>${escapeHtml(message.author)}</strong></p>
					${timestampHtml}
				</div>
				<div class="message-content">
					${contentHtml}
				</div>
			</div>${index < messages.length - 1 ? '\n<hr>' : ''}`;
		}).join('\n').trim();

		// Add footnotes section if we have any. `footnote.text` is raw HTML by
		// contract (subclasses build a full <a> into it), so it is escaped at each
		// construction site instead of here.
		const footnotesHtml = footnotes.length > 0 ? `
			<div id="footnotes">
				<ol>
					${footnotes.map((footnote, index) => `
						<li class="footnote" id="fn:${index + 1}">
							<p>
								<a href="${escapeHtml(footnote.url)}" target="_blank">${footnote.text}</a>&nbsp;<a href="#fnref:${index + 1}" class="footnote-backref">↩</a>
							</p>
						</li>
					`).join('')}
				</ol>
			</div>` : '';

		return `${messagesHtml}\n${footnotesHtml}`.trim();
	}
}
