import { BaseExtractor } from './_base';
import { ExtractorResult } from '../types/extractors';
import { parseHTML, serializeHTML, escapeHtml } from '../utils/dom';
import { buildCommentTree, buildContentHtml, buildQuotedPost, type CommentData } from '../utils/comments';

export class TwitterExtractor extends BaseExtractor {
	private mainTweet: Element | null = null;
	private threadTweets: Element[] = [];
	private replyTweets: Element[] = [];
	private replyDepths: number[] = [];

	constructor(document: Document, url: string) {
		super(document, url);

		this.classifyCells(this.conversationCells());

		// A markup change must never yield nothing: a bare post beats falling
		// through to the generic extractor, which produces unusable output.
		if (!this.mainTweet) {
			this.mainTweet = document.querySelector('article[data-testid="tweet"]');
		}
	}

	/**
	 * Conversation cells, in document order, stopping at X's "Discover more" and
	 * similar trailing sections.
	 *
	 * Cells and boundary candidates are collected in one combined-selector query
	 * so that document order comes from the query itself. Comparing positions
	 * any other way would mean `compareDocumentPosition`, which cannot be used
	 * here: the `Node` global is absent under linkedom, and linkedom inverts the
	 * result for nodes at different depths.
	 *
	 * Anything before the first cell is a header, not a boundary — X renders a
	 * "Post" heading above the timeline and wraps the conversation in a
	 * `<section>`, and treating either as the boundary drops every tweet.
	 */
	private conversationCells(): Element[] {
		const cells: Element[] = [];

		for (const el of Array.from(this.document.querySelectorAll('[data-testid="cellInnerDiv"], section, h2'))) {
			if (el.getAttribute('data-testid') === 'cellInnerDiv') {
				cells.push(el);
			} else if (cells.length && !el.closest('article[data-testid="tweet"]')) {
				// A heading inside a tweet belongs to that tweet, not to a boundary.
				break;
			}
		}

		return cells;
	}

	/**
	 * Walk cells to classify tweets:
	 * 1. Main tweet (first article)
	 * 2. Thread tweets: consecutive self-replies by the main author at the top of
	 *    the timeline, before any reply by a different person
	 * 3. Reply tweets: everything after the thread ends
	 */
	private classifyCells(cells: Element[]): void {
		let mainHandle = '';
		let threadEnded = false;
		let lastWasTweet = false;
		let currentDepth = 0;

		for (const cell of cells) {
			const article = cell.querySelector('article[data-testid="tweet"]');
			if (!article) {
				lastWasTweet = false;
				continue;
			}

			if (!this.mainTweet) {
				this.mainTweet = article;
				mainHandle = this.getHandle(article);
				lastWasTweet = true;
				continue;
			}

			const handle = this.getHandle(article);

			// Before the thread has ended, self-replies by the main author are
			// part of the thread (post content)
			if (!threadEnded && handle && handle === mainHandle) {
				this.threadTweets.push(article);
				lastWasTweet = true;
				continue;
			}

			// First tweet by a different person ends the thread
			threadEnded = true;

			// Determine reply depth
			currentDepth = lastWasTweet ? currentDepth + 1 : 0;

			this.replyTweets.push(article);
			this.replyDepths.push(currentDepth);
			lastWasTweet = true;
		}
	}

	canExtract(): boolean {
		return !!this.mainTweet;
	}

	extract(): ExtractorResult {
		// Build post content from main tweet + thread (self-replies)
		const parts = [this.extractTweetContent(this.mainTweet)];
		for (const tweet of this.threadTweets) {
			parts.push(this.extractTweetContent(tweet));
		}
		const postContent = parts.join('\n<hr>\n');

		const comments = this.options.includeReplies !== false
			? this.extractComments()
			: '';

		const contentHtml = buildContentHtml('twitter', postContent, comments);

		const tweetId = this.getTweetId();
		const tweetAuthor = this.getTweetAuthor();
		const description = this.createDescription(this.mainTweet);
		const title = this.postTitle(tweetAuthor, 'X');

		return {
			content: contentHtml,
			contentHtml: contentHtml,
			extractedContent: {
				tweetId,
				tweetAuthor,
			},
			variables: {
				title,
				author: tweetAuthor,
				site: 'X (Twitter)',
				description,
			}
		};
	}

