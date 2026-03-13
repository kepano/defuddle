import { readdirSync } from 'fs';
import { join, basename, extname } from 'path';
import { parseHTML } from 'linkedom';

export function getFixtures(): Array<{ name: string; path: string }> {
	const fixturesDir = join(__dirname, 'fixtures');
	const files = readdirSync(fixturesDir).filter(file => file.endsWith('.html'));

	return files.map(file => {
		const name = basename(file, extname(file));
		const path = join(fixturesDir, file);
		return { name, path };
	});
}

export function parseDocument(html: string, url?: string): Document {
	const { document } = parseHTML(html);
	const doc = document as any;
	if (!doc.styleSheets) doc.styleSheets = [];
	if (doc.defaultView && !doc.defaultView.getComputedStyle) {
		doc.defaultView.getComputedStyle = () => ({ display: '' });
	}
	if (url) doc.URL = url;
	return document as unknown as Document;
}
