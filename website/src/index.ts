import './polyfill';
import { getLandingPage } from './landing';
import { getPlaygroundPage } from './playground';
import { getDocsPage } from './docs';
import { convertToMarkdown, formatResponse, parseHtml } from './convert';

const PRIMARY_HOST = 'defuddle.md';
const BLOCKED_HOSTS = [PRIMARY_HOST, 'defuddle.dev', 'localhost'];

const STATIC_PAGES = new Set(['/', '', '/playground', '/docs', '/favicon.ico']);
const CACHE_TTL = 300; // 5 minutes
const MONTHLY_RATE_LIMIT = 5000;

function isLocal(url: URL): boolean {
	return url.hostname === 'localhost' || url.hostname === '127.0.0.1';
}

export default {
	async fetch(request: Request, env: { RATE_LIMIT?: KVNamespace }, ctx: ExecutionContext): Promise<Response> {
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

				const response = await handleRequest(request, url, path, env, ctx, useCache);
				if (response.ok && response.status !== 204 && response.status !== 205) {
					ctx.waitUntil(cache.put(cacheKey, response.clone()));
				}
				return response;
			}

			return await handleRequest(request, url, path, env, ctx, useCache);
		} catch (err) {
			const message = err instanceof Error ? err.message : 'An unexpected error occurred';
			return errorResponse(message, 500);
		}
	},
} satisfies ExportedHandler;

type Env = { RATE_LIMIT?: KVNamespace };

function getRateLimitKey(ip: string): string {
	const now = new Date();
	const month = `${now.getUTCFullYear()}-${String(now.getUTCMonth() + 1).padStart(2, '0')}`;
	return `rate:${ip}:${month}`;
}

function secondsUntilMonthEnd(): number {
	const now = new Date();
	const nextMonth = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + 1, 1));
	return Math.ceil((nextMonth.getTime() - now.getTime()) / 1000);
}

async function checkRateLimit(kv: KVNamespace, ip: string): Promise<{ allowed: boolean; count: number }> {
	const key = getRateLimitKey(ip);
	const value = await kv.get(key);
	const count = value ? parseInt(value, 10) : 0;
	return { allowed: count < MONTHLY_RATE_LIMIT, count };
}

async function incrementRateLimit(kv: KVNamespace, ip: string): Promise<void> {
	const key = getRateLimitKey(ip);
	const value = await kv.get(key);
	const count = value ? parseInt(value, 10) : 0;
	await kv.put(key, String(count + 1), { expirationTtl: secondsUntilMonthEnd() });
}

async function handleRequest(request: Request, url: URL, path: string, env: Env, ctx: ExecutionContext, useCache: boolean): Promise<Response> {
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

	// Rate limiting
	const ip = request.headers.get('cf-connecting-ip') || request.headers.get('x-forwarded-for') || 'unknown';
	if (env.RATE_LIMIT) {
		const { allowed } = await checkRateLimit(env.RATE_LIMIT, ip);
		if (!allowed) {
			return new Response('Error: Monthly rate limit exceeded (5,000 requests/month).', {
				status: 429,
				headers: {
					'Access-Control-Allow-Origin': '*',
					'Retry-After': String(secondsUntilMonthEnd()),
					'X-RateLimit-Limit': String(MONTHLY_RATE_LIMIT),
					'X-RateLimit-Remaining': '0',
				},
			});
		}
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

		// Increment rate limit counter (non-blocking)
		if (env.RATE_LIMIT) {
			ctx.waitUntil(incrementRateLimit(env.RATE_LIMIT, ip));
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
