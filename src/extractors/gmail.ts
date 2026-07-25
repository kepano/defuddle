import { BaseExtractor } from './_base';
import { ExtractorResult } from '../types/extractors';
import { serializeHTML } from '../utils/dom';
import { buildCommentTree, CommentData } from '../utils/comments';

interface EmailMessage {
	author: string;
	email: string;
	/** Raw locale datetime from the .g3 title, e.g. "May 13, 2026, 11:02 PM" */
	date: string;
	/** Message body HTML with quoted history removed */
	content: string;
}

// Gmail renders threads client-side. The DOM uses stable, language-independent
// class names (.adn.ads message rows, h2.hP subject, span.gD sender, span.g3 date,
// div.a3s message body) that do not change with the UI locale. Consumer Gmail and
// Workspace accounts are always served from mail.google.com regardless of country,
// so a single domain pattern covers every region.
//
// Each email is emitted into a `.comments` section via the shared buildCommentTree
// helper — the same structure the Reddit, Hacker News, and GitHub extractors produce.
// This is what the obsidian-clipper reader mode keys its threading features off of
// (initializeComments): the `.comments` wrapper enables per-author colors (hashed from
// each `.comment-author`), the collapse/expand buttons, and hover thread-tracing. An
// email thread is linear, so every message is a top-level comment (depth 0).
export class GmailExtractor extends BaseExtractor {
	canExtract(): boolean {
		return !!this.document.querySelector('.adn.ads');
	}

	extract(): ExtractorResult {
		const messages = this.extractMessages();
		const rows = this.options.includeReplies === false ? messages.slice(0, 1) : messages;

		// Every email is a top-level comment (depth 0). buildCommentTree wraps each in a
		// <blockquote> and emits the .comment / .comment-author / .comment-metadata markup
		// that the reader's threading + author-color features depend on.
		const commentData: CommentData[] = rows.map((m) => ({
			author: m.author,
			date: m.date,
			content: m.content,
			depth: 0,
		}));
		const commentsHtml = buildCommentTree(commentData);
		// Not buildContentHtml(): a thread is comments-only, so the shared helper's
		// post-content block and "Comments" heading would be empty/misleading here.
		const contentHtml = `<article data-defuddle><div class="gmail comments">${commentsHtml}</div></article>`;

		const subject = this.getSubject();
		const first = messages[0];

		return {
			content: contentHtml,
			contentHtml,
			extractedContent: {
				messageCount: messages.length.toString(),
				...(first?.email ? { postAuthor: first.email } : {}),
			},
			variables: {
				title: subject,
				author: first?.author || '',
				site: 'Gmail',
				published: this.toIsoDate(first?.date) || '',
				description: first?.author
					? `Gmail thread from ${first.author} with ${messages.length} messages`
					: `Gmail thread with ${messages.length} messages`,
			},
		};
	}

	private extractMessages(): EmailMessage[] {
		const messages: EmailMessage[] = [];

		this.document.querySelectorAll('.adn.ads').forEach((row) => {
			const sender = row.querySelector('.gD');
			const author = sender?.getAttribute('name')?.trim()
				|| sender?.textContent?.trim()
				|| 'Unknown';
			const email = sender?.getAttribute('email')?.trim() || '';

			const content = this.getMessageBody(row);
			if (!content) return;

			messages.push({ author, email, date: this.getDate(row), content });
		});

		return messages;
	}

	private getDate(row: Element): string {
		const dateEl = row.querySelector('.g3');
		return dateEl?.getAttribute('title')?.trim()
			|| dateEl?.textContent?.trim()
			|| '';
	}

	// Best-effort ISO date for the `published` variable. The .g3 title is locale
	// formatted, so parsing can fail in non-English UIs — return '' rather than
	// an invalid date in that case.
	private toIsoDate(date?: string): string {
		if (!date) return '';
		const parsed = new Date(date);
		if (isNaN(parsed.getTime())) return '';
		return parsed.toISOString().split('T')[0];
	}

	// Quoted prior messages embedded in a reply. Each reply duplicates the message
	// it answers; since we render every message in the thread separately, the quotes
	// are redundant. These selectors are structural (class/attribute/style based) and
	// language-independent — the visible attribution line ("On … wrote:") is localized
	// (e.g. "写道：" in Chinese), so matching it by text would miss non-English clients.
	//   .gmail_quote / .gmail_attr — Gmail desktop and mobile
	//   blockquote[type="cite"] / .moz-cite-prefix — Apple Mail, Thunderbird, Outlook
	//   blockquote[style*="border-left"] — Gmail mobile quote without a class
	//   .yahoo_quoted — Yahoo Mail
	private static readonly QUOTE_SELECTORS = [
		'.gmail_quote',
		'.gmail_attr',
		'.gmail_extra',
		'blockquote[type="cite"]',
		'blockquote[style*="border-left"]',
		'.moz-cite-prefix',
		'.yahoo_quoted',
	].join(', ');

	private getMessageBody(row: Element): string {
		const body = row.querySelector('.a3s');
		if (!body) return '';

		// Clone so we strip quoted history without mutating the live page.
		// Whitespace / empty-paragraph normalization is left to the standardize pipeline.
		const clone = body.cloneNode(true) as Element;
		clone.querySelectorAll(GmailExtractor.QUOTE_SELECTORS).forEach((quote) => quote.remove());

		return serializeHTML(clone).trim();
	}

	private getSubject(): string {
		const subject = this.document.querySelector('h2.hP')?.textContent?.trim();
		if (subject) return subject;

		// Fall back to the document title: "<subject> - <account> - Gmail"
		const pageTitle = this.document.title?.trim() || '';
		return pageTitle.replace(/ - [^-]+ - Gmail$/, '').trim() || 'Gmail thread';
	}
}
