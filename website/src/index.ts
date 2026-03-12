import './polyfill';
import { getLandingPage } from './landing';
import { getPlaygroundPage } from './playground';
import { getDocsPage } from './docs';
import { convertToMarkdown, formatResponse, parseHtml } from './convert';

const PRIMARY_HOST = 'defuddle.md';
const BLOCKED_HOSTS = [PRIMARY_HOST, 'defuddle.dev', 'localhost'];

const STATIC_PAGES = new Set(['/', '', '/playground', '/docs', '/favicon.ico']);
const CACHE_TTL = 300; // 5 minutes

function isLocal(url: URL): boolean {
	return url.hostname === 'localhost' || url.hostname === '127.0.0.1';
}

export default {
	async fetch(request: Request, env: unknown, ctx: ExecutionContext): Promise<Response> {
		try {
			const url = new URL(request.url);
			const path = url.pathname;
			const useCache = !isLocal(url);

			// Redirect defuddle.dev to defuddle.md
			if (url.hostname.includes('defuddle.dev')) {
				const redirectUrl = new URL(request.url);
				redirectUrl.hostname = PRIMARY_HOST;
				return Response.redirect(redirectUrl.toString(), 301);
			}

			// Cache static pages at the edge
			if (useCache && request.method === 'GET' && STATIC_PAGES.has(path)) {
				const cache = caches.default;
				const cacheKey = new Request(url.toString(), request);
				const cachedResponse = await cache.match(cacheKey);
				if (cachedResponse) {
					return cachedResponse;
				}

				const response = await handleRequest(request, url, path, ctx, useCache);
				if (response.ok && response.status !== 204 && response.status !== 205) {
					ctx.waitUntil(cache.put(cacheKey, response.clone()));
				}
				return response;
			}

			return await handleRequest(request, url, path, ctx, useCache);
		} catch (err) {
			const message = err instanceof Error ? err.message : 'An unexpected error occurred';
			return errorResponse(message, 500);
		}
	},
} satisfies ExportedHandler;

async function handleRequest(request: Request, url: URL, path: string, ctx: ExecutionContext, useCache: boolean): Promise<Response> {
	// Landing page
	if (path === '/' || path === '') {
		return new Response(getLandingPage(), {
			headers: {
				'Content-Type': 'text/html; charset=utf-8',
				'Cache-Control': 'public, max-age=3600',
			},
		});
	}

	// Handle CORS preflight
	if (request.method === 'OPTIONS') {
		return new Response(null, {
			headers: {
				'Access-Control-Allow-Origin': '*',
				'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
				'Access-Control-Allow-Headers': 'Content-Type',
			},
		});
	}

	// favicon
	if (path === '/favicon.ico') {
		return new Response(null, { status: 204 });
	}

	// Playground
	if (path === '/playground') {
		let prefillHtml = '';
		if (request.method === 'POST') {
			try {
				const formData = await request.formData();
				prefillHtml = formData.get('html')?.toString() || '';
			} catch {}
		}
		return new Response(getPlaygroundPage(prefillHtml), {
			headers: {
				'Content-Type': 'text/html; charset=utf-8',
				'Cache-Control': 'public, max-age=3600',
			},
		});
	}

	// API: parse HTML to markdown
	if (path === '/api/parse' && request.method === 'POST') {
		try {
			const body = await request.json() as { html: string; url?: string };
			if (!body.html) {
				return errorResponse('Missing "html" field in request body.', 400);
			}
			const result = parseHtml(body.html, body.url || '');
			return new Response(JSON.stringify(result), {
				headers: {
					'Content-Type': 'application/json; charset=utf-8',
					'Access-Control-Allow-Origin': '*',
				},
			});
		} catch (err) {
			const message = err instanceof Error ? err.message : 'An unexpected error occurred';
			return errorResponse(message, 500);
		}
	}

	// Docs
	if (path === '/docs') {
		return new Response(getDocsPage(), {
			headers: {
				'Content-Type': 'text/html; charset=utf-8',
				'Cache-Control': 'public, max-age=3600',
			},
		});
	}

	// Parse target URL from path
	let targetUrl = path.replace(/^\/+/, ''); // Remove leading slashes

	// Decode URI components
	targetUrl = decodeURIComponent(targetUrl);

	// If query string was part of the original URL, append it
	if (url.search) {
		targetUrl += url.search;
	}

	// Prepend https:// if no protocol
	if (!targetUrl.match(/^https?:\/\//)) {
		targetUrl = 'https://' + targetUrl;
	}

	// Validate URL
	let parsedTarget: URL;
	try {
		parsedTarget = new URL(targetUrl);
	} catch {
		return errorResponse('Invalid URL. Please provide a valid web address.', 400);
	}

	// Block self-referential requests
	if (BLOCKED_HOSTS.some(host => parsedTarget.hostname.includes(host))) {
		return errorResponse('Cannot convert this URL.', 400);
	}

	// Check cache for conversion responses
	const cacheKey = useCache
		? new Request(new URL(targetUrl, 'https://defuddle.md').toString())
		: null;

	if (cacheKey) {
		const cachedResponse = await caches.default.match(cacheKey);
		if (cachedResponse) {
			return cachedResponse;
		}
	}

	try {
		const result = await convertToMarkdown(targetUrl);
		const markdown = formatResponse(result, targetUrl);

		const response = new Response(markdown, {
			headers: {
				'Content-Type': 'text/markdown; charset=utf-8',
				'Access-Control-Allow-Origin': '*',
				// Only set cache header for responses with real content.
				// s-maxage controls CDN caching without affecting browser caching.
				...(cacheKey && result.wordCount > 0 && {
					'Cache-Control': `s-maxage=${CACHE_TTL}`,
				}),
			},
		});

		// Only cache responses with meaningful content
		if (cacheKey && result.wordCount > 0) {
			ctx.waitUntil(caches.default.put(cacheKey, response.clone()));
		}

		return response;
	} catch (err) {
		const message = err instanceof Error ? err.message : 'An unexpected error occurred';
		return errorResponse(message, 502);
	}
}

function errorResponse(message: string, status: number): Response {
	return new Response(`Error: ${message}`, {
		status,
		headers: {
			'Content-Type': 'text/plain; charset=utf-8',
			'Access-Control-Allow-Origin': '*',
		},
	});
}
