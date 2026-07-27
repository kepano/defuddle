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

	// Everything that is not message text. Removed in a single pass: querySelectorAll
	// snapshots the tree, so removing a node already detached with its ancestor is a
	// no-op. The removal pipeline never sees extractor output, so this is the only
	// chance to strip any of it.
	private static readonly REMOVE_SELECTORS = [
		// Quoted prior messages embedded in a reply. Each reply duplicates the message
		// it answers; since we render every message in the thread separately, the quotes
		// are redundant. These selectors are structural (class/attribute/style based) and
		// language-independent — the visible attribution line ("On … wrote:") is localized
		// (e.g. "写道：" in Chinese), so matching it by text would miss non-English clients.
		'.gmail_quote', // Gmail desktop and mobile
		'.gmail_attr',
		'.gmail_extra',
		'blockquote[type="cite"]', // Apple Mail, Thunderbird, Outlook
		'.moz-cite-prefix',
		'blockquote[style*="border-left"]', // Gmail mobile quote without a class
		'.yahoo_quoted', // Yahoo Mail

		// Gmail's own UI widgets, which it injects *inside* the message body and so
		// survive the `.a3s` boundary.
		'.a6S', // hover overlay on inline images (Download / Add to Drive / Save to Photos)
		'.adL', // the block collapsed behind the "…" button: quoted history and repeated
		        // signatures, duplicated from messages we already render separately
		'.h5',  // that collapsed block when it is not wrapped in .adL
		'.adm', // the "…" toggle button and its container
		'.ajR',
		'.ajT',
		'.h4',
		'.yj6qo', // zero-height spacer inserted around collapsed blocks
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

	// Removing quotes and chrome leaves the <br> run that separated the message from
	// them dangling at the end of the body, which renders as a stack of empty lines.
	// Only the trailing edge is trimmed — blank lines *between* paragraphs are the
	// message's own spacing.
	private static trimTrailingBlanks(el: Element): void {
		while (el.lastChild && GmailExtractor.isBlank(el.lastChild)) {
			el.removeChild(el.lastChild);
		}
		// The survivor holds text or media, so it stays — but its own trailing edge
		// still needs trimming. It cannot become blank in the process: the recursion
		// only ever removes blank nodes, which carry neither text nor media.
		const last = el.lastChild;
		if (last && isElement(last)) GmailExtractor.trimTrailingBlanks(last);
	}

	// Tags that can wrap part of a visual line. Gmail scatters <br> inside these
	// (notably span.im, its "quoted text" marker), so line splitting has to see through
	// them; every other tag starts a new block and therefore a new line. The shared set
	// is missing the legacy and replaced-element tags that arbitrary sender HTML still
	// uses, so extend it rather than restating it.
	private static readonly INLINE_TAGS = new Set([
		...INLINE_ELEMENTS,
		'bdi', 'bdo', 'big', 'img', 'kbd', 'label', 's', 'samp', 'strike', 'tt', 'var', 'wbr',
	]);

	// Plain-text messages (Apple Mail, most phone clients) reach Gmail as text nodes
	// separated by <br>, so their quoted history arrives as literal "> " prefixed
	// lines with no wrapper element for QUOTE_SELECTORS to match. Gmail collapses only
	// part of it — the attribution line and anything before the "…" toggle stays behind.
	// Drop every "> " line instead: the messages they quote are rendered separately, and
	// the marker is a plain-text convention, not a localized string.
	private static stripPlainTextQuotes(root: Element): void {
		// A line can span several nodes — a quoted line with an autolinked address is
		// text + <a> + text — so collect whole runs and test their combined text. The
		// terminating <br> joins the run: it contributes no text, and a dropped line
		// should take its line break with it.
		const lines: ChildNode[][] = [];
		let line: ChildNode[] = [];
		const endLine = () => {
			lines.push(line);
			line = [];
		};

		// Which inline wrappers have to be descended into, resolved in one upward sweep
		// from each <br>. Asking each wrapper `querySelector('br')` instead would rescan
		// its subtree, then rescan it again on a hit when the walk descends.
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
					// Descend only when the wrapper splits lines; otherwise the element
					// belongs to the current line as a single unit.
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
