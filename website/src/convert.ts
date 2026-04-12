import { parseLinkedomHTML } from '../../src/utils/linkedom-compat';
import { Defuddle } from '../../src/defuddle';
import { toMarkdown } from '../../src/markdown';
import { countWords } from '../../src/utils';
import { getInitialUA, fetchPage, extractRawMarkdown, cleanMarkdownContent, BOT_UA } from '../../src/fetch';
import type { DefuddleOptions, DefuddleResponse } from '../../src/types';

function createDefuddle(html: string, targetUrl: string, opts?: Partial<DefuddleOptions>) {
	const doc = parseLinkedomHTML(html, targetUrl);
	return new Defuddle(doc, { url: targetUrl, ...opts });
}

function defuddleHtml(html: string, targetUrl: string): DefuddleResponse {
	return createDefuddle(html, targetUrl).parse();
}

async function defuddleHtmlAsync(html: string, targetUrl: string, language?: string): Promise<DefuddleResponse> {
	return createDefuddle(html, targetUrl, { language }).parseAsync();
}

export function parseHtml(html: string, url: string): DefuddleResponse & { contentHtml?: string } {
	const result = defuddleHtml(html, url);
	const contentHtml = result.content;
	toMarkdown(result, { markdown: true }, url);
	return { ...result, contentHtml };
}

function isYouTubeUrl(url: string): boolean {
	try {
		const { hostname } = new URL(url);
		return hostname === 'youtube.com' || hostname === 'www.youtube.com' || hostname === 'youtu.be';
	} catch { return false; }
}

function getYouTubeVideoId(url: string): string {
	try {
		const u = new URL(url);
		if (u.hostname === 'youtu.be') return u.pathname.slice(1).split('?')[0];
		if (u.pathname.includes('/shorts/')) return u.pathname.split('/shorts/')[1].split('/')[0];
		return u.searchParams.get('v') || '';
	} catch { return ''; }
}

/**
 * Fetch YouTube content without loading the watch page.
 * Uses oEmbed for metadata and the existing YoutubeExtractor (InnerTube API) for transcripts.
 * This avoids 429 rate-limiting that Cloudflare IPs receive from youtube.com.
 */
async function fetchYouTubeContent(targetUrl: string, language?: string): Promise<DefuddleResponse> {
	const videoId = getYouTubeVideoId(targetUrl);
	if (!videoId) throw new Error('Could not extract YouTube video ID');

	let title = '';
	let author = '';
	let thumbnailUrl = `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`;

	try {
		const oEmbedUrl = `https://www.youtube.com/oembed?url=${encodeURIComponent(targetUrl)}&format=json`;
		const resp = await fetch(oEmbedUrl, { signal: AbortSignal.timeout(4000) });
		if (resp.ok) {
			const data = await resp.json() as any;
			title = data.title || '';
			author = data.author_name || '';
			thumbnailUrl = data.thumbnail_url || thumbnailUrl;
		}
	} catch {
		// oEmbed failed — proceed with empty metadata; transcript may still work
	}

	// Build minimal HTML with a schema.org VideoObject so YoutubeExtractor can read metadata
	const schemaOrg = JSON.stringify({
		'@context': 'https://schema.org',
		'@type': 'VideoObject',
		name: title,
		author,
		thumbnailUrl,
	});
	const pageTitle = title ? `${title} - YouTube` : 'YouTube';
	const minimalHtml = `<!DOCTYPE html><html><head><title>${pageTitle}</title><script type="application/ld+json">${schemaOrg}<\/script></head><body></body></html>`;

	return defuddleHtmlAsync(minimalHtml, targetUrl, language);
}

export async function convertToHtml(targetUrl: string, language?: string): Promise<DefuddleResponse> {
	if (isYouTubeUrl(targetUrl)) {
		return fetchYouTubeContent(targetUrl, language);
	}

	const initialUA = getInitialUA(targetUrl);
	const html = await fetchPage(targetUrl, initialUA, language);
	let result = await defuddleHtmlAsync(html, targetUrl, language);

	if (result.wordCount === 0 && initialUA !== BOT_UA) {
		try {
			const botHtml = await fetchPage(targetUrl, BOT_UA, language);
			const botResult = await defuddleHtmlAsync(botHtml, targetUrl, language);
			if (botResult.wordCount > 0) {
				return botResult;
			}
		} catch {
			// Bot UA may be blocked — fall through to original result
		}
	}

	return result;
}