	private extractComments(): string {
		if (this.replyTweets.length === 0) return '';

		const commentData: CommentData[] = this.replyTweets.map((tweet, i) => {
			const userInfo = this.extractUserInfo(tweet);
			const content = this.extractTweetContent(tweet);

			return {
				author: userInfo.fullName ? `${userInfo.fullName} ${userInfo.handle}` : userInfo.handle,
				date: userInfo.date,
				content,
				depth: this.replyDepths[i],
				url: userInfo.permalink,
			};
		});

		return buildCommentTree(commentData);
	}

	// X routes that are not profiles, so /<name> in these cases is not a handle.
	private static readonly RESERVED_PATHS = new Set([
		'i', 'home', 'explore', 'search', 'notifications', 'messages',
		'settings', 'compose', 'hashtag', 'intent',
	]);

	/**
	 * The @handle for a tweet.
	 *
	 * Tried in order: link text starting with "@", the profile path in a link
	 * href, then any "@name" in the name block's text (quoted tweets render the
	 * handle as plain text rather than a link). Positional lookups like
	 * `links[1]` break whenever X reorders the name block.
	 */
	private getHandle(tweet: Element): string {
		const nameElement = tweet.querySelector('[data-testid="User-Name"]');
		if (!nameElement) return '';

		const links = Array.from(nameElement.querySelectorAll('a'));

		for (const link of links) {
			const text = link.textContent?.trim() || '';
			if (/^@\w{1,15}$/.test(text)) return text;
		}

		for (const link of links) {
			const href = link.getAttribute('href') || '';
			const match = href.match(/^(?:https?:\/\/[^/]+)?\/(\w{1,15})(?:\/|$)/);
			if (match && !TwitterExtractor.RESERVED_PATHS.has(match[1].toLowerCase())) {
				return `@${match[1]}`;
			}
		}

		const match = (nameElement.textContent || '').match(/@(\w{1,15})/);
		return match ? `@${match[1]}` : '';
	}

	private formatTweetText(text: string): string {
		if (!text) return '';

		// Create a temporary div to parse and clean the HTML
		const tempDiv = this.document.createElement('div');
		tempDiv.appendChild(parseHTML(this.document, text));

		// Convert links to plain text with @ handles
		tempDiv.querySelectorAll('a').forEach(link => {
			const handle = link.textContent?.trim() || '';
			link.replaceWith(handle);
		});

		// Remove unnecessary spans and divs but keep their content
		tempDiv.querySelectorAll('span, div').forEach(element => {
			element.replaceWith(...Array.from(element.childNodes));
		});

		// Get cleaned text and split into paragraphs
		const cleanText = serializeHTML(tempDiv);
		const paragraphs = cleanText.split('\n')
			.map(line => line.trim())
			.filter(line => line);

		// Wrap each paragraph in <p> tags
		return paragraphs.map(p => `<p>${p}</p>`).join('\n');
	}

	private replaceEmojiImages(container: Element): void {
		container.querySelectorAll('img[src*="/emoji/"]').forEach(img => {
			const altText = img.getAttribute('alt');
			if (altText) {
				img.replaceWith(altText);
			}
		});
	}

	private findQuotedTweet(tweet: Element): Element | null {
		return tweet.querySelector('[aria-labelledby*="id__"]')
			?.querySelector('[data-testid="User-Name"]')
			?.closest('[aria-labelledby*="id__"]') || null;
	}

	private extractTweetContent(tweet: Element | null): string {
		if (!tweet) return '';

		const tweetClone = tweet.cloneNode(true) as Element;
		this.replaceEmojiImages(tweetClone);

		const tweetTextEl = tweetClone.querySelector('[data-testid="tweetText"]');
		const tweetText = tweetTextEl ? serializeHTML(tweetTextEl) : '';
		const formattedText = this.formatTweetText(tweetText);

		const quotedTweet = this.findQuotedTweet(tweet);
		const images = this.extractImages(tweet, quotedTweet);
		const quotedHtml = quotedTweet ? this.extractQuotedTweet(quotedTweet) : '';
		const cardLink = this.extractCard(tweet);

		let html = '';
		if (formattedText) html += formattedText;
		if (images.length) html += `\n${images.join('\n')}`;
		if (cardLink) html += `\n${cardLink}`;
		if (quotedHtml) html += `\n${quotedHtml}`;

		return html;
	}

