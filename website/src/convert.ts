import { parseHTML } from 'linkedom';
import { Defuddle } from '../../src/defuddle';
import { toMarkdown } from '../../src/markdown';
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

function createDefuddle(html: string, targetUrl: string) {
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

	return new Defuddle(document as unknown as Document, {
		url: targetUrl,
	});
}

function defuddleHtml(html: string, targetUrl: string): DefuddleResponse {
	return createDefuddle(html, targetUrl).parse();
}

async function defuddleHtmlAsync(html: string, targetUrl: string): Promise<DefuddleResponse> {
	return createDefuddle(html, targetUrl).parseAsync();
}

export function parseHtml(html: string, url: string): DefuddleResponse & { contentHtml?: string } {
	const result = defuddleHtml(html, url);
	const contentHtml = result.content;
	toMarkdown(result, { markdown: true }, url);
	return { ...result, contentHtml };
}

export async function convertToMarkdown(targetUrl: string): Promise<DefuddleResponse> {
	const html = await fetchPage(targetUrl, DEFAULT_UA);
	let result = await defuddleHtmlAsync(html, targetUrl);

	// If no content was extracted, the page may be JS-rendered.
	// Retry with a bot UA — some sites serve pre-rendered content to bots.
	if (result.wordCount === 0) {
		try {
			const botHtml = await fetchPage(targetUrl, BOT_UA);

			// Check for raw markdown in the HTML before DOM parsing destroys
			// whitespace (e.g. tab-indented lists). Some sites like Obsidian
			// Publish embed raw markdown in a text node for bot UAs.
			const rawMarkdown = extractRawMarkdown(botHtml);
			if (rawMarkdown) {
				// Use raw markdown content (preserves whitespace like tab indentation)
				// but keep metadata from Defuddle's parsing
				const botResult = await defuddleHtmlAsync(botHtml, targetUrl);
				botResult.content = cleanMarkdownContent(rawMarkdown);
				botResult.wordCount = botResult.content.split(/\s+/).filter(w => w.length > 0).length;
				return botResult;
			}
			const botResult = await defuddleHtmlAsync(botHtml, targetUrl);
			if (botResult.wordCount > 0) {
				toMarkdown(botResult, { markdown: true }, targetUrl);
				return botResult;
			}
		} catch (e) {
			// Bot UA may be blocked — fall through to original result
		}
	}

	toMarkdown(result, { markdown: true }, targetUrl);

	return result;
}

/**
 * Extract raw markdown from HTML before DOM parsing.
 * Some sites (e.g. Obsidian Publish) embed raw markdown in a text node
 * for bot user agents. DOM parsing destroys whitespace like tab indentation,
 * so we extract it from the raw HTML string.
 */
function extractRawMarkdown(html: string): string | null {
	// Look for a text block that appears to be raw markdown inside body.
	// Obsidian Publish puts it in <div class="preload">...</div>
	const bodyMatch = html.match(/<body[^>]*>([\s\S]*?)<\/body>/i);
	if (!bodyMatch) return null;

	// Strip script/style/noscript elements and their content, then strip remaining tags
	const textContent = bodyMatch[1]
		.replace(/<(script|style|noscript)[^>]*>[\s\S]*?<\/\1>/gi, '')
		.replace(/<[^>]+>/g, '')
		.trim();
	if (!textContent || !isMarkdownContent(textContent)) return null;

	return textContent;
}

/**
 * Detect if tag-stripped content looks like markdown.
 * Expects input with HTML tags already removed by extractRawMarkdown.
 */
function isMarkdownContent(content: string): boolean {
	let signals = 0;
	if (/^#{1,6}\s+\S/m.test(content)) signals++;
	if (/\*\*[^*\n]+\*\*/m.test(content)) signals++;
	if (/\[[^\]]+\]\([^)]+\)/m.test(content)) signals++;
	if (/^\s*[-*+]\s+\S/m.test(content)) signals++;
	if (/^\s*\d+\.\s+\S/m.test(content)) signals++;
	if (/^>\s+\S/m.test(content)) signals++;
	if (/```/m.test(content)) signals++;

	return signals >= 2;
}

/**
 * Clean up raw markdown content. Decodes HTML entities and removes leading title.
 * Expects input with HTML tags already removed by extractRawMarkdown.
 */
function cleanMarkdownContent(content: string): string {
	let markdown = content
		.replace(/&amp;/g, '&')
		.replace(/&lt;/g, '<')
		.replace(/&gt;/g, '>')
		.replace(/&quot;/g, '"')
		.replace(/&#39;/g, "'")
		.trim();

	const titleMatch = markdown.match(/^# .+\n+/);
	if (titleMatch) {
		markdown = markdown.slice(titleMatch[0].length);
	}

	markdown = markdown.replace(/\n{3,}/g, '\n\n');

	return markdown.trim();
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
