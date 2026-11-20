import { docsContent } from './docs-content';
import { renderDocsContent } from './render-docs';
import { buildSearchIndex } from './search-index';
import type { SearchItem } from './client/search-model';

export const docs = renderDocsContent(docsContent);
export const searchIndex: SearchItem[] = [
	...buildSearchIndex(docs.content),
	{ title: 'Documentation', kind: 'page', category: 'Guide', summary: 'Install and use Defuddle in the browser, Node.js, and the CLI.', href: '/docs' },
	{ title: 'Playground', kind: 'page', category: 'Tool', summary: 'Try Defuddle with HTML and inspect Markdown, HTML, and metadata.', href: '/playground' },
	{ title: 'Pricing', kind: 'page', category: 'API', summary: 'API request blocks, usage, and top-ups.', href: '/pricing' },
	{ title: 'Terms', kind: 'page', category: 'Service', summary: 'Terms of service.', href: '/terms' },
	{ title: 'Privacy', kind: 'page', category: 'Service', summary: 'Privacy policy and data retention.', href: '/privacy' },
];
