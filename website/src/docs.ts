import { getDocsLayout } from './docs-layout';
import { docs } from './docs-data';

export function getDocsPage(): string {
	return getDocsLayout({
		id: 'docs',
		title: 'Documentation',
		description: 'Documentation for Defuddle, a library that extracts the main content from web pages and returns clean Markdown or HTML.',
		intro: 'Defuddle extracts the main content from web page and returns clean Markdown or HTML.',
		...docs,
	});
}
