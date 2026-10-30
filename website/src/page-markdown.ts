import { parseHTML } from 'linkedom';
import { createMarkdownContent } from '../../src/markdown';
import { getDocsPage } from './docs';
import { getPricingPage } from './pricing';
import { getTermsPage } from './terms';
import { getPrivacyPage } from './privacy';

const pages = new Map([
	['/docs.md', getDocsPage], ['/pricing.md', getPricingPage],
	['/terms.md', getTermsPage], ['/privacy.md', getPrivacyPage],
]);
export const markdownPaths = [...pages.keys()];
const cache = new Map<string, string>();

export function pageToMarkdown(html: string, url: string): string {
	const { document } = parseHTML(html);
	const article = document.querySelector('.docs-content')!;
	article.querySelectorAll('.docs-title-actions, .site-footer, button, script, style, #error').forEach(node => node.remove());
	// The article converter normally omits h1 because its title is metadata.
	// Standalone documentation needs that title in the Markdown itself.
	const heading = article.querySelector('.docs-title h1')!;
	const title = createMarkdownContent(`<p>${heading.innerHTML}</p>`, url);
	heading.remove();
	const codeBlocks: [string, string][] = [];
	for (const block of article.querySelectorAll('[data-code-block]')) {
		const code = [...block.querySelectorAll('.doc-code-source')].map(line => line.textContent ?? '').join('\n');
		const language = block.querySelector('code')?.getAttribute('data-language') ?? '';
		const fence = '`'.repeat(Math.max(3, ...[...code.matchAll(/`+/g)].map(match => match[0].length + 1)));
		let marker = `DEFUDDLEDOCSCODE${codeBlocks.length}PLACEHOLDER`;
		while (html.includes(marker)) marker += 'X';
		codeBlocks.push([marker, `${fence}${language === 'shell' ? 'bash' : language}\n${code}\n${fence}`]);
		const placeholder = document.createElement('p');
		placeholder.textContent = marker;
		block.replaceWith(placeholder);
	}
	for (const block of article.querySelectorAll('.block[data-block]')) {
		const paragraph = document.createElement('p');
		paragraph.textContent = [block.querySelector('.block-name'), block.querySelector('.block-price'), block.querySelector('.block-per')]
			.map(node => node?.textContent?.trim()).filter(Boolean).join(' — ');
		block.replaceWith(paragraph);
	}
	for (const link of article.querySelectorAll('a[href]')) {
		link.setAttribute('href', new URL(link.getAttribute('href')!, url).href);
	}
	const content = [...article.querySelectorAll(':scope > .docs-title, :scope > .markdown-doc, :scope > .docs-updated')].map(node => node.outerHTML).join('\n');
	let markdown = createMarkdownContent(content, url);
	for (const [marker, code] of codeBlocks) markdown = markdown.replace(marker, () => code);
	return `# ${title}\n\n${markdown.trim()}\n`;
}

export function getPageMarkdown(path: string): string | undefined {
	const render = pages.get(path);
	if (!render) return undefined;
	if (!cache.has(path)) cache.set(path, pageToMarkdown(render(), `https://defuddle.md${path.slice(0, -3)}`));
	return cache.get(path)!;
}