export async function convertToMarkdown(targetUrl: string, language?: string): Promise<DefuddleResponse> {
	// YouTube: bypass page fetch — use oEmbed + InnerTube API to avoid 429 rate-limiting
	if (isYouTubeUrl(targetUrl)) {
		const result = await fetchYouTubeContent(targetUrl, language);
		toMarkdown(result, { markdown: true }, targetUrl);
		return result;
	}

	const initialUA = getInitialUA(targetUrl);
	const html = await fetchPage(targetUrl, initialUA, language);
	let result = await defuddleHtmlAsync(html, targetUrl, language);

	// If no content was extracted, the page may be JS-rendered.
	// Retry with a bot UA — some sites serve pre-rendered content to bots.
	if (result.wordCount === 0 && initialUA !== BOT_UA) {
		try {
			const botHtml = await fetchPage(targetUrl, BOT_UA, language);

			// Check for raw markdown in the HTML before DOM parsing destroys
			// whitespace (e.g. tab-indented lists). Some sites like Obsidian
			// Publish embed raw markdown in a text node for bot UAs.
			const rawMarkdown = extractRawMarkdown(botHtml);
			if (rawMarkdown) {
				const botResult = await defuddleHtmlAsync(botHtml, targetUrl, language);
				botResult.content = cleanMarkdownContent(rawMarkdown);
				botResult.wordCount = countWords(botResult.content);
				return botResult;
			}
			const botResult = await defuddleHtmlAsync(botHtml, targetUrl, language);
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

function truncateWords(text: string, maxWords: number): string {
	let words = 0;
	let inWord = false;

	for (let i = 0; i < text.length; i++) {
		const code = text.charCodeAt(i);
		const isCJK = (
			(code >= 0x3040 && code <= 0x309f) ||
			(code >= 0x30a0 && code <= 0x30ff) ||
			(code >= 0x3400 && code <= 0x4dbf) ||
			(code >= 0x4e00 && code <= 0x9fff) ||
			(code >= 0xf900 && code <= 0xfaff) ||
			(code >= 0xac00 && code <= 0xd7af)
		);

		if (isCJK) {
			words++;
			inWord = false;
		} else if (code <= 32) {
			inWord = false;
		} else if (!inWord) {
			words++;
			inWord = true;
		}

		if (words > maxWords) {
			return text.slice(0, i).trimEnd() + '…';
		}
	}
	return text;
}

export function formatResponse(result: DefuddleResponse, sourceUrl: string): string {
	const frontmatter: string[] = ['---'];

	// Escape a string for use as a YAML double-quoted value
	const esc = (s: string) => s.replace(/"/g, '\\"').replace(/\n/g, ' ');

	if (result.title) {
		frontmatter.push(`title: "${esc(result.title)}"`);
	}
	if (result.author) {
		frontmatter.push(`author: "${esc(result.author)}"`);
	}
	if (result.site) {
		frontmatter.push(`site: "${esc(result.site)}"`);
	}
	if (result.published) {
		frontmatter.push(`published: ${result.published}`);
	}
	frontmatter.push(`source: "${sourceUrl}"`);
	if (result.domain) {
		frontmatter.push(`domain: "${result.domain}"`);
	}
	if (result.language) {
		frontmatter.push(`language: "${result.language}"`);
	}
	if (result.description) {
		const desc = countWords(result.description) > 300
			? truncateWords(result.description, 300)
			: result.description;
		frontmatter.push(`description: "${esc(desc)}"`);
	}
	if (result.wordCount) {
		frontmatter.push(`word_count: ${result.wordCount}`);
	}

	frontmatter.push('---');

	return frontmatter.join('\n') + '\n\n' + result.content;
}
