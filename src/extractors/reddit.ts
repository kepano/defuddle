import { BaseExtractor, ExtractorOptions } from './_base';
import { ExtractorResult } from '../types/extractors';
import { parseHTML, serializeHTML } from '../utils/dom';
import { buildCommentTree, buildContentHtml, type CommentData } from '../utils/comments';

interface FeedEntry {
	id: string;
	author: string;
	title: string;
	date: string;
	url: string;
	content: string;
}

interface FetchedPage {
	ok: boolean;
	status: number;
	url: string;
	text: string;
}

interface RequestCacheEntry {
	expires: number;
	page: Promise<FetchedPage>;
}

const REQUEST_CACHE_TTL_MS = 60_000;
const REQUEST_ERROR_TTL_MS = 5_000;
const REQUEST_TIMEOUT_MS = 10_000;
// One parse touches two URLs, so this holds a handful of concurrent parses.
// Without a bound the map would grow with traffic, and each entry retains a
// full response body.
const MAX_CACHE_ENTRIES = 16;
const requestCache = new Map<string, RequestCacheEntry>();

/**
 * Reddit rejects requests with an empty User-Agent outright, and asks scripts
 * to identify themselves. Node's fetch always supplies one, but workerd sends
 * none, so setting it here is what makes the Worker work rather than 403.
 */
const USER_AGENT = 'defuddle (+https://defuddle.md)';

const XML_ENTITIES: Record<string, string> = {
	'&lt;': '<',
	'&gt;': '>',
	'&quot;': '"',
	'&apos;': "'",
	'&amp;': '&',
};

/**
 * Anonymous requests to old.reddit.com are redirected to /login/. Fetch follows
 * that redirect, so the login page arrives as a 200 and is only distinguishable
 * by the final URL. That URL is caller-supplied via options.fetch, so it may be
 * absent or unparseable.
 */
function isLoginWall(finalUrl: string): boolean {
	try {
		return /^\/login\/?$/.test(new URL(finalUrl).pathname);
	} catch {
		return false;
	}
}

/**
 * Decode the XML entities Atom uses to escape markup. Single-pass so that an
 * escaped entity in the source (`&amp;lt;`) decodes to `&lt;` rather than `<`.
 * Markup goes on to be parsed as HTML, but plain fields like titles are used
 * as-is, so numeric references are resolved here too.
 */
function decodeXmlEntities(value: string): string {
	return value.replace(/&(?:lt|gt|quot|apos|amp|#(\d+)|#x([0-9a-fA-F]+));/g, (entity, dec, hex) => {
		if (dec || hex) return String.fromCodePoint(parseInt(dec ?? hex, dec ? 10 : 16));
		return XML_ENTITIES[entity] ?? entity;
	});
}

export class RedditExtractor extends BaseExtractor {
	private shredditPost: Element | null;
	private isOldReddit: boolean;

	constructor(document: Document, url: string, schemaOrgData?: any, options?: ExtractorOptions) {
		super(document, url, schemaOrgData, options);
		this.shredditPost = document.querySelector('shreddit-post');
		this.isOldReddit = !!document.querySelector('.thing.link');
	}

	canExtract(): boolean {
		return !!this.shredditPost || this.isOldReddit;
	}

	canExtractAsync(): boolean {
		return this.isCommentsPage() && !this.isOldReddit;
	}

	prefersAsync(): boolean {
		// In server/worker contexts, fetch full content including comments from
		// old.reddit.com, falling back to the Atom feed. In browser (real
		// window), use the rendered DOM directly since both are CORS-blocked
		// from www.reddit.com.
		const isBrowser = typeof window !== 'undefined' && this.document.defaultView === window;
		return this.isCommentsPage() && !this.isOldReddit && !isBrowser;
	}

	private isCommentsPage(): boolean {
		return /\/r\/.+\/comments\//.test(this.url);
	}

	async extractAsync(): Promise<ExtractorResult> {
		// old.reddit.com carries scores and reply nesting that the public feed
		// does not, so it stays the preferred source. Anonymous clients now get
		// a login wall there instead of content, but a caller injecting
		// authenticated cookies through options.fetch still reaches the real
		// page — so try it, and fall through to the feed when it fails.
		const fromOldReddit = await this.tryOldReddit();
		if (fromOldReddit) return fromOldReddit;

		return this.extractFromFeed();
	}

