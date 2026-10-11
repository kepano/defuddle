import { ConversationExtractor } from './_conversation';
import { ConversationMessage, ConversationMetadata, Footnote } from '../types/extractors';
import { escapeHtml, serializeHTML } from '../utils/dom';

const USER_MESSAGE_SELECTOR = 'span.select-text';
const ANSWER_SELECTOR = '[id^="markdown-content-"]';
const ANSWER_CONTENT_SELECTOR = '[data-renderer="lm"]';
const CITATION_SELECTOR = '[data-pplx-citation-url]';
const PREPARED_BY_PATTERN = /^Prepared by .+\bThinking$/i;

export class PerplexityExtractor extends ConversationExtractor {
	private answerBlocks: NodeListOf<Element>;
	private cachedMessages: ConversationMessage[] | null = null;
	private footnotes: Footnote[] = [];
	private footnoteIndexes = new Map<string, number>();
	private footnoteReferenceCounts = new Map<number, number>();

	constructor(document: Document, url: string) {
		super(document, url);
		this.answerBlocks = document.querySelectorAll(ANSWER_SELECTOR);
	}

	canExtract(): boolean {
		return Array.from(this.answerBlocks).some(answerBlock =>
			this.getAnswerContentElements(answerBlock).some(element =>
				Boolean(
					element.textContent?.trim() ||
					element.querySelector('img, pre, table, math')
				)
			)
		);
	}

	protected extractMessages(): ConversationMessage[] {
		if (this.cachedMessages) return this.cachedMessages;

		this.footnotes = [];
		this.footnoteIndexes.clear();
		this.footnoteReferenceCounts.clear();

		const messages: ConversationMessage[] = [];
		const userMessageElements = new Set(
			Array.from(this.answerBlocks)
				.map(answerBlock => this.getUserMessageElement(answerBlock))
				.filter((element): element is Element => Boolean(element))
		);
		const messageElements = this.document.querySelectorAll(
			`${USER_MESSAGE_SELECTOR}, ${ANSWER_SELECTOR}`
		);

		messageElements.forEach(element => {
			if (element.matches(USER_MESSAGE_SELECTOR)) {
				if (!userMessageElements.has(element)) return;

				const content = serializeHTML(element).trim();
				if (content) {
					messages.push({
						author: 'You',
						content,
						metadata: { role: 'user' },
					});
				}
				return;
			}

			if (!element.matches(ANSWER_SELECTOR)) return;

			const content = this.extractAnswerContent(element);
			if (content) {
				messages.push({
					author: 'Perplexity',
					content,
					metadata: { role: 'assistant' },
				});
			}
		});

		this.cachedMessages = messages;
		return messages;
	}

	private getUserMessageElement(answerBlock: Element): Element | null {
		for (
			let container = answerBlock.parentElement;
			container && container !== this.document.body;
			container = container.parentElement
		) {
			const userMessages = container.querySelectorAll(USER_MESSAGE_SELECTOR);
			const answers = container.querySelectorAll(ANSWER_SELECTOR);

			if (userMessages.length === 1 && answers.length === 1) {
				return userMessages[0];
			}

			if (answers.length > 1) break;
		}

		return null;
	}

	protected getFootnotes(): Footnote[] {
		return this.footnotes;
	}

	protected getMetadata(): ConversationMetadata {
		const messages = this.extractMessages();
		return {
			title: this.getTitle(messages),
			site: 'Perplexity',
			url: this.url,
			messageCount: messages.length,
			description: `Perplexity conversation with ${messages.length} messages`,
		};
	}

	private extractAnswerContent(answerBlock: Element): string {
		return this.getAnswerContentElements(answerBlock)
			.map(element => {
				const clone = element.cloneNode(true) as Element;
				this.removeNoise(clone);
				this.processCitations(clone);
				return serializeHTML(clone).trim();
			})
			.filter(Boolean)
			.join('\n');
	}

