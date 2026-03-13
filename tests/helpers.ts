import { readdirSync } from 'fs';
import { join, basename, extname } from 'path';
import { parseLinkedomHTML } from '../src/utils/linkedom-compat';

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

function parseWithJSDOM(html: string, url?: string): Document {
	const { JSDOM, VirtualConsole } = require('jsdom');
	const dom = new JSDOM(html, {
		url,
		storageQuota: 10000000,
		virtualConsole: new VirtualConsole().sendTo(console, { omitJSDOMErrors: true })
	});
	return dom.window.document;
}

export const parseDocument = USE_JSDOM ? parseWithJSDOM : parseLinkedomHTML;
