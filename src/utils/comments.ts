/**
 * Standardized comment HTML construction.
 *
 * Used by Reddit, Hacker News, GitHub, and other extractors to produce
 * consistent comment markup.
 *
 * Metadata format (in markdown): **author** · date · score
 * - date is linked if a url is provided
 * - score is omitted if not provided
 */

import { escapeHtml, isDangerousUrl } from './dom';

export interface CommentData {
	/** Comment author name */
	author: string;
	/** Display date (e.g. "2025-01-15") */
	date: string;
	/** Comment body HTML */
	content: string;
	/** Nesting depth (0 = top-level). Omit for flat lists. */
	depth?: number;
	/** Score text (e.g. "42 points", "25 points") */
	score?: string;
	/** Permalink URL for the comment */
	url?: string;
}

export interface QuotedPostData {
	/** Author name */
	author?: string;
	/** Display date */
	date?: string;
	/** Post body HTML */
	content: string;
	/** Permalink URL */
	url?: string;
}

/**
 * Site identifiers used as the wrapper class alongside `post` / `comments`.
 *
 * Typed as a union rather than `string` so that adding an extractor is a compile
 * error until the token is listed here. That matters because isExtractorClass()
 * below is what keeps these classes alive through the attribute strip. A site
 * that could pass any string would silently lose its wrapper class instead.
 */
export const SITE_TOKENS = [
	'bluesky',
	'discourse',
	'github',
	'gmail',
	'hackernews',
	'linkedin',
	'lwn',
	'mastodon',
	'reddit',
	'threads',
	'twitter',
] as const;

export type SiteToken = typeof SITE_TOKENS[number];

const SITE_TOKEN_SET: Set<string> = new Set(SITE_TOKENS);

// The rest of the class vocabulary the extractors emit: the comment tree above,
// the post wrappers in buildContentHtml, plus `post-text` (hackernews.ts),
// `quoted-post` (buildQuotedPost) and `x-article` (x-article.ts, x-oembed.ts).
//
// Conversation extractors' `message-*` classes are deliberately absent: those run
// their own nested Defuddle pass (see _conversation.ts), so the main pipeline has
// already stripped them before any of this applies.
const EXTRACTOR_CLASS_TOKEN = /^(?:comments?|posts?|quoted-post|x-article)(?:-[\w-]+)?$/;

/**
 * Is this class token extractor-authored markup rather than something copied off
 * the page? Used by the attribute strip to decide what survives. obsidian-clipper's
 * reader keys its per-author colors, collapse buttons, and thread tracing off
 * .comments / .comment / .comment-author / .comment-metadata.
 *
 * Lives here, next to the code that emits these classes, so the two cannot drift.
 */
export function isExtractorClass(token: string): boolean {
	return SITE_TOKEN_SET.has(token) || EXTRACTOR_CLASS_TOKEN.test(token);
}

/**
 * Build the full content HTML for a post with optional comments section.
 * @param site - Site identifier for wrapper class (e.g. "reddit", "hackernews", "github")
 * @param postContent - The main post body HTML
 * @param comments - Pre-built comments HTML string (from buildCommentTree)
 */
export function buildContentHtml(site: SiteToken, postContent: string, comments: string): string {
	return `
		<article data-defuddle>
			<div class="${site} post">
				<div class="post-content">
					${postContent}
				</div>
			</div>
			${comments ? `
				<hr>
				<div class="${site} comments">
					<h2>Comments</h2>
					${comments}
				</div>
			` : ''}
		</article>
	`.trim();
}

/**
 * Build a nested comment tree from a flat list of comments with depth.
 * Uses <blockquote> elements to represent reply hierarchy.
 */
export function buildCommentTree(comments: CommentData[]): string {
	const parts: string[] = [];
	const blockquoteStack: number[] = [];

	for (const comment of comments) {
		const depth = comment.depth ?? 0;

		if (depth === 0) {
			while (blockquoteStack.length > 0) {
				parts.push('</blockquote>');
				blockquoteStack.pop();
			}
			parts.push('<blockquote>');
			blockquoteStack.push(0);
		} else {
			const currentDepth = blockquoteStack[blockquoteStack.length - 1] ?? -1;
			if (depth < currentDepth) {
				while (blockquoteStack.length > 0 && blockquoteStack[blockquoteStack.length - 1] >= depth) {
					parts.push('</blockquote>');
					blockquoteStack.pop();
				}
			}
			// Open a new level if needed (handles both deeper nesting
			// and reopening after closing, e.g. depth 2 → 1 → 1)
			const newCurrentDepth = blockquoteStack[blockquoteStack.length - 1] ?? -1;
			if (depth > newCurrentDepth) {
				parts.push('<blockquote>');
				blockquoteStack.push(depth);
			}
		}

		parts.push(buildComment(comment));
	}

	while (blockquoteStack.length > 0) {
		parts.push('</blockquote>');
		blockquoteStack.pop();
	}

	return parts.join('');
}

/**
 * Build a single comment div with metadata and content.
 *
 * Metadata order: author · date · score
 * - date is wrapped in a link if url is provided
 * - score is omitted if not provided
 */
export function buildComment(comment: CommentData): string {
	const author = `<span class="comment-author"><strong>${escapeHtml(comment.author)}</strong></span>`;

	const safeUrl = comment.url && !isDangerousUrl(comment.url) ? comment.url : '';
	const dateHtml = safeUrl
		? `<a href="${escapeHtml(safeUrl)}" class="comment-link">${escapeHtml(comment.date)}</a>`
		: `<span class="comment-date">${escapeHtml(comment.date)}</span>`;

	const scoreHtml = comment.score
		? ` · <span class="comment-points">${escapeHtml(comment.score)}</span>`
		: '';

	return `<div class="comment">
	<div class="comment-metadata">
		${author} · ${dateHtml}${scoreHtml}
	</div>
	<div class="comment-content">${comment.content}</div>
</div>`;
}

/**
 * Build a quoted/reposted post blockquote.
 * Used by Twitter (quote tweets) and LinkedIn (reposts with commentary).
 */
export function buildQuotedPost(post: QuotedPostData): string {
	let header = '';
	if (post.author) {
		header += `<p><strong>${escapeHtml(post.author)}</strong>`;
		if (post.date) header += ` · ${escapeHtml(post.date)}`;
		header += '</p>';
	}

	let footer = '';
	if (post.url) {
		const safeUrl = isDangerousUrl(post.url) ? '' : post.url;
		if (safeUrl) {
			footer = `\n<p><a href="${escapeHtml(safeUrl)}">${escapeHtml(safeUrl)}</a></p>`;
		}
	}

	return `<blockquote class="quoted-post">${header}${post.content}${footer}</blockquote>`;
}