	private getAnswerContentElements(answerBlock: Element): Element[] {
		const candidates = [
			...(answerBlock.matches(ANSWER_CONTENT_SELECTOR) ? [answerBlock] : []),
			...Array.from(answerBlock.querySelectorAll(ANSWER_CONTENT_SELECTOR))
				.filter(candidate => candidate.closest(ANSWER_SELECTOR) === answerBlock),
		];

		// Keep outermost renderer nodes so nested wrappers are not serialized twice.
		return candidates.filter(candidate =>
			!candidates.some(other => other !== candidate && other.contains(candidate))
		);
	}

	private removeNoise(root: Element): void {
		root.querySelectorAll(
			'[data-saveai-injected], [data-ask-input-container], #ask-input, button, [role="button"]'
		).forEach(element => element.remove());

		root.querySelectorAll('.citation-nbsp').forEach(element => {
			element.replaceWith(this.document.createTextNode(' '));
		});

		const preparedByElements = Array.from(root.querySelectorAll('*'))
			.filter(element => PREPARED_BY_PATTERN.test(element.textContent?.trim() || ''))
			.filter(element =>
				!Array.from(element.children).some(child =>
					PREPARED_BY_PATTERN.test(child.textContent?.trim() || '')
				)
			);

		preparedByElements.forEach(element => element.remove());
	}

	private processCitations(root: Element): void {
		root.querySelectorAll(CITATION_SELECTOR).forEach(citation => {
			const rawUrl = citation.getAttribute('data-pplx-citation-url')?.trim() || '';
			const url = this.getHttpUrl(rawUrl);
			if (!url) {
				citation.replaceWith(...Array.from(citation.childNodes));
				return;
			}

			let footnoteIndex = this.footnoteIndexes.get(url);
			if (!footnoteIndex) {
				footnoteIndex = this.footnotes.length + 1;
				this.footnoteIndexes.set(url, footnoteIndex);
				this.footnotes.push({
					url,
					text: this.getCitationLabel(citation, url),
				});
			}

			const referenceCount = (this.footnoteReferenceCounts.get(footnoteIndex) || 0) + 1;
			this.footnoteReferenceCounts.set(footnoteIndex, referenceCount);

			const reference = this.document.createElement('sup');
			reference.id = referenceCount === 1
				? `fnref:${footnoteIndex}`
				: `fnref:${footnoteIndex}-${referenceCount}`;
			reference.className = 'footnote-ref';

			const link = this.document.createElement('a');
			link.setAttribute('href', `#fn:${footnoteIndex}`);
			link.className = 'footnote-link';
			link.textContent = footnoteIndex.toString();

			reference.appendChild(link);
			citation.replaceWith(reference);
		});
	}

	private getCitationLabel(citation: Element, url: string): string {
		const visibleText = (citation.textContent || '')
			.replace(/\+\d+\s*$/, '')
			.trim();
		if (visibleText) return escapeHtml(visibleText);

		try {
			return escapeHtml(new URL(url).hostname.replace(/^www\./, ''));
		} catch {
			return escapeHtml(url);
		}
	}

	private getHttpUrl(url: string): string | null {
		try {
			const parsed = new URL(url, this.url);
			return parsed.protocol === 'http:' || parsed.protocol === 'https:'
				? parsed.href
				: null;
		} catch {
			return null;
		}
	}

	private getTitle(messages: ConversationMessage[]): string {
		const pageTitle = this.document.title?.trim() || '';
		const cleanedTitle = pageTitle
			.replace(/\s*[-|]\s*Perplexity(?: AI)?$/i, '')
			.trim();
		if (cleanedTitle && !/^Perplexity(?: AI)?$/i.test(cleanedTitle)) {
			return cleanedTitle;
		}

		const firstUserMessage = messages.find(message => message.metadata?.role === 'user');
		const text = firstUserMessage?.content
			.replace(/<[^>]+>/g, ' ')
			.replace(/\s+/g, ' ')
			.trim() || '';
		if (text) {
			return text.length > 80 ? `${text.slice(0, 80)}...` : text;
		}

		return 'Perplexity Conversation';
	}
}
