export interface SearchItem {
	title: string;
	kind: 'page' | 'section' | 'field';
	category: string;
	summary: string;
	href: string;
	searchTerms?: string[];
}

export function searchDocumentation(items: SearchItem[], value: string): SearchItem[] {
	const query = value.trim().toLowerCase();
	if (!query) return items.filter(item => item.kind === 'section').slice(0, 12);
	const words = query.split(/\s+/);
	return items.flatMap((item, index) => {
		const title = item.title.toLowerCase();
		const readableTitle = item.title.replace(/([a-z])([A-Z])/g, '$1 $2').toLowerCase();
		const description = `${item.category} ${item.summary}`.toLowerCase();
		const text = [title, readableTitle, description, ...(item.searchTerms ?? [])].join(' ').toLowerCase();
		if (!words.every(word => text.includes(word))) return [];
		const score = title === query ? 0 : readableTitle === query ? 0.5 : title.startsWith(query) ? 1 : title.includes(query) ? 2
			: words.every(word => readableTitle.includes(word)) ? 3 : description.includes(query) ? 4 : 5;
		return [{ item, score, index }];
	}).sort((a, b) => a.score - b.score || a.index - b.index).slice(0, 12).map(result => result.item);
}
