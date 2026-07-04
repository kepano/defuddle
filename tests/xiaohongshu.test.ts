import { describe, it, expect } from 'vitest';
import { XiaohongshuExtractor } from '../src/extractors/xiaohongshu';
import { createMarkdownContent } from '../src/markdown';
import { JSDOM } from 'jsdom';

describe('XiaohongshuExtractor', () => {
	it('should not let empty subComments array shadow valid sub_comments array', async () => {
		const state = {
			note: {
				noteDetailMap: {
					"test": {
						note: { noteId: "test" },
						comments: [
							{
								id: "1",
								content: "Parent",
								user: { nickname: "A" },
								subComments: [],
								sub_comments: [
									{
										id: "2",
										content: "Reply",
										user: { nickname: "B" }
									}
								]
							}
						]
					}
				}
			}
		};
		const dom = new JSDOM(`<!DOCTYPE html>
		<html>
		<script>
		window.__INITIAL_STATE__ = ${JSON.stringify(state)};
		</script>
		</html>`);

		const ext = new XiaohongshuExtractor(dom.window.document, 'https://www.xiaohongshu.com/explore/test', undefined, { includeReplies: true });
		const result = await ext.extractAsync();
		const md = createMarkdownContent(result.contentHtml, 'test');

		expect(md).toContain('> **A**');
		expect(md).toContain('> > **B**');
	});

	it('should keep native nested replies correctly and not mutate the original object', async () => {
		const state = {
			note: {
				noteDetailMap: {
					"test": {
						note: { noteId: "test" },
						comments: [
							{
								id: "1",
								content: "Parent",
								user: { nickname: "A" },
								subComments: [
									{
										id: "2",
										content: "Reply",
										user: { nickname: "B" }
									}
								]
							}
						]
					}
				}
			}
		};

		const originalStateStr = JSON.stringify(state);

		const dom = new JSDOM(`<!DOCTYPE html>
		<html>
		<script>
		window.__INITIAL_STATE__ = ${originalStateStr};
		</script>
		</html>`);

		const ext = new XiaohongshuExtractor(dom.window.document, 'https://www.xiaohongshu.com/explore/test', undefined, { includeReplies: true });
		const result = await ext.extractAsync();
		const md = createMarkdownContent(result.contentHtml, 'test');

		expect(md).toContain('> **A**');
		expect(md).toContain('> > **B**');

		// Verify no mutations
		const currentStateStr = JSON.stringify(ext['_stateCache']);
		expect(currentStateStr).toEqual(originalStateStr);
	});
	it('should reconstruct comment hierarchy from DOM when state is absent', async () => {
		const html = `<!DOCTYPE html>
		<html>
		<body>
			<div id="noteContainer">
				<div id="detail-title">Test Title</div>
				<div class="comment-item">
					<div class="user-nickname">UserA</div>
					<div class="content">First Comment</div>
				</div>
				<div class="comment-item comment-item-sub">
					<div class="user-nickname">UserB</div>
					<div class="content">Reply to First</div>
				</div>
				<div class="comment-item">
					<div class="user-nickname">UserC</div>
					<div class="content">Second Comment</div>
				</div>
			</div>
		</body>
		</html>`;
		const dom = new JSDOM(html);
		const ext = new XiaohongshuExtractor(dom.window.document, 'https://www.xiaohongshu.com/explore/test', undefined, { includeReplies: true });

		const result = await ext.extractAsync();
		const md = createMarkdownContent(result.contentHtml, 'test');

		expect(md).toContain('> **UserA**');
		expect(md).toContain('> > **UserB**');
		expect(md).toContain('> **UserC**');
		expect(md).not.toContain('> > **UserC**');
	});

	it('should throw an error when fetch rejects (network error)', async () => {
		const dom = new JSDOM(`<!DOCTYPE html><html><body><script>window.__INITIAL_STATE__ = {};</script></body></html>`);
		let fetchCalled = false;
		const ext = new XiaohongshuExtractor(dom.window.document, 'https://www.xiaohongshu.com/explore/test', undefined, {
			fetch: async () => { fetchCalled = true; throw new Error('Network Error'); }
		});
		await expect(ext.extractAsync()).rejects.toThrow('Failed to extract target note data from SPA state or DOM');
		expect(fetchCalled).toBe(true);
	});

	it('should throw an error when fetch returns non-2xx', async () => {
		const dom = new JSDOM(`<!DOCTYPE html><html><body><script>window.__INITIAL_STATE__ = {};</script></body></html>`);
		let fetchCalled = false;
		const ext = new XiaohongshuExtractor(dom.window.document, 'https://www.xiaohongshu.com/explore/test', undefined, {
			fetch: async () => { fetchCalled = true; return ({ ok: false, status: 500 } as Response); }
		});
		await expect(ext.extractAsync()).rejects.toThrow('Failed to extract target note data from SPA state or DOM');
		expect(fetchCalled).toBe(true);
	});

	it('should throw an error when fetch returns captcha HTML (no initial state)', async () => {
		const dom = new JSDOM(`<!DOCTYPE html><html><body><script>window.__INITIAL_STATE__ = {};</script></body></html>`);
		let fetchCalled = false;
		const ext = new XiaohongshuExtractor(dom.window.document, 'https://www.xiaohongshu.com/explore/test', undefined, {
			fetch: async () => {
				fetchCalled = true;
				return ({
					ok: true,
					text: async () => '<!DOCTYPE html><html><body>Captcha!</body></html>'
				} as Response);
			}
		});
		await expect(ext.extractAsync()).rejects.toThrow('Failed to extract target note data from SPA state or DOM');
		expect(fetchCalled).toBe(true);
	});

	it('should throw an error when fetch returns state without target note', async () => {
		const dom = new JSDOM(`<!DOCTYPE html><html><body><script>window.__INITIAL_STATE__ = {};</script></body></html>`);
		let fetchCalled = false;
		const ext = new XiaohongshuExtractor(dom.window.document, 'https://www.xiaohongshu.com/explore/test', undefined, {
			fetch: async () => {
				fetchCalled = true;
				return ({
					ok: true,
					text: async () => '<!DOCTYPE html><html><script>window.__INITIAL_STATE__ = { note: { noteDetailMap: {} } };</script></html>'
				} as Response);
			}
		});
		await expect(ext.extractAsync()).rejects.toThrow('Failed to extract target note data from SPA state or DOM');
		expect(fetchCalled).toBe(true);
	});

	it('should fallback to DOM extraction when fetch fails but note elements exist', async () => {
		const dom = new JSDOM(`<!DOCTYPE html>
			<html><body>
				<div id="noteContainer">
					<h1 id="detail-title">Test DOM Title</h1>
					<div id="detail-desc">Test Description</div>
					<div class="author-name">Test Author</div>
				</div>
				<script>window.__INITIAL_STATE__ = {};</script>
			</body></html>`);
		let fetchCalled = false;
		const ext = new XiaohongshuExtractor(dom.window.document, 'https://www.xiaohongshu.com/explore/test', undefined, {
			fetch: async () => {
				fetchCalled = true;
				throw new Error('Network Error');
			}
		});

		const result = await ext.extractAsync();
		expect(fetchCalled).toBe(true);
		expect(result.variables?.title).toBe('Test DOM Title');
		expect(result.content).toContain('Test Description');
	});

	it('should correctly fallback to DOM extraction and identify video type', async () => {
		const dom = new JSDOM(`<!DOCTYPE html>
			<html><body>
				<div id="noteContainer">
					<h1 id="detail-title">Video Test</h1>
					<video src="https://example.com/video.mp4"></video>
				</div>
				<script>window.__INITIAL_STATE__ = {};</script>
			</body></html>`);
		const ext = new XiaohongshuExtractor(dom.window.document, 'https://www.xiaohongshu.com/explore/test', undefined, {
			fetch: async () => { throw new Error('Network Error'); }
		});

		const result = await ext.extractAsync();
		expect(result.variables?.title).toBe('Video Test');
		expect(result.contentHtml).toContain('<iframe');
	});
});
