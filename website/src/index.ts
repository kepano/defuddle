import './polyfill';
import Stripe from 'stripe';
import { getLandingPage } from './landing';
import { getPlaygroundPage } from './playground';
import { getDocsPage } from './docs';
import { getTermsPage } from './terms';
import { getPrivacyPage } from './privacy';
import { getPricingPage } from './pricing';
import { getSuccessPage } from './success';
import { convertToHtml, convertToMarkdown, formatResponse, parseHtml } from './convert';

const PRIMARY_HOST = 'defuddle.md';
const BLOCKED_HOSTS = [PRIMARY_HOST, 'defuddle.dev', 'localhost'];

const STATIC_PAGES = new Set(['/', '', '/playground', '/docs', '/terms', '/privacy', '/pricing', '/favicon.ico']);
const CACHE_TTL = 300; // 5 minutes
const MONTHLY_RATE_LIMIT = 1000;

const BLOCKS: Record<string, { requests: number; price: number; name: string }> = {
	'1000': { requests: 1000, price: 500, name: '1,000 requests' },
	'10000': { requests: 10000, price: 4000, name: '10,000 requests' },
	'100000': { requests: 100000, price: 30000, name: '100,000 requests' },
};

type Env = {
	RATE_LIMIT?: KVNamespace;
	STRIPE_SECRET_KEY?: string;
	STRIPE_WEBHOOK_SECRET?: string;
	API_KEY_BALANCES: DurableObjectNamespace;
	CHECKOUT_FULFILLMENTS: DurableObjectNamespace;
};

type SessionRecord = {
	status: 'pending' | 'completed';
	api_key: string;
	block: string;
	stripe_session_id: string;
};

type ApiKeyMutationResult = {
	ok: boolean;
	exists: boolean;
	remaining: number;
};

type ApiKeyAuthResult =
	| { ok: true; apiKey: string }
	| { ok: false; response: Response };

function isLocal(url: URL): boolean {
	return url.hostname === 'localhost' || url.hostname === '127.0.0.1';
}

export default {
	async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
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
} satisfies ExportedHandler<Env>;

// --- Shared helpers ---

function toHex(bytes: Uint8Array): string {
	return Array.from(bytes).map(b => b.toString(16).padStart(2, '0')).join('');
}

function getClientIp(request: Request): string {
	return request.headers.get('cf-connecting-ip') || request.headers.get('x-forwarded-for') || 'unknown';
}

function htmlResponse(body: string): Response {
	return new Response(body, {
		headers: {
			'Content-Type': 'text/html; charset=utf-8',
			'Cache-Control': 'public, max-age=3600',
		},
	});
}

function jsonResponse(data: unknown, status = 200): Response {
	return new Response(JSON.stringify(data), {
		status,
		headers: {
			'Content-Type': 'application/json; charset=utf-8',
			'Access-Control-Allow-Origin': '*',
		},
	});
}

function errorResponse(message: string, status: number): Response {
	return new Response(JSON.stringify({ error: message }), {
		status,
		headers: {
			'Content-Type': 'application/json; charset=utf-8',
			'Access-Control-Allow-Origin': '*',
		},
	});
}

// --- Rate limiting ---

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

// --- API key helpers ---

const API_KEY_PATTERN = /^df_[0-9a-f]{48}$/;

function generateApiKey(): string {
	const bytes = new Uint8Array(24);
	crypto.getRandomValues(bytes);
	return 'df_' + toHex(bytes);
}

function generateSessionToken(): string {
	const bytes = new Uint8Array(32);
	crypto.getRandomValues(bytes);
	return toHex(bytes);
}

function isValidApiKey(key: string): boolean {
	return API_KEY_PATTERN.test(key);
}

async function hashForMetadata(value: string): Promise<string> {
	const hash = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(value));
	return toHex(new Uint8Array(hash)).slice(0, 16);
}

function getStripe(env: Env): Stripe {
	return new Stripe(env.STRIPE_SECRET_KEY!, { apiVersion: '2025-04-30.basil' as Stripe.LatestApiVersion });
}

function getApiKeyBalanceStub(env: Env, apiKey: string): DurableObjectStub {
	return env.API_KEY_BALANCES.get(env.API_KEY_BALANCES.idFromName(apiKey));
}

