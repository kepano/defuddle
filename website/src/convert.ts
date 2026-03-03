import { parseHTML } from 'linkedom';
import { Defuddle } from '../../src/defuddle';
import { toMarkdown } from '../../src/markdown';
import type { DefuddleResponse } from '../../src/types';

const MAX_SIZE = 5 * 1024 * 1024; // 5MB

export async function convertToMarkdown(targetUrl: string): Promise<DefuddleResponse> {
	// Fetch the page
	const response = await fetch(targetUrl, {
		headers: {
			'User-Agent': 'Mozilla/5.0 (compatible; Defuddle/1.0; +https://defuddle.md)',
			'Accept': 'text/html,application/xhtml+xml',
		},
		redirect: 'follow',
	});

	if (!response.ok) {
		throw new Error(`Failed to fetch: ${response.status} ${response.statusText}`);
	}

	// Verify content type is HTML
	const contentType = response.headers.get('content-type') || '';
	if (!contentType.includes('text/html') && !contentType.includes('application/xhtml+xml')) {
		throw new Error(`Not an HTML page (content-type: ${contentType})`);
	}

	// Check content length if available
	const contentLength = response.headers.get('content-length');
	if (contentLength && parseInt(contentLength) > MAX_SIZE) {
		throw new Error(`Page too large (${Math.round(parseInt(contentLength) / 1024 / 1024)}MB, max 5MB)`);
	}

	const html = await response.text();

	if (html.length > MAX_SIZE) {
		throw new Error(`Page too large (${Math.round(html.length / 1024 / 1024)}MB, max 5MB)`);
	}

	// Parse with linkedom
	const { document } = parseHTML(html);

	// linkedom doesn't implement styleSheets or getComputedStyle.
	// Stub them so defuddle's internals proceed without throwing.
	const doc = document as any;
	if (!doc.styleSheets) {
		doc.styleSheets = [];
	}
	if (doc.defaultView && !doc.defaultView.getComputedStyle) {
		doc.defaultView.getComputedStyle = () => ({ display: '' });
	}

	// Run defuddle
	const defuddle = new Defuddle(document as unknown as Document, {
		url: targetUrl,
	});

	const result = await defuddle.parseAsync();

	// Convert to markdown
	toMarkdown(result, { markdown: true }, targetUrl);

	return result;
}

export function formatResponse(result: DefuddleResponse, sourceUrl: string): string {
	const frontmatter: string[] = ['---'];

	if (result.title) {
		frontmatter.push(`title: "${result.title.replace(/"/g, '\\"')}"`);
	}
	if (result.author) {
		frontmatter.push(`author: "${result.author.replace(/"/g, '\\"')}"`);
	}
	if (result.published) {
		frontmatter.push(`published: ${result.published}`);
	}
	frontmatter.push(`source: "${sourceUrl}"`);
	if (result.domain) {
		frontmatter.push(`domain: "${result.domain}"`);
	}
	if (result.description) {
		frontmatter.push(`description: "${result.description.replace(/"/g, '\\"')}"`);
	}
	if (result.wordCount) {
		frontmatter.push(`word_count: ${result.wordCount}`);
	}

	frontmatter.push('---');

	return frontmatter.join('\n') + '\n\n' + result.content;
}
