import { countWords } from './utils';

const MAX_SIZE = 5 * 1024 * 1024; // 5MB
const FETCH_TIMEOUT = 10_000; // 10s
const REDIRECT_STATUSES = new Set([301, 302, 303, 307, 308]);

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

function getProxyUrl(targetUrl: string): URL | null {
	const isHttps = targetUrl.startsWith('https:');
	const raw =
		(isHttps ? (process.env.HTTPS_PROXY || process.env.https_proxy) : undefined) ||
		process.env.HTTP_PROXY || process.env.http_proxy ||
		process.env.ALL_PROXY || process.env.all_proxy;
	if (!raw) return null;

	// Check NO_PROXY / no_proxy exclusion list
	const noProxy = process.env.NO_PROXY ?? process.env.no_proxy ?? '';
	if (noProxy) {
		const hostname = new URL(targetUrl).hostname;
		const excluded = noProxy.split(',').map(s => s.trim()).some(pattern => {
			if (pattern === '*') return true;
			if (pattern.startsWith('.')) return hostname.endsWith(pattern) || hostname === pattern.slice(1);
			return hostname === pattern || hostname.endsWith('.' + pattern);
		});
		if (excluded) return null;
	}

	try { return new URL(raw); } catch { return null; }
}

function validateAndDecode(contentType: string, contentLength: string | null | undefined, buffer: ArrayBuffer): string {
	if (!contentType.includes('text/html') && !contentType.includes('application/xhtml+xml')) {
		throw new Error(`Not an HTML page (content-type: ${contentType})`);
	}
	if (contentLength) {
		const bytes = parseInt(contentLength);
		if (bytes > MAX_SIZE) {
			throw new Error(`Page too large (${Math.round(bytes / 1024 / 1024)}MB, max 5MB)`);
		}
	}
	if (buffer.byteLength > MAX_SIZE) {
		throw new Error(`Page too large (${Math.round(buffer.byteLength / 1024 / 1024)}MB, max 5MB)`);
	}
	return decodeHtml(buffer, contentType);
}

// Raw HTTP(S) GET through a proxy, returning status + headers + body buffer.
// For HTTPS targets, establishes a CONNECT tunnel then does TLS over the socket.
// node:http and node:tls are required lazily so this module is safe to import
// in environments that don't support those APIs (e.g. Cloudflare Workers).
function proxyGet(
	targetUrl: string,
	proxy: URL,
	reqHeaders: Record<string, string>
): Promise<{ status: number; resHeaders: Record<string, string | string[]>; buffer: Buffer }> {
	// eslint-disable-next-line @typescript-eslint/no-require-imports
	const http = require('node:http') as typeof import('node:http');
	// eslint-disable-next-line @typescript-eslint/no-require-imports
	const tls = require('node:tls') as typeof import('node:tls');

	return new Promise((resolve, reject) => {
		let settled = false;
		let activeRequest: { destroy(): void } | null = null;
		const done = (err: Error | null, result?: any) => {
			if (settled) return;
			settled = true;
			clearTimeout(timer);
			if (err) reject(err);
			else resolve(result);
		};
		const timer = setTimeout(() => {
			activeRequest?.destroy();
			done(new Error(`Timed out fetching page after ${FETCH_TIMEOUT / 1000}s`));
		}, FETCH_TIMEOUT);

		const target = new URL(targetUrl);
		const isHttps = target.protocol === 'https:';
		const targetPort = target.port ? Number(target.port) : (isHttps ? 443 : 80);
		const proxyPort = proxy.port ? Number(proxy.port) : 8080;
		const proxyAuth = proxy.username
			? `Basic ${Buffer.from(`${decodeURIComponent(proxy.username)}:${decodeURIComponent(proxy.password)}`).toString('base64')}`
			: undefined;

		const collectResponse = (res: import('node:http').IncomingMessage) => {
			const chunks: Buffer[] = [];
			let size = 0;
			res.on('data', (chunk: Buffer) => {
				size += chunk.length;
				if (size > MAX_SIZE) { res.destroy(); done(new Error(`Page too large (>${MAX_SIZE / 1024 / 1024}MB)`)); }
				else chunks.push(chunk);
			});
			res.on('end', () => done(null, {
				status: res.statusCode!,
				resHeaders: res.headers as Record<string, string | string[]>,
				buffer: Buffer.concat(chunks),
			}));
			res.on('error', done);
		};

		const outHeaders: Record<string, string> = { ...reqHeaders, 'Host': target.hostname };

		if (isHttps) {
			const connectHeaders: Record<string, string> = { 'Host': `${target.hostname}:${targetPort}` };
			if (proxyAuth) connectHeaders['Proxy-Authorization'] = proxyAuth;

			const connectReq = http.request({
				host: proxy.hostname,
				port: proxyPort,
				method: 'CONNECT',
				path: `${target.hostname}:${targetPort}`,
				headers: connectHeaders,
			});
			activeRequest = connectReq;
			connectReq.on('connect', (connectRes, socket) => {
				if (connectRes.statusCode !== 200) {
					socket.destroy();
					return done(new Error(`Proxy CONNECT failed: ${connectRes.statusCode}`));
				}
				const tlsSocket = tls.connect({ socket, host: target.hostname, servername: target.hostname });
				activeRequest = tlsSocket;
				tlsSocket.on('error', done);
				tlsSocket.on('secureConnect', () => {
					const req = http.request({
						method: 'GET',
						path: target.pathname + target.search,
						headers: outHeaders,
						createConnection: () => tlsSocket as any,
					} as any, collectResponse);
					activeRequest = req;
					req.on('error', done);
					req.end();
				});
			});
			connectReq.on('error', done);
			connectReq.end();
		} else {
			// HTTP forward proxy: send the full target URL as the request path
			if (proxyAuth) outHeaders['Proxy-Authorization'] = proxyAuth;
			const req = http.request({
				host: proxy.hostname,
				port: proxyPort,
				method: 'GET',
				path: targetUrl,
				headers: outHeaders,
			}, collectResponse);
			activeRequest = req;
			req.on('error', done);
			req.end();
		}
	});
}

