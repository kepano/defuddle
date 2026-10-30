export interface ParseResult {
	content: string;
	contentHtml?: string;
	[key: string]: unknown;
}
export type ParseState = 'idle' | 'loading' | 'success' | 'error';

export function createParser(callbacks: {
	onResult: (result: ParseResult | null) => void;
	onState: (state: ParseState, message?: string) => void;
}, request: typeof fetch = fetch) {
	let revision = 0;
	let controller: AbortController | undefined;
	function cancel() {
		revision++;
		controller?.abort();
		controller = undefined;
	}
	function clear() {
		cancel();
		callbacks.onResult(null);
		callbacks.onState('idle');
	}
	async function parse(html: string) {
		cancel();
		if (!html.trim()) { clear(); return; }
		const current = revision;
		controller = new AbortController();
		callbacks.onState('loading');
		try {
			const response = await request('/api/parse', {
				method: 'POST', headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ html }), signal: controller.signal,
			});
			if (!response.ok) {
				const text = await response.text();
				let message = text;
				try { message = JSON.parse(text).error || text; } catch { /* Plain-text errors are also supported. */ }
				throw new Error(message || `Parsing failed (${response.status}).`);
			}
			const result = await response.json() as ParseResult;
			if (typeof result.content !== 'string' || (result.contentHtml !== undefined && typeof result.contentHtml !== 'string')) throw new Error('The server returned an invalid result.');
			if (current !== revision) return;
			callbacks.onResult(result);
			callbacks.onState('success');
		} catch (error) {
			if (current !== revision) return;
			callbacks.onResult(null);
			callbacks.onState('error', error instanceof Error ? error.message : 'Unable to parse HTML.');
		} finally {
			if (current === revision) controller = undefined;
		}
	}
	return { parse, clear, cancel };
}
