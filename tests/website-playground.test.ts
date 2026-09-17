import { describe, it, expect, vi } from 'vitest';
import { JSDOM } from 'jsdom';
import { createParser } from '../website/src/client/parser';
import { getPlaygroundPage } from '../website/src/playground';

const result = (content: string) => Response.json({ content, contentHtml: `<p>${content}</p>`, title: content });
function deferred() {
	let resolve!: (value: Response) => void;
	const promise = new Promise<Response>(done => { resolve = done; });
	return { promise, resolve };
}

describe('playground live parsing', () => {
	it('discards a superseded response even if the transport ignores abort', async () => {
		const first = deferred(), second = deferred();
		const request = vi.fn().mockReturnValueOnce(first.promise).mockReturnValueOnce(second.promise);
		const onResult = vi.fn(), onState = vi.fn();
		const parser = createParser({ onResult, onState }, request);
		const old = parser.parse('<p>old</p>');
		const current = parser.parse('<p>current</p>');
		expect(request.mock.calls[0][1].signal.aborted).toBe(true);
		second.resolve(result('current'));
		await current;
		first.resolve(result('old'));
		await old;
		expect(onResult).toHaveBeenCalledTimes(1);
		expect(onResult.mock.calls[0][0].content).toBe('current');
		expect(onState).toHaveBeenLastCalledWith('success');
	});
	it('does not restore output after clearing a pending parse', async () => {
		const pending = deferred();
		const onResult = vi.fn(), onState = vi.fn();
		const parser = createParser({ onResult, onState }, vi.fn().mockReturnValue(pending.promise));
		const parsing = parser.parse('<p>content</p>');
		parser.clear();
		pending.resolve(result('content'));
		await parsing;
		expect(onResult.mock.calls).toEqual([[null]]);
		expect(onState).toHaveBeenLastCalledWith('idle');
	});
	it('shows server errors and recovers on the next parse', async () => {
		const onResult = vi.fn(), onState = vi.fn();
		const request = vi.fn().mockResolvedValueOnce(Response.json({ error: 'Try again' }, { status: 500 })).mockResolvedValueOnce(result('Recovered'));
		const parser = createParser({ onResult, onState }, request);
		await parser.parse('<p>content</p>');
		expect(onState).toHaveBeenLastCalledWith('error', 'Try again');
		expect(onResult).toHaveBeenLastCalledWith(null);
		await parser.parse('<p>Recovered</p>');
		expect(onState).toHaveBeenLastCalledWith('success');
		expect(onResult.mock.calls.at(-1)?.[0].content).toBe('Recovered');
	});
	it('clears empty input without making a request', async () => {
		const onResult = vi.fn(), onState = vi.fn(), request = vi.fn();
		await createParser({ onResult, onState }, request).parse(' \n ');
		expect(request).not.toHaveBeenCalled();
		expect(onResult).toHaveBeenCalledWith(null);
	});
});

describe('playground HTML handoff', () => {
	it('preserves code and special characters while keeping pasted HTML inert', () => {
		const html = '</textarea><script>window.bad = true</script><p>`code` ${value} & text</p>';
		const dom = new JSDOM(getPlaygroundPage(html));
		expect(dom.window.document.querySelector('textarea')?.value).toBe(html);
		expect(dom.window.document.querySelectorAll('script:not([type="application/json"])')).toHaveLength(1);
		expect(dom.window.document.querySelector('script')?.src).toBe('/build/playground.js');
		expect(dom.window.document.querySelector('#search-index')?.textContent).not.toContain('window.bad');
		dom.window.close();
	});
});
