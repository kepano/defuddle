import { countWords } from './utils';

const MAX_SIZE = 5 * 1024 * 1024; // 5MB
const FETCH_TIMEOUT = 10_000; // 10s

export const DEFAULT_UA = 'Mozilla/5.0 (compatible; Defuddle/1.0; +https://defuddle.md)';
export const BOT_UA = DEFAULT_UA + ' bot';

// Domains that serve better content to bot user agents (e.g. SSR vs client-rendered)
export const BOT_UA_DOMAINS = ['github.com'];

export function getInitialUA(targetUrl: string): string {
	try {
		const hostname = new URL(targetUrl).hostname;
		if (BOT_UA_DOMAINS.some(d => hostname === d || hostname.endsWith('.' + d))) {
			return BOT_UA;
		}
	} catch {}
	return DEFAULT_UA;
}

export async function fetchPage(targetUrl: string, userAgent: string): Promise<string> {
	const controller = new AbortController();
	const timer = setTimeout(() => controller.abort(), FETCH_TIMEOUT);

	try {
		const response = await fetch(targetUrl, {
			headers: {
				'User-Agent': userAgent,
				'Accept': 'text/html,application/xhtml+xml',
			},
			redirect: 'follow',
			signal: controller.signal,
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

		const buffer = await response.arrayBuffer();

		if (buffer.byteLength > MAX_SIZE) {
			throw new Error(`Page too large (${Math.round(buffer.byteLength / 1024 / 1024)}MB, max 5MB)`);
		}

		return decodeHtml(buffer, contentType);
	} catch (err: any) {
		if (err.name === 'AbortError') {
			throw new Error(`Timed out fetching page after ${FETCH_TIMEOUT / 1000}s`);
		}
		throw err;
	} finally {
		clearTimeout(timer);
	}
}

// Windows-1252 bytes 0x80-0x9F that differ from ISO-8859-1/Unicode
const WIN1252: Record<number, number> = {
	0x80:0x20AC,0x82:0x201A,0x83:0x0192,0x84:0x201E,0x85:0x2026,0x86:0x2020,
	0x87:0x2021,0x88:0x02C6,0x89:0x2030,0x8A:0x0160,0x8B:0x2039,0x8C:0x0152,
	0x8E:0x017D,0x91:0x2018,0x92:0x2019,0x93:0x201C,0x94:0x201D,0x95:0x2022,
	0x96:0x2013,0x97:0x2014,0x98:0x02DC,0x99:0x2122,0x9A:0x0161,0x9B:0x203A,
	0x9C:0x0153,0x9E:0x017E,0x9F:0x0178,
};

function decodeWindows1252(buffer: ArrayBuffer): string {
	const bytes = new Uint8Array(buffer);
	const CHUNK = 8192;
	const parts: string[] = [];
	for (let i = 0; i < bytes.length; i += CHUNK) {
		const slice = bytes.subarray(i, Math.min(i + CHUNK, bytes.length));
		const mapped = new Uint16Array(slice.length);
		for (let j = 0; j < slice.length; j++) {
			mapped[j] = WIN1252[slice[j]] ?? slice[j];
		}
		parts.push(String.fromCharCode(...mapped));
	}
	return parts.join('');
}

function detectCharset(contentType: string, buffer: ArrayBuffer): string {
	const headerMatch = contentType.match(/charset=([^\s;]+)/i);
	if (headerMatch) return headerMatch[1].toLowerCase();

	const head = new TextDecoder('latin1').decode(buffer.slice(0, 1024));
	const metaCharset = head.match(/<meta[^>]+charset=["']?([^\s"';>]+)/i);
	if (metaCharset) return metaCharset[1].toLowerCase();

	const metaHttpEquiv = head.match(/<meta[^>]+content=["'][^"']*charset=([^\s"';]+)/i);
	if (metaHttpEquiv) return metaHttpEquiv[1].toLowerCase();

	const bytes = new Uint8Array(buffer, 0, Math.min(buffer.byteLength, 8192));
	for (let i = 0; i < bytes.length; i++) {
		const b = bytes[i];
		if (b >= 0x80 && b <= 0x9F) return 'windows-1252';
		if (b >= 0xC0 && b <= 0xF7) {
			const seqLen = b < 0xE0 ? 2 : b < 0xF0 ? 3 : 4;
			let valid = true;
			for (let j = 1; j < seqLen && i + j < bytes.length; j++) {
				if ((bytes[i + j] & 0xC0) !== 0x80) { valid = false; break; }
			}
			if (valid) { i += seqLen - 1; continue; }
			return 'windows-1252';
		}
	}

	return 'utf-8';
}

function decodeHtml(buffer: ArrayBuffer, contentType: string): string {
	const charset = detectCharset(contentType, buffer);
	if (charset === 'windows-1252' || charset === 'iso-8859-1' || charset === 'latin1') {
		return decodeWindows1252(buffer);
	}
	return new TextDecoder(charset).decode(buffer);
}

/**
 * Extract raw markdown from HTML before DOM parsing.
 * Some sites (e.g. Obsidian Publish) embed raw markdown in a text node
 * for bot user agents. DOM parsing destroys whitespace like tab indentation,
 * so we extract it from the raw HTML string.
 */
export function extractRawMarkdown(html: string): string | null {
	const bodyMatch = html.match(/<body[^>]*>([\s\S]*?)<\/body>/i);
	if (!bodyMatch) return null;

	const textContent = bodyMatch[1]
		.replace(/<(script|style|noscript)[^>]*>[\s\S]*?<\/\1>/gi, '')
		.replace(/<[^>]+>/g, '')
		.trim();
	if (!textContent || !isMarkdownContent(textContent)) return null;

	return textContent;
}

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

export function cleanMarkdownContent(content: string): string {
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
