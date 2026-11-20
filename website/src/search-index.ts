import { parseHTML } from 'linkedom';
import type { SearchItem } from './client/search-model';

const plainText = (value: string | null | undefined) => (value ?? '').replace(/\s+/g, ' ').trim();
const excerpt = (value: string) => value.length > 180 ? `${value.slice(0, 177).replace(/\s+\S*$/, '')}…` : value;

export function buildSearchIndex(content: string): SearchItem[] {
	const { document } = parseHTML(`<html><body>${content}</body></html>`);
	const items: SearchItem[] = [];
	for (const heading of document.querySelectorAll('h2, h3')) {
		const title = plainText(heading.textContent);
		const href = `/docs#${heading.id}`;
		const blocks = [];
		for (let node = heading.nextElementSibling; node && !/^H[23]$/.test(node.tagName); node = node.nextElementSibling) blocks.push(node);
		const text = blocks.map(node => plainText(node.textContent)).join(' ');
		const description = blocks.find(node => node.tagName === 'P')?.textContent;
		items.push({ title, kind: 'section', category: 'Documentation', summary: excerpt(plainText(description) || `Reference for ${title}.`), href, searchTerms: [text] });
		for (const block of blocks) {
			for (const row of block.querySelectorAll('tbody tr')) {
				const cells = [...row.querySelectorAll('td')];
				if (cells.length < 2) continue;
				items.push({
					title: plainText(cells[0].textContent),
					kind: cells[0].querySelector('code') ? 'field' : 'section',
					category: title,
					summary: `${title} · ${plainText(cells.at(-1)!.textContent)}`,
					href,
					searchTerms: cells.slice(1).map(cell => plainText(cell.textContent)),
				});
			}
		}
	}
	return items;
}
