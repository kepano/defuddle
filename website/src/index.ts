import './polyfill';
import Stripe from 'stripe';
import { getLandingPage } from './landing';
import { getPlaygroundPage } from './playground';
import { getDocsPage } from './docs';
import { getTermsPage } from './terms';
import { getPrivacyPage } from './privacy';
import { getPricingPage } from './pricing';
import { convertToMarkdown, formatResponse, parseHtml } from './convert';

const PRIMARY_HOST = 'defuddle.md';
const BLOCKED_HOSTS = [PRIMARY_HOST, 'defuddle.dev', 'localhost'];

const STATIC_PAGES = new Set(['/', '', '/playground', '/docs', '/terms', '/privacy', '/pricing', '/favicon.ico']);
const CACHE_TTL = 300; // 5 minutes
const MONTHLY_RATE_LIMIT = 5000;

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
	topup?: boolean;
};

type ApiKeyMutationResult = {
	ok: boolean;
	exists: boolean;
	remaining: number;
};

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
	return 'df_' + Array.from(bytes).map(b => b.toString(16).padStart(2, '0')).join('');
}

function generateSessionToken(): string {
	const bytes = new Uint8Array(32);
	crypto.getRandomValues(bytes);
	return Array.from(bytes).map(b => b.toString(16).padStart(2, '0')).join('');
}

function isValidApiKey(key: string): boolean {
	return API_KEY_PATTERN.test(key);
}

async function hashForMetadata(value: string): Promise<string> {
	const hash = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(value));
	return Array.from(new Uint8Array(hash)).map(b => b.toString(16).padStart(2, '0')).join('').slice(0, 16);
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

async function getApiKeyStatus(env: Env, apiKey: string): Promise<ApiKeyMutationResult> {
	const response = await getApiKeyBalanceStub(env, apiKey).fetch('https://internal/status', {
		method: 'POST',
		headers: { 'Content-Type': 'application/json' },
		body: JSON.stringify({ apiKey }),
	});
	return await response.json() as ApiKeyMutationResult;
}

async function creditApiKey(env: Env, apiKey: string, delta: number): Promise<ApiKeyMutationResult> {
	const response = await getApiKeyBalanceStub(env, apiKey).fetch('https://internal/credit', {
		method: 'POST',
		headers: { 'Content-Type': 'application/json' },
		body: JSON.stringify({ apiKey, delta }),
	});
	return await response.json() as ApiKeyMutationResult;
}

async function consumeApiKeyRequest(env: Env, apiKey: string): Promise<ApiKeyMutationResult> {
	const response = await getApiKeyBalanceStub(env, apiKey).fetch('https://internal/consume', {
		method: 'POST',
		headers: { 'Content-Type': 'application/json' },
		body: JSON.stringify({ apiKey }),
	});
	return await response.json() as ApiKeyMutationResult;
}

// --- Stripe webhook verification ---

async function verifyStripeWebhook(payload: string, signature: string, secret: string): Promise<boolean> {
	const parts: Record<string, string> = {};
	for (const part of signature.split(',')) {
		const [k, v] = part.split('=');
		parts[k] = v;
	}

	const timestamp = parts['t'];
	const v1 = parts['v1'];
	if (!timestamp || !v1) return false;

	// Reject signatures older than 5 minutes
	const age = Math.floor(Date.now() / 1000) - parseInt(timestamp, 10);
	if (age > 300) return false;

	const signedPayload = `${timestamp}.${payload}`;
	const key = await crypto.subtle.importKey(
		'raw',
		new TextEncoder().encode(secret),
		{ name: 'HMAC', hash: 'SHA-256' },
		false,
		['sign'],
	);
	const sig = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(signedPayload));
	const expected = Array.from(new Uint8Array(sig)).map(b => b.toString(16).padStart(2, '0')).join('');

	// Constant-time comparison to prevent timing attacks
	if (expected.length !== v1.length) return false;
	let mismatch = 0;
	for (let i = 0; i < expected.length; i++) {
		mismatch |= expected.charCodeAt(i) ^ v1.charCodeAt(i);
	}
	return mismatch === 0;
}

