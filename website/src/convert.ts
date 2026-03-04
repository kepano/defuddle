import { parseHTML } from 'linkedom';
import { Defuddle } from '../../src/defuddle';
import { toMarkdown, isMarkdownContent, cleanMarkdownContent } from '../../src/markdown';
import type { DefuddleResponse } from '../../src/types';

const MAX_SIZE = 5 * 1024 * 1024; // 5MB
const DEFAULT_UA = 'Mozilla/5.0 (compatible; Defuddle/1.0; +https://defuddle.md)';
const BOT_UA = DEFAULT_UA + ' bot';

async function fetchPage(targetUrl: string, userAgent: string): Promise<string> {
	const response = await fetch(targetUrl, {
		headers: {
			'User-Agent': userAgent,
			'Accept': 'text/html,application/xhtml+xml',
		},
		redirect: 'follow',
	});

	if (!response.ok) {
		throw new Error(`Failed to fetch: ${response.status} ${response.statusText}`);
	}

	const contentType = response.headers.get('content-type') || '';
	if (!contentType.includes('text/html') && !contentType.includes('application/xhtml+xml')) {
		throw new Error(`Not an HTML page (content-type: ${contentType})`);
	}

	const contentLength = response.headers.get('content-length');
	if (contentLength && parseInt(contentLength) > MAX_SIZE) {
		throw new Error(`Page too large (${Math.round(parseInt(contentLength) / 1024 / 1024)}MB, max 5MB)`);
	}

	const html = await response.text();

	if (html.length > MAX_SIZE) {
		throw new Error(`Page too large (${Math.round(html.length / 1024 / 1024)}MB, max 5MB)`);
	}

	return html;
}

function defuddleHtml(html: string, targetUrl: string): DefuddleResponse {
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

	const defuddle = new Defuddle(document as unknown as Document, {
		url: targetUrl,
	});

	return defuddle.parse();
}

export function parseHtml(html: string, url: string): DefuddleResponse & { contentHtml?: string } {
	const result = defuddleHtml(html, url);
	const contentHtml = result.content;
	toMarkdown(result, { markdown: true }, url);
	return { ...result, contentHtml };
}

export async function convertToMarkdown(targetUrl: string): Promise<DefuddleResponse> {
	const html = await fetchPage(targetUrl, DEFAULT_UA);
	let result = defuddleHtml(html, targetUrl);

	// If no content was extracted, the page may be JS-rendered.
	// Retry with a bot UA — some sites serve pre-rendered content to bots.
	if (result.wordCount === 0) {
		try {
			const botHtml = await fetchPage(targetUrl, BOT_UA);
			const botResult = defuddleHtml(botHtml, targetUrl);
			if (botResult.wordCount > 0) {
				// Some sites serve raw markdown to bots — detect and clean it
				// instead of running through Turndown which would escape it
				if (isMarkdownContent(botResult.content)) {
					botResult.content = cleanMarkdownContent(botResult.content);
				} else {
					toMarkdown(botResult, { markdown: true }, targetUrl);
				}
				return botResult;
			}
		} catch (e) {
			// Bot UA may be blocked — fall through to original result
		}
	}

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