	private async tryOldReddit(): Promise<ExtractorResult | null> {
		const oldUrl = new URL(this.url);
		oldUrl.hostname = 'old.reddit.com';

		const response = await this.request(oldUrl.toString(), 'text/html,application/xhtml+xml')
			.catch(() => null);
		if (!response?.ok || isLoginWall(response.url)) return null;

		const doc = this.parseDocument(response.text);
		// A login page reached through a redirect still has no post.
		return doc.querySelector('.thing.link') ? this.extractOldReddit(doc) : null;
	}

	/**
	 * Reddit's Atom feed is the only unauthenticated source still serving post
	 * content. It is flat and score-less, so the output is thinner than the
	 * old.reddit DOM, but it is the difference between a post and an error.
	 */
	private async extractFromFeed(): Promise<ExtractorResult> {
		const feedUrl = new URL(this.url);
		feedUrl.hostname = 'www.reddit.com';
		feedUrl.pathname = `${feedUrl.pathname.replace(/\/+$/, '')}/.rss`;

		const response = await this.request(feedUrl.toString(), 'application/atom+xml, application/rss+xml, application/xml');

		if (!response.ok) {
			// 429 is Reddit throttling the feed, which it does aggressively;
			// 403 is the network-policy block datacenter IPs receive.
			throw new Error(`Failed to fetch ${feedUrl.hostname}: ${response.status}`);
		}

		return this.extractFeed(response.text);
	}

	/**
	 * Fetch through a short-lived cache.
	 *
	 * A single user-facing parse reaches this extractor several times: the CLI
	 * and the Worker both reparse the page when the first pass yields nothing,
	 * and parseAsync() tries a preferred and a general finder. Reddit throttles
	 * the feed to roughly one request per half-minute, so without this the
	 * retries guarantee the 429 they are retrying against.
	 *
	 * The cache is keyed by URL alone, so it is bypassed when the caller
	 * supplies its own fetch — otherwise an authenticated response and an
	 * anonymous one could be served to each other.
	 */
	private async request(url: string, accept: string): Promise<FetchedPage> {
		if (this.options.fetch) return this.send(url, accept);

		const now = Date.now();
		const cached = requestCache.get(url);
		if (cached && cached.expires > now) return cached.page;
		requestCache.delete(url);

		const page = this.send(url, accept);
		const entry: RequestCacheEntry = { expires: now + REQUEST_CACHE_TTL_MS, page };
		requestCache.set(url, entry);

		// A rejected fetch is cached only long enough to absorb the retry burst,
		// so a transient error does not stick to a long-lived process.
		page.catch(() => { entry.expires = Date.now() + REQUEST_ERROR_TTL_MS; });

		while (requestCache.size > MAX_CACHE_ENTRIES) {
			requestCache.delete(requestCache.keys().next().value!);
		}

		return page;
	}

	private async send(url: string, accept: string): Promise<FetchedPage> {
		const response = await this.fetch(url, {
			headers: { 'User-Agent': USER_AGENT, 'Accept': accept },
			// Without a deadline a hung connection pins this extractor, and with
			// it the whole source Document, for as long as the socket lives.
			signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
		});

		// The login wall is a full page that no caller reads, so skip buffering
		// it — on the anonymous path that is every request to old.reddit.com.
		const finalUrl = response.url || url;
		const wanted = response.ok && !isLoginWall(finalUrl);
		if (!wanted) response.body?.cancel().catch(() => {});

		return {
			ok: response.ok,
			status: response.status,
			url: finalUrl,
			text: wanted ? await response.text() : '',
		};
	}

	private parseDocument(html: string): Document {
		const Parser = this.document.defaultView?.DOMParser ?? (typeof DOMParser !== 'undefined' ? DOMParser : null);
		if (!Parser) {
			throw new Error('DOMParser is not available in this environment');
		}
		return new Parser().parseFromString(html, 'text/html');
	}