function getCheckoutFulfillmentStub(env: Env, stripeSessionId: string): DurableObjectStub {
	return env.CHECKOUT_FULFILLMENTS.get(env.CHECKOUT_FULFILLMENTS.idFromName(stripeSessionId));
}

async function doApiKeyFetch(
	env: Env,
	apiKey: string,
	action: 'status' | 'credit' | 'consume',
	extra?: Record<string, unknown>,
): Promise<ApiKeyMutationResult> {
	const response = await getApiKeyBalanceStub(env, apiKey).fetch(`https://internal/${action}`, {
		method: 'POST',
		headers: { 'Content-Type': 'application/json' },
		body: JSON.stringify({ apiKey, ...extra }),
	});
	return response.json() as Promise<ApiKeyMutationResult>;
}

function getApiKeyStatus(env: Env, apiKey: string) {
	return doApiKeyFetch(env, apiKey, 'status');
}

function creditApiKey(env: Env, apiKey: string, delta: number) {
	return doApiKeyFetch(env, apiKey, 'credit', { delta });
}

function consumeApiKeyRequest(env: Env, apiKey: string) {
	return doApiKeyFetch(env, apiKey, 'consume');
}

function getBearerApiKey(request: Request): ApiKeyAuthResult {
	const authHeader = request.headers.get('authorization');
	if (!authHeader?.startsWith('Bearer ')) {
		return { ok: false, response: errorResponse('Missing Authorization: Bearer API key.', 401) };
	}

	const apiKey = authHeader.slice(7);
	if (!isValidApiKey(apiKey)) {
		return { ok: false, response: errorResponse('Invalid API key format.', 401) };
	}

	return { ok: true, apiKey };
}

function constantTimeEquals(a: string, b: string): boolean {
	if (a.length !== b.length) return false;
	let mismatch = 0;
	for (let i = 0; i < a.length; i++) {
		mismatch |= a.charCodeAt(i) ^ b.charCodeAt(i);
	}
	return mismatch === 0;
}

// --- Stripe helpers ---

async function verifyStripeWebhook(payload: string, signature: string, secret: string): Promise<boolean> {
	let timestamp: string | null = null;
	const v1Values: string[] = [];
	for (const part of signature.split(',')) {
		const [k, v] = part.split('=');
		if (!k || !v) continue;
		if (k === 't') timestamp = v;
		if (k === 'v1') v1Values.push(v);
	}

	if (!timestamp || v1Values.length === 0) return false;

	const parsedTimestamp = parseInt(timestamp, 10);
	if (!Number.isFinite(parsedTimestamp)) return false;

	// Reject signatures outside the 5 minute tolerance window.
	const age = Math.floor(Date.now() / 1000) - parsedTimestamp;
	if (Math.abs(age) > 300) return false;

	const signedPayload = `${parsedTimestamp}.${payload}`;
	const key = await crypto.subtle.importKey(
		'raw',
		new TextEncoder().encode(secret),
		{ name: 'HMAC', hash: 'SHA-256' },
		false,
		['sign'],
	);
	const sig = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(signedPayload));
	const expected = toHex(new Uint8Array(sig));

	return v1Values.some(v1 => constantTimeEquals(expected, v1));
}

async function createCheckoutFlow(
	env: Env,
	url: URL,
	apiKey: string,
	blockId: string,
	isTopup: boolean,
): Promise<Response> {
	const block = BLOCKS[blockId];
	if (!block) {
		return errorResponse(`Invalid block. Options: ${Object.keys(BLOCKS).join(', ')}`, 400);
	}

	const sessionToken = generateSessionToken();
	const keyHash = await hashForMetadata(apiKey);
	const stripe = getStripe(env);
	const baseUrl = `${url.protocol}//${url.host}`;

	const session = await stripe.checkout.sessions.create({
		mode: 'payment',
		line_items: [{
			price_data: {
				currency: 'usd',
				unit_amount: block.price,
				product_data: { name: `Defuddle API — ${block.name}${isTopup ? ' (top-up)' : ''}` },
			},
			quantity: 1,
		}],
		metadata: { key_hash: keyHash, block: blockId, ...(isTopup && { topup: 'true' }) },
		success_url: `${baseUrl}/success?session=${sessionToken}`,
		cancel_url: `${baseUrl}/pricing`,
	});

	await Promise.all([
		env.RATE_LIMIT!.put(`session:${sessionToken}`, JSON.stringify({
			status: 'pending',
			api_key: apiKey,
			block: blockId,
			stripe_session_id: session.id,
		} satisfies SessionRecord), { expirationTtl: 86400 }),
		env.RATE_LIMIT!.put(`stripe_session:${session.id}`, sessionToken, {
			expirationTtl: 86400,
		}),
	]);

	return jsonResponse({
		checkout_url: session.url,
		session_id: sessionToken,
	});
}

