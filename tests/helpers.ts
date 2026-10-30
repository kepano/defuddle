import { readdirSync } from 'fs';
import { join, basename, extname } from 'path';
import { parseLinkedomHTML } from '../src/utils/linkedom-compat';
import { parseHTML, serializeHTML } from '../src/utils/dom';

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

// Attribute insertion order varies across DOM implementations. Parse both
// sides with the same DOM and sort attributes without dropping their values.
export function normalizeHtmlAttributes(html: string): string {
	const doc = parseLinkedomHTML('<html><body></body></html>');
	const container = doc.createElement('div');
	container.appendChild(parseHTML(doc, html));
	for (const el of container.querySelectorAll('*')) {
		const attributes = Array.from(el.attributes).map(attr => [attr.name, attr.value] as const);
		for (const [name] of attributes) el.removeAttribute(name);
		for (const [name, value] of attributes.sort(([a], [b]) => a.localeCompare(b))) el.setAttribute(name, value);
	}
	return serializeHTML(container);
}

export function normalizeMarkdownHtml(markdown: string): string {
	// Keep code examples byte-for-byte, including examples containing SVG.
	let fence = '';
	let prose = '';
	let result = '';
	const flush = () => {
		result += prose.replace(/<svg\b[\s\S]*?<\/svg>/gi, normalizeHtmlAttributes);
		prose = '';
	};
	for (const line of markdown.match(/[^\n]*\n|[^\n]+$/g) || []) {
		const marker = line.match(/^ {0,3}(`{3,}|~{3,})(.*)/);
		if (fence) {
			result += line;
			if (marker && marker[1][0] === fence[0] && marker[1].length >= fence.length && !marker[2].trim()) fence = '';
		} else if (marker) {
			flush();
			fence = marker[1];
			result += line;
		} else {
			prose += line;
		}
	}
	flush();
	return result;
}
