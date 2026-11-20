import { describe, expect, it } from 'vitest';
import { JSDOM } from 'jsdom';
import { getPageMarkdown, pageToMarkdown } from '../website/src/page-markdown';
import { getDocsPage } from '../website/src/docs';
import { getPricingPage } from '../website/src/pricing';
import { getTermsPage } from '../website/src/terms';
import { getPrivacyPage } from '../website/src/privacy';

describe('Markdown page exports', () => {
	it.each([
		['/docs.md', getDocsPage], ['/pricing.md', getPricingPage],
		['/terms.md', getTermsPage], ['/privacy.md', getPrivacyPage],
	] as const)('exports the content linked by both actions on %s', (path, render) => {
		const dom = new JSDOM(render());
		const document = dom.window.document;
		expect(document.querySelector('[data-copy-markdown]')?.getAttribute('data-copy-markdown')).toBe(path);
		expect(document.querySelector('.docs-title-actions a')?.getAttribute('href')).toBe(path);
		expect(document.querySelector('link[type="text/markdown"]')?.getAttribute('href')).toBe(path);
		const markdown = getPageMarkdown(path)!;
		expect(markdown).toMatch(/^# /);
		for (const heading of document.querySelectorAll('.docs-content h1, .markdown-doc h2, .markdown-doc h3')) {
			expect(markdown).toContain(`${'#'.repeat(Number(heading.tagName.slice(1)))} ${heading.textContent}`);
		}
		for (const block of document.querySelectorAll('[data-code-block]')) {
			const source = [...block.querySelectorAll('.doc-code-source')].map(line => line.textContent).join('\n');
			expect(markdown).toContain(source);
		}
		expect(markdown).not.toMatch(/Copy Markdown|View Markdown|Copy code|DEFUDDLEDOCSCODE|<svg|buyBlock\(/);
		expect(markdown).not.toContain('[Home]');
		dom.window.close();
	});
	it('preserves tables, absolute links, prices, and policy dates', () => {
		expect(getPageMarkdown('/docs.md')).toContain('|');
		expect(getPageMarkdown('/docs.md')).toContain('(https://defuddle.md/pricing)');
		expect(getPageMarkdown('/pricing.md')).toContain('1,000 requests — $5 — $0.005 per request');
		expect(getPageMarkdown('/pricing.md')).toContain('100,000 requests — $300 — $0.003 per request');
		expect(getPageMarkdown('/privacy.md')).toContain('Last updated: March 14, 2026');
	});
	it('keeps backticks, blank lines, HTML, and literal entities intact in code', () => {
		const code = '\n```html\n<p>&amp;</p>\n```\n\n';
		const dom = new JSDOM('<article class="docs-content"><header class="docs-title"><h1>Example</h1></header><div class="markdown-doc"><figure data-code-block><code data-language="md"></code></figure></div></article>');
		for (const line of code.split('\n')) {
			const span = dom.window.document.createElement('span');
			span.className = 'doc-code-source';
			span.textContent = line;
			dom.window.document.querySelector('code')!.append(span);
		}
		expect(pageToMarkdown(dom.serialize(), 'https://defuddle.md/docs')).toContain('````md\n' + code + '\n````');
		dom.window.close();
	});
	it('does not export unknown paths', () => {
		expect(getPageMarkdown('/example.com')).toBeUndefined();
	});
});
