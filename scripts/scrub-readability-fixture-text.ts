import { readFileSync, writeFileSync } from 'fs';
import { join } from 'path';
import { parseLinkedomHTML } from '../src/utils/linkedom-compat';

const LOREM_WORDS = (
	'lorem ipsum dolor sit amet consectetur adipiscing elit sed do eiusmod tempor incididunt ut labore et dolore magna aliqua ' +
	'ut enim ad minim veniam quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat duis aute irure ' +
	'dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur excepteur sint occaecat cupidatat non ' +
	'proident sunt in culpa qui officia deserunt mollit anim id est laborum'
).split(/\s+/);

const TEXTLIKE_ATTRS = new Set([
	'alt',
	'title',
	'aria-label',
	'placeholder',
	'content',
]);

const PRESERVE_META_PROPS = new Set([
	'og:url',
	'al:web:url',
	'article:published_time',
	'article:modified_time',
]);

let loremIndex = 0;
const wordMap = new Map<string, string>();

function nextLoremWord(): string {
	const word = LOREM_WORDS[loremIndex % LOREM_WORDS.length];
	loremIndex += 1;
	return word;
}

function looksLikeUrl(value: string): boolean {
	return /^(?:https?:)?\/\//.test(value) || value.startsWith('image://');
}

function scrubWords(value: string): string {
	return value.replace(/[A-Za-z]+(?:['’-][A-Za-z]+)*/g, match => {
		if (match.length <= 1) return match;
		const normalized = match.toLowerCase();
		let replacement = wordMap.get(normalized);
		if (!replacement) {
			replacement = nextLoremWord();
			wordMap.set(normalized, replacement);
		}
		if (match === match.toUpperCase()) return replacement.toUpperCase();
		if (match[0] === match[0].toUpperCase()) {
			return replacement[0].toUpperCase() + replacement.slice(1);
		}
		return replacement;
	});
}

function scrubJsonValue(value: unknown): unknown {
	if (typeof value === 'string') {
		if (looksLikeUrl(value)) return value;
		if (/^\d{4}-\d{2}-\d{2}/.test(value)) return value;
		return scrubWords(value);
	}
	if (Array.isArray(value)) {
		return value.map(scrubJsonValue);
	}
	if (value && typeof value === 'object') {
		return Object.fromEntries(
			Object.entries(value).map(([key, child]) => [key, scrubJsonValue(child)])
		);
	}
	return value;
}

function scrubLdJson(scriptText: string): string {
	try {
		const parsed = JSON.parse(scriptText);
		return JSON.stringify(scrubJsonValue(parsed));
	} catch {
		return scriptText;
	}
}

function scrubHtmlFile(filePath: string): void {
	const original = readFileSync(filePath, 'utf8');
	const hasDoctype = /^\s*<!doctype/i.test(original);
	const doc = parseLinkedomHTML(original);

	for (const script of Array.from(doc.querySelectorAll('script[type="application/ld+json"]'))) {
		script.textContent = scrubLdJson(script.textContent || '');
	}

	const walker = doc.createTreeWalker(doc, 4 | 1);
	let node: Node | null = walker.currentNode;
	while (node) {
		if (node.nodeType === 3) {
			const parentTag = (node.parentElement?.tagName || '').toLowerCase();
			if (!['script', 'style', 'noscript'].includes(parentTag)) {
				node.textContent = scrubWords(node.textContent || '');
			}
		} else if (node.nodeType === 1) {
			const el = node as Element;
			for (const attr of Array.from(el.attributes)) {
				if (!TEXTLIKE_ATTRS.has(attr.name)) continue;
				if (looksLikeUrl(attr.value)) continue;
				if (el.tagName === 'META') {
					const prop = el.getAttribute('property') || el.getAttribute('name') || '';
					if (PRESERVE_META_PROPS.has(prop)) continue;
				}
				el.setAttribute(attr.name, scrubWords(attr.value));
			}
		}
		node = walker.nextNode();
	}

	const serialized = `${hasDoctype ? '<!DOCTYPE html>\n' : ''}${doc.documentElement.outerHTML}\n`;
	writeFileSync(filePath, serialized, 'utf8');
}

function scrubMetadataFile(filePath: string): void {
	const metadata = JSON.parse(readFileSync(filePath, 'utf8')) as Record<string, unknown>;
	for (const key of ['title', 'byline', 'excerpt']) {
		if (typeof metadata[key] === 'string') {
			metadata[key] = scrubWords(metadata[key] as string);
		}
	}
	writeFileSync(filePath, `${JSON.stringify(metadata, null, '\t')}\n`, 'utf8');
}

function main(): void {
	const fixtures = process.argv.slice(2);
	if (fixtures.length === 0) {
		throw new Error('Usage: tsx scripts/scrub-readability-fixture-text.ts <fixture> [fixture...]');
	}

	for (const fixture of fixtures) {
		const dir = join(process.cwd(), 'tests', 'fixtures', 'readability-test-pages', fixture);
		scrubHtmlFile(join(dir, 'source.html'));
		scrubHtmlFile(join(dir, 'expected.html'));
		scrubMetadataFile(join(dir, 'expected-metadata.json'));
	}
}

main();