async function fetchPageViaProxy(
	targetUrl: string,
	proxy: URL,
	reqHeaders: Record<string, string>,
	redirectsLeft = 10
): Promise<string> {
	const { status, resHeaders, buffer } = await proxyGet(targetUrl, proxy, reqHeaders);

	const location = resHeaders['location'];
	if (REDIRECT_STATUSES.has(status) && location && redirectsLeft > 0) {
		const redirectUrl = new URL(Array.isArray(location) ? location[0] : location, targetUrl).href;
		return fetchPageViaProxy(redirectUrl, proxy, reqHeaders, redirectsLeft - 1);
	}

	if (status < 200 || status >= 300) {
		throw new Error(`Failed to fetch: ${status}`);
	}
	const contentType = (resHeaders['content-type'] as string) || '';
	const contentLength = resHeaders['content-length'] as string | undefined;
	const ab = buffer.buffer.slice(buffer.byteOffset, buffer.byteOffset + buffer.byteLength);
	return validateAndDecode(contentType, contentLength, ab);
}

export async function fetchPage(targetUrl: string, userAgent: string, language?: string): Promise<string> {
	const headers: Record<string, string> = {
		'User-Agent': userAgent,
		'Accept': 'text/html,application/xhtml+xml',
	};
	if (language) {
		headers['Accept-Language'] = language;
	}

	const proxy = getProxyUrl(targetUrl);
	if (proxy) {
		return fetchPageViaProxy(targetUrl, proxy, headers);
	}

	const controller = new AbortController();
	const timer = setTimeout(() => controller.abort(), FETCH_TIMEOUT);

	try {
		const response = await fetch(targetUrl, {
			headers,
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
		// check content-length before downloading to avoid fetching oversized responses
		if (contentLength) {
			const bytes = parseInt(contentLength);
			if (bytes > MAX_SIZE) {
				throw new Error(`Page too large (${Math.round(bytes / 1024 / 1024)}MB, max 5MB)`);
			}
		}
		const buffer = await response.arrayBuffer();
		return validateAndDecode(contentType, null, buffer);
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
	const headerMatch = contentType.match(/charset=["']?([^\s;,"']+)/i);
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
