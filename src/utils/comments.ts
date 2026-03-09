/**
 * Standardized comment HTML construction.
 *
 * Used by Reddit, Hacker News, and GitHub extractors to produce
 * consistent comment markup.
 */

export interface CommentData {
	/** Pre-built metadata HTML (author, date, score, links) */
	metadata: string;
	/** Comment body HTML */
	content: string;
	/** Nesting depth (0 = top-level). Omit for flat lists. */
	depth?: number;
}

/**
 * Build a nested comment tree from a flat list of comments with depth.
 * Uses <blockquote> elements to represent reply hierarchy.
 */
export function buildCommentTree(comments: CommentData[]): string {
	let html = '';
	const blockquoteStack: number[] = [];

	for (const comment of comments) {
		const depth = comment.depth ?? 0;

		if (depth === 0) {
			while (blockquoteStack.length > 0) {
				html += '</blockquote>';
				blockquoteStack.pop();
			}
			html += '<blockquote>';
			blockquoteStack.length = 0;
			blockquoteStack.push(0);
		} else {
			const currentDepth = blockquoteStack[blockquoteStack.length - 1] ?? -1;
			if (depth < currentDepth) {
				while (blockquoteStack.length > 0 && blockquoteStack[blockquoteStack.length - 1] >= depth) {
					html += '</blockquote>';
					blockquoteStack.pop();
				}
			} else if (depth > currentDepth) {
				html += '<blockquote>';
				blockquoteStack.push(depth);
			}
		}

		html += buildComment(comment);
	}

	while (blockquoteStack.length > 0) {
		html += '</blockquote>';
		blockquoteStack.pop();
	}

	return html;
}

/**
 * Build a single comment div with metadata and content.
 */
export function buildComment(comment: CommentData): string {
	return `<div class="comment">
	<div class="comment-metadata">
		${comment.metadata}
	</div>
	<div class="comment-content">${comment.content}</div>
</div>`;
}
