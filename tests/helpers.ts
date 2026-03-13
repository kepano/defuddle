import { readdirSync } from 'fs';
import { join, basename, extname } from 'path';
import { parseHTML } from 'linkedom';

const USE_JSDOM = process.env.DOM === 'jsdom';

export function getFixtures(): Array<{ name: string; path: string }> {
	const fixturesDir = join(__dirname, 'fixtures');
	const files = readdirSync(fixturesDir).filter(file => file.endsWith('.html'));

	return files.map(file => {
		const name = basename(file, extname(file));
		const path = join(fixturesDir, file);
		return { name, path };
	});
}

function parseWithLinkedom(html: string, url?: string): Document {
	const { document } = parseHTML(html);
	const doc = document as any;
	if (!doc.styleSheets) doc.styleSheets = [];
	if (doc.defaultView && !doc.defaultView.getComputedStyle) {
		doc.defaultView.getComputedStyle = () => ({ display: '' });
	}
	if (url) doc.URL = url;
	return document as unknown as Document;
}

function parseWithJSDOM(html: string, url?: string): Document {
	const { JSDOM, VirtualConsole } = require('jsdom');
	const dom = new JSDOM(html, {
		url,
		storageQuota: 10000000,
		virtualConsole: new VirtualConsole().sendTo(console, { omitJSDOMErrors: true })
	});
	return dom.window.document;
}

export const parseDocument = USE_JSDOM ? parseWithJSDOM : parseWithLinkedom;