	private extractQuotedTweet(quotedTweet: Element): string {
		const tweetClone = quotedTweet.cloneNode(true) as Element;
		this.replaceEmojiImages(tweetClone);

		const tweetTextEl = tweetClone.querySelector('[data-testid="tweetText"]');
		const tweetText = tweetTextEl ? serializeHTML(tweetTextEl) : '';
		const formattedText = this.formatTweetText(tweetText);
		const userInfo = this.extractUserInfo(quotedTweet);
		const images = this.extractImages(quotedTweet, null);

		let content = '';
		if (formattedText) content += formattedText;
		if (images.length) content += `\n${images.join('\n')}`;

		const author = userInfo.fullName
			? `${userInfo.fullName} ${userInfo.handle}`
			: userInfo.handle;

		return buildQuotedPost({
			author: author || undefined,
			date: userInfo.date || undefined,
			content,
		});
	}

	private extractUserInfo(tweet: Element) {
		const nameElement = tweet.querySelector('[data-testid="User-Name"]');
		if (!nameElement) return { fullName: '', handle: '', date: '', permalink: '' };

		const handle = this.getHandle(tweet);

		// Display name: the first link that is neither the handle nor the
		// timestamp. Quoted tweets render no links, so fall back to the first
		// child ([0] = display name, [1] = "@handle·date").
		let fullName = Array.from(nameElement.querySelectorAll('a'))
			.map(link => (link.querySelector('time') ? '' : link.textContent?.trim() || ''))
			.find(text => text && text !== handle && !text.startsWith('@')) || '';

		if (!fullName) {
			const first = nameElement.children[0]?.textContent?.trim() || '';
			if (first && !first.startsWith('@')) fullName = first;
		}

		const timestamp = tweet.querySelector('time');
		const datetime = timestamp?.getAttribute('datetime') || '';
		const date = datetime ? new Date(datetime).toISOString().split('T')[0] : '';
		const permalink = timestamp?.closest('a')?.href || '';

		return { fullName, handle, date, permalink };
	}

	private extractImages(tweet: Element, quotedTweet: Element | null): string[] {
		const imageContainers = [
			'[data-testid="tweetPhoto"]',
			'[data-testid="tweet-image"]',
			'img[src*="media"]'
		];

		const images: string[] = [];

		for (const selector of imageContainers) {
			const elements = tweet.querySelectorAll(selector);

			elements.forEach(img => {
				if (quotedTweet?.contains(img)) {
					return;
				}

				if (img.tagName.toLowerCase() === 'img' && img.getAttribute('alt')) {
					const highQualitySrc = img.getAttribute('src')?.replace(/&name=\w+$/, '&name=large') || '';
					const cleanAlt = img.getAttribute('alt')?.replace(/\s+/g, ' ').trim() || '';
					images.push(`<img src="${escapeHtml(highQualitySrc)}" alt="${escapeHtml(cleanAlt)}" />`);
				}
			});
		}

		return images;
	}

	private extractCard(tweet: Element): string {
		const card = tweet.querySelector('[data-testid="card.wrapper"]');
		if (!card) return '';

		const cardLink = card.querySelector('a[href]') as HTMLAnchorElement | null;
		if (!cardLink) return '';

		const href = cardLink.getAttribute('href') || '';
		const label = cardLink.getAttribute('aria-label') || '';
		const title = label.split(/\n/)[0]?.trim() || href;

		return `<p><a href="${escapeHtml(href)}">${escapeHtml(title)}</a></p>`;
	}

	private getTweetId(): string {
		const match = this.url.match(/status\/(\d+)/);
		return match?.[1] || '';
	}

	private getTweetAuthor(): string {
		const handle = this.getHandle(this.mainTweet!);
		return handle.startsWith('@') ? handle : `@${handle}`;
	}

	private createDescription(tweet: Element | null): string {
		if (!tweet) return '';

		const tweetText = tweet.querySelector('[data-testid="tweetText"]')?.textContent || '';
		return tweetText.trim().slice(0, 140).replace(/\s+/g, ' ');
	}
}
