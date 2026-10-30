import { BaseExtractor } from './_base';
import { ExtractorResult } from '../types/extractors';
import { serializeHTML } from '../utils/dom';
import { isElement } from '../utils';
import { INLINE_ELEMENTS } from '../constants';
import { buildCommentTree, CommentData } from '../utils/comments';

interface EmailMessage {
	author: string;
	email: string;
	/** Raw locale datetime from the .g3 title, e.g. "May 13, 2026, 11:02 PM" */
	date: string;
	/** Message body HTML with quoted history removed */
	content: string;
}

// Gmail's class names are obfuscated but stable, and identical in every UI locale
// (.adn.ads message row, h2.hP subject, .gD sender, .g3 date, .a3s body). Match on
// them, never on visible text.
export class GmailExtractor extends BaseExtractor {
	canExtract(): boolean {
		return !!this.document.querySelector('.adn.ads');
	}

	extract(): ExtractorResult {
		const messages = this.extractMessages();
		const rows = this.options.includeReplies === false ? messages.slice(0, 1) : messages;

		// An email thread is linear, so every message is a top-level comment.
		const commentData: CommentData[] = rows.map((m) => ({
			author: m.author,
			date: m.date,
			content: m.content,
			depth: 0,
		}));
		const commentsHtml = buildCommentTree(commentData);
		// Not buildContentHtml(): a thread is comments-only, so its post block and
		// "Comments" heading would come out empty.
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

	// Local calendar parts, not toISOString(): the title carries no timezone, so it
	// parses as local time and converting to UTC rolls an evening timestamp into the
	// next day west of Greenwich. Locale-formatted titles that fail to parse yield ''
	// rather than a wrong date.
	private toIsoDate(date?: string): string {
		if (!date) return '';
		const parsed = new Date(date);
		if (isNaN(parsed.getTime())) return '';
		const month = String(parsed.getMonth() + 1).padStart(2, '0');
		const day = String(parsed.getDate()).padStart(2, '0');
		return `${parsed.getFullYear()}-${month}-${day}`;
	}

	// Everything that is not message text. The removal pipeline never sees extractor
	// output, so this is the only chance to strip any of it.
	private static readonly REMOVE_SELECTORS = [
		// Quoted history. Every message is rendered separately, so quotes are duplicates.
		// Matched structurally because the attribution line ("On … wrote:") is localized.
		'.gmail_quote', // Gmail desktop and mobile
		'.gmail_attr',
		'.gmail_extra',
		'blockquote[type="cite"]', // Apple Mail, Thunderbird, Outlook
		'.moz-cite-prefix',
		'blockquote[style*="border-left"]', // Gmail mobile quote without a class
		'.yahoo_quoted', // Yahoo Mail

		// Gmail UI widgets, injected inside the body and so surviving the .a3s boundary.
		'.a6S', // image hover toolbar (Download / Add to Drive / Save to Photos)
		'.adL', // block collapsed behind the "…" button: quoted history, repeated signatures
		'.h5',  // that collapsed block when not wrapped in .adL
		'.adm', // the "…" toggle and its container
		'.ajR',
		'.ajT',
		'.h4',
		'.yj6qo', // zero-height spacer around collapsed blocks
	].join(', ');

	private getMessageBody(row: Element): string {
		const body = row.querySelector('.a3s');
		if (!body) return '';

		// Clone so we strip quoted history and chrome without mutating the live page.
		const clone = body.cloneNode(true) as Element;
		clone.querySelectorAll(GmailExtractor.REMOVE_SELECTORS).forEach((el) => el.remove());
		GmailExtractor.stripPlainTextQuotes(clone);
		GmailExtractor.trimTrailingBlanks(clone);

		return serializeHTML(clone).trim();
	}

	private static readonly MEDIA_SELECTOR = 'img, picture, video, audio, iframe, svg, canvas, object, embed';

	private static isBlank(node: Node): boolean {
		if (!isElement(node)) return !(node.textContent || '').trim();
		if ((node.textContent || '').trim()) return false;
		// Textless, but media still counts as content. querySelector only sees
		// descendants, so the element itself has to be tested separately.
		return !(node.matches?.(GmailExtractor.MEDIA_SELECTOR) || node.querySelector(GmailExtractor.MEDIA_SELECTOR));
	}

	// Removing quotes and chrome strands the <br> run that separated them from the
	// message. Only the trailing edge goes. Blank lines between paragraphs are the
	// message's own spacing.
	private static trimTrailingBlanks(el: Element): void {
		while (el.lastChild && GmailExtractor.isBlank(el.lastChild)) {
			el.removeChild(el.lastChild);
		}
		// The survivor holds text or media, but its own trailing edge still needs it.
		const last = el.lastChild;
		if (last && isElement(last)) GmailExtractor.trimTrailingBlanks(last);
	}

	// Tags that wrap part of a visual line, so line splitting has to see through them.
	// Extends the shared set with legacy and replaced-element tags that arbitrary
	// sender HTML still uses.
	private static readonly INLINE_TAGS = new Set([
		...INLINE_ELEMENTS,
		'bdi', 'bdo', 'big', 'img', 'kbd', 'label', 's', 'samp', 'strike', 'tt', 'var', 'wbr',
	]);

	// Plain-text messages (Apple Mail, most phone clients) quote with literal "> " lines
	// and no wrapper for REMOVE_SELECTORS to match, and Gmail collapses only the tail of
	// them. Drop every "> " line: it is a plain-text convention, not a localized string.
	private static stripPlainTextQuotes(root: Element): void {
		// One line can span several nodes (a quoted line with an autolinked address is
		// text + <a> + text), so collect whole runs and test their combined text. The
		// terminating <br> joins its run so a dropped line takes its break with it.
		const lines: ChildNode[][] = [];
		let line: ChildNode[] = [];
		const endLine = () => {
			lines.push(line);
			line = [];
		};

		// Which wrappers to descend into, in one upward sweep from each <br>. Asking each
		// wrapper querySelector('br') instead rescans its subtree, twice on a hit.
		const splitsLines = new Set<Node>();
		root.querySelectorAll('br').forEach((br) => {
			for (let p = br.parentNode; p && p !== root && !splitsLines.has(p); p = p.parentNode) {
				splitsLines.add(p);
			}
		});

		const walk = (parent: Element) => {
			Array.from(parent.childNodes).forEach((node) => {
				if (!isElement(node)) {
					line.push(node);
					return;
				}
				const tag = node.tagName.toLowerCase();
				if (tag === 'br') {
					line.push(node);
					endLine();
				} else if (GmailExtractor.INLINE_TAGS.has(tag)) {
					// An inline wrapper with no <br> belongs to the current line whole.
					if (splitsLines.has(node)) walk(node);
					else line.push(node);
				} else {
					// A block child both ends the enclosing line and starts fresh.
					endLine();
					walk(node);
					endLine();
				}
			});
		};

		walk(root);
		endLine();

		// Mutate only after the walk so removals cannot disturb the traversal.
		lines.forEach((nodes) => {
			const text = nodes.map((node) => node.textContent || '').join('');
			if (!/^\s*>/.test(text)) return;
			nodes.forEach((node) => node.parentNode?.removeChild(node));
		});
	}

	private getSubject(): string {
		const subject = this.document.querySelector('h2.hP')?.textContent?.trim();
		if (subject) return subject;

		// Fall back to the document title: "<subject> - <account> - Gmail"
		const pageTitle = this.document.title?.trim() || '';
		return pageTitle.replace(/ - [^-]+ - Gmail$/, '').trim() || 'Gmail thread';
	}
}
