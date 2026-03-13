import { readdirSync } from 'fs';
import { join, basename, extname } from 'path';
import { JSDOM, VirtualConsole } from 'jsdom';

export function getFixtures(): Array<{ name: string; path: string }> {
	const fixturesDir = join(__dirname, 'fixtures');
	const files = readdirSync(fixturesDir).filter(file => file.endsWith('.html'));

	return files.map(file => {
		const name = basename(file, extname(file));
		const path = join(fixturesDir, file);
		return { name, path };
	});
}

export function parseWithJSDOM(html: string, url?: string): Document {
	const dom = new JSDOM(html, {
		url,
		storageQuota: 10000000,
		virtualConsole: new VirtualConsole().sendTo(console, { omitJSDOMErrors: true })
	});
	return dom.window.document;
}
