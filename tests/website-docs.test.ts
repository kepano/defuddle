import { describe, expect, it } from 'vitest';
import { JSDOM } from 'jsdom';
import { docsContent } from '../website/src/docs-content';
import { getDocsPage } from '../website/src/docs';
import { getPricingPage } from '../website/src/pricing';
import { getTermsPage } from '../website/src/terms';
import { getPrivacyPage } from '../website/src/privacy';
import { renderDocsContent } from '../website/src/render-docs';
import { highlightCode } from '../website/src/client/highlight';

describe('documentation rendering', () => {
	it.each([
		['Docs', getDocsPage],
		['Pricing', getPricingPage],
		['Terms', getTermsPage],
		['Privacy', getPrivacyPage],
	] as const)('expands only the current page in the %s sidebar', (title, render) => {
		const dom = new JSDOM(render());
		for (const nav of dom.window.document.querySelectorAll('.docs-navigation')) {
			const links = [...nav.querySelectorAll('.docs-toc-title')];
			expect(links.map(link => link.textContent)).toEqual(['Docs', 'Pricing', 'Terms', 'Privacy']);
			const current = nav.querySelector('[aria-current="page"]')!;
			expect(current.textContent).toBe(title);
			expect(current.getAttribute('href')).toBe('#top');
			expect(nav.querySelectorAll('.docs-toc-outline')).toHaveLength(1);
			expect(current.parentElement!.querySelector('.docs-toc-outline')).not.toBeNull();
			for (const link of links.filter(link => link !== current)) {
				expect(link.getAttribute('href')).toBe(`/${link.textContent!.toLowerCase()}`);
				expect(link.parentElement!.querySelector('.docs-toc-outline')).toBeNull();
			}
		}
		dom.window.close();
	});
	it('preserves all authored code, blank lines, tables, and headings', () => {
		const original = new JSDOM(docsContent);
		const page = new JSDOM(getDocsPage());
		const before = original.window.document, after = page.window.document;
		const code = [...before.querySelectorAll('pre > code')].map(node => node.textContent);
		const rendered = [...after.querySelectorAll('[data-code-block]')].map(block => [...block.querySelectorAll('.doc-code-source')].map(line => line.textContent).join('\n'));
		expect(rendered).toEqual(code);
		expect([...after.querySelectorAll('table')].map(node => node.textContent)).toEqual([...before.querySelectorAll('table')].map(node => node.textContent));
		const headings = [...after.querySelectorAll('.markdown-doc h2, .markdown-doc h3')];
		expect(headings.map(node => node.textContent)).toEqual([...before.querySelectorAll('h2, h3')].map(node => node.textContent));
		const links = [...after.querySelectorAll('.docs-desktop-outline .docs-toc-outline a')];
		expect(links.map(link => link.getAttribute('href'))).toEqual(headings.map(heading => `#${heading.id}`));
		expect(new Set(headings.map(node => node.id)).size).toBe(headings.length);
		expect(after.querySelectorAll('[data-copy-code]')).toHaveLength(code.length);
		original.window.close(); page.window.close();
	});
	it('uses Knap highlighting for shell and JavaScript', () => {
		const dom = new JSDOM(getDocsPage());
		for (const code of dom.window.document.querySelectorAll('code[data-language="ts"], code[data-language="shell"]')) {
			const source = [...code.querySelectorAll('.doc-code-source')].map(line => line.textContent).join('\n');
			const expected = new JSDOM(highlightCode(source, code.getAttribute('data-language') as 'ts' | 'shell'));
			expect(code.innerHTML).toBe(expected.window.document.body.innerHTML);
			expected.window.close();
		}
		dom.window.close();
	});
	it('keeps highlighted HTML inert and preserves escaped source', () => {
		const value = '<script>window.bad = true</script>\n<div title="&quot;">& text</div>\n\n';
		const escape = (text: string) => text.replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;');
		const dom = new JSDOM(renderDocsContent(`<pre><code class="language-html">${escape(value)}</code></pre>`).content);
		expect(dom.window.document.querySelector('script')).toBeNull();
		expect([...dom.window.document.querySelectorAll('.doc-code-source')].map(line => line.textContent).join('\n')).toBe(value);
		expect(dom.window.document.querySelector('.syn-tag')?.textContent).toBe('script');
		dom.window.close();
	});
	it('assigns unique subsection links while preserving existing anchors', () => {
		const dom = new JSDOM(renderDocsContent('<h2 id="example">Example</h2><h3>Example</h3><h3>Example</h3>').content);
		expect([...dom.window.document.querySelectorAll('h2, h3')].map(node => node.id)).toEqual(['example', 'example-2', 'example-3']);
		dom.window.close();
	});
});