// --- Request handler ---

async function handleRequest(request: Request, url: URL, path: string, env: Env, ctx: ExecutionContext, useCache: boolean): Promise<Response> {
	// Landing page
	if (path === '/' || path === '') {
		return htmlResponse(getLandingPage());
	}

	// Handle CORS preflight
	if (request.method === 'OPTIONS') {
		return new Response(null, {
			headers: {
				'Access-Control-Allow-Origin': '*',
				'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
				'Access-Control-Allow-Headers': 'Content-Type, Authorization',
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
		return htmlResponse(getPlaygroundPage(prefillHtml));
	}

	// API: parse HTML to markdown
	if (path === '/api/parse' && request.method === 'POST') {
		try {
			const body = await request.json() as { html: string; url?: string };
			if (!body.html) {
				return errorResponse('Missing "html" field in request body.', 400);
			}
			const result = parseHtml(body.html, body.url || '');
			return jsonResponse(result);
		} catch (err) {
			const message = err instanceof Error ? err.message : 'An unexpected error occurred';
			return errorResponse(message, 500);
		}
	}

	// Static pages
	if (path === '/docs') return htmlResponse(getDocsPage());
	if (path === '/terms') return htmlResponse(getTermsPage());
	if (path === '/privacy') return htmlResponse(getPrivacyPage());
	if (path === '/pricing') return htmlResponse(getPricingPage());
	if (path === '/success') return htmlResponse(getSuccessPage(url.searchParams.get('session') || ''));

	// --- API key routes ---

	// List available blocks
	if ((path === '/api/keys' || path === '/api/keys/blocks') && request.method === 'GET') {
		const blocks = Object.entries(BLOCKS).map(([id, b]) => ({
			id,
			requests: b.requests,
			price: `$${(b.price / 100).toFixed(2)}`,
		}));
		return jsonResponse({
			blocks,
			usage: 'POST /api/keys with {"block":"1000"} to purchase.',
		});
	}

	// Create new API key (buy a block)
	if (path === '/api/keys' && request.method === 'POST') {
		if (!env.STRIPE_SECRET_KEY || !env.RATE_LIMIT) {
			return errorResponse('Payments not configured.', 503);
		}

		const body = await request.json() as { block?: string };
		const apiKey = generateApiKey();
		return createCheckoutFlow(env, url, apiKey, body.block || '1000', false);
	}

	// Poll for key after checkout
	const sessionMatch = path.match(/^\/api\/keys\/sessions\/(.+)$/);
	if (sessionMatch && request.method === 'GET') {
		if (!env.RATE_LIMIT) return errorResponse('Not configured.', 503);

		const sessionId = sessionMatch[1];
		const data = await env.RATE_LIMIT.get(`session:${sessionId}`);
		if (!data) {
			return errorResponse('Session not found.', 404);
		}

		const session = JSON.parse(data) as SessionRecord;
		if (session.status === 'pending') {
			return jsonResponse({ status: 'pending' }, 202);
		}

		const remaining = (await getApiKeyStatus(env, session.api_key)).remaining;
		return jsonResponse({
			status: 'completed',
			api_key: session.api_key,
			remaining,
		});
	}

	// Top up existing key
	if (path === '/api/keys/topup' && request.method === 'POST') {
		if (!env.STRIPE_SECRET_KEY || !env.RATE_LIMIT) {
			return errorResponse('Payments not configured.', 503);
		}

		const auth = getBearerApiKey(request);
		if (!auth.ok) return auth.response;

		const keyStatus = await getApiKeyStatus(env, auth.apiKey);
		if (!keyStatus.exists) {
			return errorResponse('API key not found.', 404);
		}

		const body = await request.json() as { block?: string };
		return createCheckoutFlow(env, url, auth.apiKey, body.block || '1000', true);
	}

	// Check usage
	if (path === '/api/keys/usage' && request.method === 'GET') {
		if (!env.RATE_LIMIT) return errorResponse('Not configured.', 503);

		const auth = getBearerApiKey(request);
		if (!auth.ok) return auth.response;

		const keyStatus = await getApiKeyStatus(env, auth.apiKey);
		if (!keyStatus.exists) {
			return errorResponse('API key not found.', 404);
		}
		return jsonResponse({ remaining: keyStatus.remaining });
	}

	// Stripe webhook
	if (path === '/api/webhooks/stripe' && request.method === 'POST') {
		if (!env.STRIPE_WEBHOOK_SECRET || !env.RATE_LIMIT) {
			return errorResponse('Webhook not configured.', 503);
		}

		const body = await request.text();
		const signature = request.headers.get('stripe-signature');
		if (!signature) {
			return errorResponse('Missing signature.', 400);
		}

		const valid = await verifyStripeWebhook(body, signature, env.STRIPE_WEBHOOK_SECRET);
		if (!valid) {
			return errorResponse('Invalid signature.', 401);
		}

		const event = JSON.parse(body) as Stripe.Event;

		if (event.type === 'checkout.session.completed') {
			const stripeSession = event.data.object as Stripe.Checkout.Session;
			const blockId = stripeSession.metadata?.block;

			// Look up our session token from the Stripe session ID
			const sessionToken = await env.RATE_LIMIT.get(`stripe_session:${stripeSession.id}`);
			if (sessionToken && blockId && BLOCKS[blockId]) {
				const fulfillmentResponse = await getCheckoutFulfillmentStub(env, stripeSession.id).fetch('https://internal/process', {
					method: 'POST',
					headers: { 'Content-Type': 'application/json' },
					body: JSON.stringify({ sessionToken, blockId }),
				});
				if (!fulfillmentResponse.ok) {
					const message = await fulfillmentResponse.text();
					return errorResponse(message || 'Webhook fulfillment failed.', 500);
				}
			}
		}

		return jsonResponse({ received: true });
	}

	// --- URL conversion route (catch-all) ---

	// Unknown API routes should 404, not fall through to URL conversion
	if (path.startsWith('/api/')) {
		return errorResponse('Not found.', 404);
	}

	// Check for /html/ prefix — returns clean HTML instead of markdown
	const htmlMode = path.startsWith('/html/');
	const urlPath = htmlMode ? path.slice(5) : path;

	// Parse target URL from path
	let targetUrl = urlPath.replace(/^\/+/, '');
	targetUrl = decodeURIComponent(targetUrl);

	if (url.search) {
		targetUrl += url.search;
	}

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

	// Extract preferred language from Accept-Language header (first tag, strip q-value)
	const language = request.headers.get('Accept-Language')?.split(',')[0]?.split(';')[0]?.trim() || undefined;

	// Build cache key before auth so we can check cache before consuming API key credits
	// Include language so different locales don't share cached results
	const cacheUrl = new URL(targetUrl, 'https://defuddle.md');
	if (htmlMode) cacheUrl.searchParams.set('_fmt', 'html');
	if (language) cacheUrl.searchParams.set('_lang', language);
	const cacheKey = useCache ? new Request(cacheUrl.toString()) : null;

	// Auth: check for API key (header or query param) or fall back to IP rate limit
	const authHeader = request.headers.get('authorization');
	let apiKey: string | null = null;

	if (authHeader?.startsWith('Bearer ')) {
		apiKey = authHeader.slice(7);
	} else if (url.searchParams.has('key')) {
		apiKey = url.searchParams.get('key')!;
	}

	if (apiKey) {
		if (!isValidApiKey(apiKey)) {
			return errorResponse('Invalid API key format.', 401);
		}

		// Check cache before consuming a credit
		if (cacheKey) {
			const cachedResponse = await caches.default.match(cacheKey);
			if (cachedResponse) return cachedResponse;
		}

		// Atomically decrement balance before doing work
		const consumeResult = await consumeApiKeyRequest(env, apiKey);
		if (!consumeResult.ok) {
			if (!consumeResult.exists) {
				return errorResponse('API key not found.', 404);
			}
			return errorResponse('API key has no remaining requests. Purchase more at /api/keys or top up at /api/keys/topup with Authorization: Bearer YOUR_KEY.', 402);
		}
	} else {
		// IP-based rate limiting for unauthenticated requests
		const ip = getClientIp(request);
		if (env.RATE_LIMIT) {
			const { allowed } = await checkRateLimit(env.RATE_LIMIT, ip);
			if (!allowed) {
				return new Response('Error: Monthly rate limit exceeded (1,000 requests/month). Purchase API keys at /api/keys for higher limits.', {
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

		// Check cache for unauthenticated requests (after rate limit check)
		if (cacheKey) {
			const cachedResponse = await caches.default.match(cacheKey);
			if (cachedResponse) {
				if (env.RATE_LIMIT) {
					ctx.waitUntil(incrementRateLimit(env.RATE_LIMIT, ip));
				}
				return cachedResponse;
			}
		}
	}

	try {
		const result = htmlMode
			? await convertToHtml(targetUrl, language)
			: await convertToMarkdown(targetUrl, language);
		const body = htmlMode ? result.content : formatResponse(result, targetUrl);
		const contentType = htmlMode ? 'text/html; charset=utf-8' : 'text/markdown; charset=utf-8';

		// Cache if there's meaningful text content, or if an extractor ran and got metadata
		// (e.g. YouTube without transcript — avoids hammering InnerTube on every request)
		const shouldCache = result.wordCount > 0 || !!result.extractorType;

		const response = new Response(body, {
			headers: {
				'Content-Type': contentType,
				'Access-Control-Allow-Origin': '*',
				...(cacheKey && shouldCache && {
					'Cache-Control': `s-maxage=${CACHE_TTL}`,
				}),
			},
		});

		if (cacheKey && shouldCache) {
			ctx.waitUntil(caches.default.put(cacheKey, response.clone()));
		}

		// Only count IP rate limit for unauthenticated requests
		if (!apiKey && env.RATE_LIMIT) {
			ctx.waitUntil(incrementRateLimit(env.RATE_LIMIT, getClientIp(request)));
		}

		return response;
	} catch (err) {
		const message = err instanceof Error ? err.message : 'An unexpected error occurred';
		return errorResponse(message, 502);
	}
}

export class ApiKeyBalanceDO implements DurableObject {
	private readonly ctx: DurableObjectState;
	private readonly env: Env;
	private initialized = false;

	constructor(ctx: DurableObjectState, env: Env) {
		this.ctx = ctx;
		this.env = env;
	}

	private async ensureInitialized(apiKey: string): Promise<void> {
		if (this.initialized) return;

		const stored = await this.ctx.storage.get<boolean>('initialized');
		if (stored) {
			this.initialized = true;
			return;
		}

		let balance = 0;
		let exists = false;
		if (this.env.RATE_LIMIT) {
			const kvValue = await this.env.RATE_LIMIT.get(`key:${apiKey}`);
			if (kvValue !== null) {
				balance = parseInt(kvValue, 10) || 0;
				exists = true;
			}
		}

		await this.ctx.storage.put({
			initialized: true,
			exists,
			balance,
		});
		this.initialized = true;
	}

	private async mirrorToKv(apiKey: string, balance: number): Promise<void> {
		if (!this.env.RATE_LIMIT) return;
		await this.env.RATE_LIMIT.put(`key:${apiKey}`, String(balance));
	}

	private async status(apiKey: string): Promise<ApiKeyMutationResult> {
		return await this.ctx.blockConcurrencyWhile(async () => {
			await this.ensureInitialized(apiKey);
			const [exists, balance] = await Promise.all([
				this.ctx.storage.get<boolean>('exists'),
				this.ctx.storage.get<number>('balance'),
			]);
			return {
				ok: true,
				exists: Boolean(exists),
				remaining: balance ?? 0,
			};
		});
	}

	private async credit(apiKey: string, delta: number): Promise<ApiKeyMutationResult> {
		return await this.ctx.blockConcurrencyWhile(async () => {
			await this.ensureInitialized(apiKey);
			const current = (await this.ctx.storage.get<number>('balance')) ?? 0;
			const updated = Math.max(0, current + delta);
			await this.ctx.storage.put({
				exists: true,
				balance: updated,
			});
			await this.mirrorToKv(apiKey, updated);
			return {
				ok: true,
				exists: true,
				remaining: updated,
			};
		});
	}

	private async consume(apiKey: string): Promise<ApiKeyMutationResult> {
		return await this.ctx.blockConcurrencyWhile(async () => {
			await this.ensureInitialized(apiKey);
			const exists = (await this.ctx.storage.get<boolean>('exists')) ?? false;
			const current = (await this.ctx.storage.get<number>('balance')) ?? 0;
			if (!exists) {
				return {
					ok: false,
					exists: false,
					remaining: 0,
				};
			}
			if (current <= 0) {
				return {
					ok: false,
					exists: true,
					remaining: 0,
				};
			}

			const updated = current - 1;
			await this.ctx.storage.put('balance', updated);
			await this.mirrorToKv(apiKey, updated);
			return {
				ok: true,
				exists: true,
				remaining: updated,
			};
		});
	}

	async fetch(request: Request): Promise<Response> {
		const { pathname } = new URL(request.url);
		const body = await request.json() as { apiKey?: string; delta?: number };
		const apiKey = body.apiKey;
		if (!apiKey || !isValidApiKey(apiKey)) {
			return jsonResponse({ ok: false, exists: false, remaining: 0 }, 400);
		}

		if (pathname === '/status') {
			return jsonResponse(await this.status(apiKey));
		}
		if (pathname === '/credit') {
			return jsonResponse(await this.credit(apiKey, body.delta ?? 0));
		}
		if (pathname === '/consume') {
			return jsonResponse(await this.consume(apiKey));
		}
		return errorResponse('Not found.', 404);
	}
}

export class CheckoutFulfillmentDO implements DurableObject {
	private readonly ctx: DurableObjectState;
	private readonly env: Env;

	constructor(ctx: DurableObjectState, env: Env) {
		this.ctx = ctx;
		this.env = env;
	}

	async fetch(request: Request): Promise<Response> {
		const { pathname } = new URL(request.url);
		if (pathname !== '/process' || request.method !== 'POST') {
			return errorResponse('Not found.', 404);
		}

		const body = await request.json() as { sessionToken?: string; blockId?: string };
		const requestedBlockId = body.blockId;
		if (!body.sessionToken || !requestedBlockId || !BLOCKS[requestedBlockId] || !this.env.RATE_LIMIT) {
			return errorResponse('Invalid request.', 400);
		}

		return await this.ctx.blockConcurrencyWhile(async () => {
			const processed = await this.ctx.storage.get<boolean>('processed');
			if (processed) {
				return jsonResponse({ processed: true, duplicate: true });
			}

			const sessionData = await this.env.RATE_LIMIT!.get(`session:${body.sessionToken}`);
			if (!sessionData) {
				return errorResponse('Session not found.', 404);
			}

			const session = JSON.parse(sessionData) as SessionRecord;
			const blockId = session.block || requestedBlockId;
			if (!BLOCKS[blockId]) {
				return errorResponse('Invalid block.', 400);
			}
			if (session.block && session.block !== requestedBlockId) {
				return errorResponse('Block mismatch.', 409);
			}

			await creditApiKey(this.env, session.api_key, BLOCKS[blockId].requests);

			session.status = 'completed';
			await this.env.RATE_LIMIT!.put(`session:${body.sessionToken}`, JSON.stringify(session), {
				expirationTtl: 86400,
			});
			await this.ctx.storage.put({
				processed: true,
				sessionToken: body.sessionToken,
				apiKey: session.api_key,
				blockId,
			});

			return jsonResponse({ processed: true, duplicate: false });
		});
	}
}