	private extractFeed(xml: string): ExtractorResult {
		const includeReplies = this.options.includeReplies !== false;
		// Building an entry parses and reserializes its body, so discard the
		// ones this parse does not want before paying for them.
		const entries = xml.split('<entry>').slice(1)
			.filter(entry => {
				const id = entry.match(/<id>([\s\S]*?)<\/id>/)?.[1] ?? '';
				return id.startsWith('t3_') || (includeReplies && id.startsWith('t1_'));
			})
			.map(entry => this.parseFeedEntry(entry));

		const post = entries.find(entry => entry.id.startsWith('t3_'));
		const postBody = post?.content || '';

		const comments = buildCommentTree(entries
			.filter(entry => entry.id.startsWith('t1_'))
			.map(entry => ({
				author: entry.author,
				date: entry.date,
				content: entry.content,
				// The feed carries no parent links, so replies cannot be nested
				// the way the old.reddit DOM allows.
				depth: 0,
				url: entry.url || undefined,
			} satisfies CommentData)));

		return this.buildResult(postBody, comments, {
			title: post?.title || '',
			author: post?.author || '',
			subreddit: this.getSubreddit(),
		});
	}

	private parseFeedEntry(entry: string): FeedEntry {
		const field = (pattern: RegExp) => (entry.match(pattern)?.[1] ?? '').trim();

		return {
			id: field(/<id>([\s\S]*?)<\/id>/),
			author: decodeXmlEntities(field(/<author>[\s\S]*?<name>([\s\S]*?)<\/name>/)).replace(/^\/u\//, ''),
			title: decodeXmlEntities(field(/<title>([\s\S]*?)<\/title>/)),
			date: field(/<updated>([\s\S]*?)<\/updated>/).split('T')[0],
			url: decodeXmlEntities(field(/<link[^>]*href="([^"]*)"/)),
			content: this.feedContentHtml(field(/<content[^>]*>([\s\S]*?)<\/content>/)),
		};
	}

	/**
	 * Feed entry bodies are HTML escaped into the XML and wrap the real content
	 * in the same `div.md` the old.reddit DOM uses, so unwrap to match.
	 */
	private feedContentHtml(escaped: string): string {
		if (!escaped) return '';

		const container = this.document.createElement('div');
		container.appendChild(parseHTML(this.document, decodeXmlEntities(escaped)));

		const body = container.querySelector('.md');
		return body ? serializeHTML(body) : serializeHTML(container);
	}

	extract(): ExtractorResult {
		if (this.isOldReddit) {
			return this.extractOldReddit(this.document);
		}

		const postTitle = this.document.querySelector('h1')?.textContent?.trim() || '';
		const subreddit = this.getSubreddit();
		const postAuthor = this.getPostAuthor();
		const postContent = this.getPostContent();
		const description = this.createDescription(postContent);

		// Extract any comments already in the DOM (browser renders these via JS;
		// SSR/Node HTML won't have them, so comments will be empty there).
		const comments = this.options.includeReplies !== false ? this.extractComments() : '';
		// If the content is empty (link/image post with no body and no DOM
		// comments), parseAsync() falls through to extractAsync(), which tries
		// old.reddit.com and then the Atom feed.

		return this.buildResult(postContent, comments, { title: postTitle, author: postAuthor, subreddit }, description);
	}

	/**
	 * Every source — the rendered DOM, old.reddit.com and the feed — differs
	 * only in where the title, author and body come from, so they share one
	 * result shape.
	 */
	private buildResult(
		postBody: string,
		comments: string,
		meta: { title: string; author: string; subreddit: string },
		description = this.createDescription(postBody),
	): ExtractorResult {
		const contentHtml = this.createContentHtml(postBody, comments);

		return {
			content: contentHtml,
			contentHtml: contentHtml,
			extractedContent: {
				postId: this.getPostId(),
				subreddit: meta.subreddit,
				postAuthor: meta.author,
			},
			variables: {
				title: meta.title,
				author: meta.author,
				site: `r/${meta.subreddit}`,
				description,
			}
		};
	}

	private extractOldReddit(root: Document | Element): ExtractorResult {
		const thingLink = root.querySelector('.thing.link');
		const postTitle = thingLink?.querySelector('a.title')?.textContent?.trim() || '';
		const postAuthor = thingLink?.getAttribute('data-author') || '';
		const subreddit = thingLink?.getAttribute('data-subreddit') || '';
		const postBodyEl = thingLink?.querySelector('.usertext-body .md');
		const postBody = postBodyEl ? serializeHTML(postBodyEl) : '';

		let comments = '';
		if (this.options.includeReplies !== false) {
			const commentArea = root.querySelector('.commentarea .sitetable');
			comments = buildCommentTree(commentArea ? this.collectOldRedditComments(commentArea) : []);
		}

		return this.buildResult(postBody, comments, { title: postTitle, author: postAuthor, subreddit });
	}

	private getPostContent(): string {
		const textBodyEl = this.shredditPost?.querySelector('[slot="text-body"]');
		const textBody = textBodyEl ? serializeHTML(textBodyEl) : '';
		const mediaBody = this.shredditPost?.querySelector('#post-image')?.outerHTML || '';
		
		return textBody + mediaBody;
	}

	private createContentHtml(postContent: string, comments: string): string {
		return buildContentHtml('reddit', postContent, comments);
	}

	private extractComments(): string {
		const comments = Array.from(this.document.querySelectorAll('shreddit-comment'));
		return this.processComments(comments);
	}

	private getPostId(): string {
		const match = this.url.match(/comments\/([a-zA-Z0-9]+)/);
		return match?.[1] || '';
	}

	private getSubreddit(): string {
		const match = this.url.match(/\/r\/([^/]+)/);
		return match?.[1] || '';
	}

	private getPostAuthor(): string {
		return this.shredditPost?.getAttribute('author') || '';
	}

	private createDescription(postContent: string): string {
		if (!postContent) return '';

		const tempDiv = this.document.createElement('div');
		tempDiv.appendChild(parseHTML(this.document, postContent));
		return tempDiv.textContent?.trim()
			.slice(0, 140)
			.replace(/\s+/g, ' ') || '';
	}

	private collectOldRedditComments(container: Element, depth: number = 0): CommentData[] {
		const result: CommentData[] = [];
		const comments = Array.from(container.querySelectorAll(':scope > .thing.comment'));

		for (const comment of comments) {
			const author = comment.getAttribute('data-author') || '';
			const permalink = comment.getAttribute('data-permalink') || '';
			const score = comment.querySelector('.entry .tagline .score.unvoted')?.textContent?.trim() || '';
			const timeEl = comment.querySelector('.entry .tagline time[datetime]');
			const datetime = timeEl?.getAttribute('datetime') || '';
			const date = datetime ? new Date(datetime).toISOString().split('T')[0] : '';
			const bodyEl = comment.querySelector('.entry .usertext-body .md');
			const body = bodyEl ? serializeHTML(bodyEl) : '';

			result.push({
				author,
				date,
				content: body,
				depth,
				score: score || undefined,
				url: permalink ? `https://reddit.com${permalink}` : undefined,
			});

			const childContainer = comment.querySelector('.child > .sitetable');
			if (childContainer) {
				result.push(...this.collectOldRedditComments(childContainer, depth + 1));
			}
		}

		return result;
	}

	private processComments(comments: Element[]): string {
		const commentData: CommentData[] = [];

		for (const comment of comments) {
			const depth = parseInt(comment.getAttribute('depth') || '0');
			const author = comment.getAttribute('author') || '';
			const score = comment.getAttribute('score') || '0';
			const permalink = comment.getAttribute('permalink') || '';
			const commentEl = comment.querySelector('[slot="comment"]');
			const content = commentEl ? serializeHTML(commentEl) : '';

			const timestamp = comment.getAttribute('created')
				|| comment.querySelector('time')?.getAttribute('datetime')
				|| '';
			const date = timestamp ? new Date(timestamp).toISOString().split('T')[0] : '';

			commentData.push({
				author,
				date,
				content,
				depth,
				score: `${score} points`,
				url: permalink ? `https://reddit.com${permalink}` : undefined,
			});
		}

		return buildCommentTree(commentData);
	}
} 