// --- Request handler ---

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
			return jsonResponse(result);
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

	// Terms
	if (path === '/terms') {
		return new Response(getTermsPage(), {
			headers: {
				'Content-Type': 'text/html; charset=utf-8',
				'Cache-Control': 'public, max-age=3600',
			},
		});
	}

	// Privacy
	if (path === '/privacy') {
		return new Response(getPrivacyPage(), {
			headers: {
				'Content-Type': 'text/html; charset=utf-8',
				'Cache-Control': 'public, max-age=3600',
			},
		});
	}

	// Pricing
	if (path === '/pricing') {
		return new Response(getPricingPage(), {
			headers: {
				'Content-Type': 'text/html; charset=utf-8',
				'Cache-Control': 'public, max-age=3600',
			},
		});
	}

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
		const blockId = body.block || '1000';
		const block = BLOCKS[blockId];
		if (!block) {
			return errorResponse(`Invalid block. Options: ${Object.keys(BLOCKS).join(', ')}`, 400);
		}

		const apiKey = generateApiKey();
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
					product_data: { name: `Defuddle API — ${block.name}` },
				},
				quantity: 1,
			}],
			// Store only a hash in Stripe metadata — the real key stays in KV only
			metadata: { key_hash: keyHash, block: blockId },
			success_url: `${baseUrl}/pricing`,
			cancel_url: `${baseUrl}/pricing`,
		});

		// Store pending session for polling (keyed by our token, not the Stripe session ID)
		await env.RATE_LIMIT.put(`session:${sessionToken}`, JSON.stringify({
			status: 'pending',
			api_key: apiKey,
			block: blockId,
			stripe_session_id: session.id,
		}), { expirationTtl: 86400 }); // 24h TTL

		// Reverse mapping: Stripe session ID → our session token (for webhook)
		await env.RATE_LIMIT.put(`stripe_session:${session.id}`, sessionToken, {
			expirationTtl: 86400,
		});

		return jsonResponse({
			checkout_url: session.url,
			session_id: sessionToken,
		});
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
	const topupMatch = path.match(/^\/api\/keys\/([^/]+)\/topup$/);
	if (topupMatch && request.method === 'POST') {
		if (!env.STRIPE_SECRET_KEY || !env.RATE_LIMIT) {
			return errorResponse('Payments not configured.', 503);
		}

		const apiKey = topupMatch[1];
		if (!isValidApiKey(apiKey)) {
			return errorResponse('Invalid API key format.', 400);
		}

		const keyStatus = await getApiKeyStatus(env, apiKey);
		if (!keyStatus.exists) {
			return errorResponse('API key not found.', 404);
		}

		const body = await request.json() as { block?: string };
		const blockId = body.block || '1000';
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
					product_data: { name: `Defuddle API — ${block.name} (top-up)` },
				},
				quantity: 1,
			}],
			metadata: { key_hash: keyHash, block: blockId, topup: 'true' },
			success_url: `${baseUrl}/pricing`,
			cancel_url: `${baseUrl}/pricing`,
		});

		await env.RATE_LIMIT.put(`session:${sessionToken}`, JSON.stringify({
			status: 'pending',
			api_key: apiKey,
			block: blockId,
			topup: true,
			stripe_session_id: session.id,
		}), { expirationTtl: 86400 });

		await env.RATE_LIMIT.put(`stripe_session:${session.id}`, sessionToken, {
			expirationTtl: 86400,
		});

		return jsonResponse({
			checkout_url: session.url,
			session_id: sessionToken,
		});
	}

	// Check usage
	const usageMatch = path.match(/^\/api\/keys\/([^/]+)\/usage$/);
	if (usageMatch && request.method === 'GET') {
		if (!env.RATE_LIMIT) return errorResponse('Not configured.', 503);

		const apiKey = usageMatch[1];
		if (!isValidApiKey(apiKey)) {
			return errorResponse('Invalid API key format.', 400);
		}

		const keyStatus = await getApiKeyStatus(env, apiKey);
		if (!keyStatus.exists) {
			return errorResponse('API key not found.', 404);
		}
		return jsonResponse({ api_key: apiKey, remaining: keyStatus.remaining });
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

	// Parse target URL from path
	let targetUrl = path.replace(/^\/+/, '');
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

	// Auth: check for API key or fall back to IP rate limit
	const authHeader = request.headers.get('authorization');
	let apiKey: string | null = null;

	if (authHeader?.startsWith('Bearer ')) {
		apiKey = authHeader.slice(7);
		if (!isValidApiKey(apiKey)) {
			return errorResponse('Invalid API key format.', 401);
		}
		// Atomically decrement balance before doing work
		const consumeResult = await consumeApiKeyRequest(env, apiKey);
		if (!consumeResult.ok) {
			if (!consumeResult.exists) {
				return errorResponse('API key not found.', 404);
			}
			return errorResponse('API key has no remaining requests. Purchase more at /api/keys or top up at /api/keys/{key}/topup.', 402);
		}
	} else {
		// IP-based rate limiting for unauthenticated requests
		const ip = request.headers.get('cf-connecting-ip') || request.headers.get('x-forwarded-for') || 'unknown';
		if (env.RATE_LIMIT) {
			const { allowed } = await checkRateLimit(env.RATE_LIMIT, ip);
			if (!allowed) {
				return new Response('Error: Monthly rate limit exceeded (5,000 requests/month). Purchase API keys at /api/keys for higher limits.', {
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
	}

	// Check cache for conversion responses (after auth so rate-limited users can't bypass via cache)
	const cacheKey = useCache
		? new Request(new URL(targetUrl, 'https://defuddle.md').toString())
		: null;

	if (cacheKey) {
		const cachedResponse = await caches.default.match(cacheKey);
		if (cachedResponse) {
			// API key balance was already consumed above; only count IP rate limit
			if (!apiKey && env.RATE_LIMIT) {
				const ip = request.headers.get('cf-connecting-ip') || request.headers.get('x-forwarded-for') || 'unknown';
				ctx.waitUntil(incrementRateLimit(env.RATE_LIMIT, ip));
			}
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
				...(cacheKey && result.wordCount > 0 && {
					'Cache-Control': `s-maxage=${CACHE_TTL}`,
				}),
			},
		});

		// Only cache responses with meaningful content
		if (cacheKey && result.wordCount > 0) {
			ctx.waitUntil(caches.default.put(cacheKey, response.clone()));
		}

		// API key balance was already consumed above; only count IP rate limit
		if (!apiKey && env.RATE_LIMIT) {
			const ip = request.headers.get('cf-connecting-ip') || request.headers.get('x-forwarded-for') || 'unknown';
			ctx.waitUntil(incrementRateLimit(env.RATE_LIMIT, ip));
		}

		return response;
	} catch (err) {
		const message = err instanceof Error ? err.message : 'An unexpected error occurred';
		return errorResponse(message, 502);
	}
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

export class ApiKeyBalanceDO implements DurableObject {
	private readonly ctx: DurableObjectState;
	private readonly env: Env;

	constructor(ctx: DurableObjectState, env: Env) {
		this.ctx = ctx;
		this.env = env;
	}

	private async ensureInitialized(apiKey: string): Promise<void> {
		const initialized = await this.ctx.storage.get<boolean>('initialized');
		if (initialized) return;

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
	}

	private async mirrorToKv(apiKey: string, balance: number): Promise<void> {
		if (!this.env.RATE_LIMIT) return;
		await this.env.RATE_LIMIT.put(`key:${apiKey}`, String(balance));
	}

	private async status(apiKey: string): Promise<ApiKeyMutationResult> {
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
