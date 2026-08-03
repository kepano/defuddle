import { describe, test, expect } from 'vitest';
import Defuddle from '../src/index';
import { escapeCssIdent } from '../src/utils/dom';
import { parseDocument } from './helpers';

/**
 * escapeCssIdent() exists because getElementSelector() feeds its output back into
 * querySelector(), and also hands it to callers as result.debug.contentSelector.
 * An id carrying CSS syntax (React streaming SSR emits id="S:a", id="B:0") would
 * otherwise produce a selector that throws when re-parsed.
 *
 * The helper deliberately implements the full CSSOM CSS.escape algorithm rather
 * than a shorter approximation, so these tests pin the edge cases that a
 * "simplification" would most plausibly drop — a leading digit, a digit after a
 * leading hyphen, and a lone hyphen all need the hex-escape form, and none of
 * them can be expressed with an inline backslash escape.
 */

/**
 * Canonical CSS.escape (CSSOM spec algorithm), used as an independent oracle.
 * Kept verbatim rather than simplified: its whole job is to disagree with the
 * implementation if the implementation drifts.
 */
function cssEscapeReference(value: string): string {
	const string = String(value);
	const length = string.length;
	const firstCodeUnit = string.charCodeAt(0);
	let index = -1;
	let result = '';
	while (++index < length) {
		const codeUnit = string.charCodeAt(index);
		if (codeUnit === 0x0000) {
			result += '�';
			continue;
		}
		if (
			(codeUnit >= 0x0001 && codeUnit <= 0x001f) || codeUnit === 0x007f ||
			(index === 0 && codeUnit >= 0x0030 && codeUnit <= 0x0039) ||
			(index === 1 && codeUnit >= 0x0030 && codeUnit <= 0x0039 && firstCodeUnit === 0x002d)
		) {
			result += '\\' + codeUnit.toString(16) + ' ';
			continue;
		}
		if (index === 0 && length === 1 && codeUnit === 0x002d) {
			result += '\\' + string.charAt(index);
			continue;
		}
		if (
			codeUnit >= 0x0080 || codeUnit === 0x002d || codeUnit === 0x005f ||
			(codeUnit >= 0x0030 && codeUnit <= 0x0039) ||
			(codeUnit >= 0x0041 && codeUnit <= 0x005a) ||
			(codeUnit >= 0x0061 && codeUnit <= 0x007a)
		) {
			result += string.charAt(index);
			continue;
		}
		result += '\\' + string.charAt(index);
	}
	return result;
}

// Real-world shapes plus every CSS metacharacter and the ident-grammar edges.
const IDS = [
	// React streaming SSR — the shapes that motivated the helper
	'S:a', 'B:0', 'P:8',
	// Ordinary ids that must pass through untouched
	'plain', 'foo-bar_baz', 'a1', '__next', 'post-body-1234', '--custom-prop',
	// Ident-grammar edges needing the hex form
	'1abc', '2col', '-1abc', '-',
	// CSS metacharacters
	'a b', 'a.b', 'a#b', 'a[b]', 'a(b)', 'a>b', 'a~b', 'a+b', 'a,b', 'a*b',
	'a"b', "a'b", 'a\\b', 'a/b', 'a%b', 'a@b', 'a!b', 'a=b', 'a|b', 'a^b', 'a$b',
	// Control character, and non-ASCII which stays literal
	'a\tb', 'café', '日本語', 'Ω',
];

describe('escapeCssIdent', () => {
	test('escapes the ident-grammar edge cases', () => {
		// A leading digit has no inline escape form — it needs `\3N `
		expect(escapeCssIdent('1abc')).toBe('\\31 abc');
		// ...including a digit following a leading hyphen
		expect(escapeCssIdent('-1abc')).toBe('-\\31 abc');
		// A lone hyphen is not a valid ident on its own
		expect(escapeCssIdent('-')).toBe('\\-');
		// But a double hyphen is fine
		expect(escapeCssIdent('--custom-prop')).toBe('--custom-prop');
	});

	test('escapes CSS syntax and leaves safe characters alone', () => {
		expect(escapeCssIdent('S:a')).toBe('S\\:a');
		expect(escapeCssIdent('B:0')).toBe('B\\:0');
		expect(escapeCssIdent('a[b]')).toBe('a\\[b\\]');
		expect(escapeCssIdent('foo-bar_baz')).toBe('foo-bar_baz');
		expect(escapeCssIdent('café')).toBe('café');
		expect(escapeCssIdent('')).toBe('');
	});

	test('agrees with the CSSOM CSS.escape algorithm', () => {
		for (const id of IDS) {
			expect(escapeCssIdent(id), `mismatch for ${JSON.stringify(id)}`)
				.toBe(cssEscapeReference(id));
		}
	});

	// jsdom's selector engine (nwsapi) fails to match the three escapes that emit a
	// backslash before a quote or backslash — \" \' \\ — inside an ID selector,
	// though it accepts their equivalent hex forms and real browsers accept both.
	// The escaping is spec-correct (the CSS.escape agreement test above covers these
	// ids), so this is a limitation of that engine rather than of the helper.
	// linkedom, which backs the Node/CLI/Worker paths, matches all of them.
	const roundTripIds = process.env.DOM === 'jsdom'
		? IDS.filter(id => !/["'\\]/.test(id))
		: IDS;

	test('every escaped id parses and matches the right element', () => {
		for (const id of roundTripIds) {
			const attr = id.replace(/&/g, '&amp;').replace(/"/g, '&quot;');
			const doc = parseDocument(
				`<html><body><div id="decoy">decoy</div><div id="${attr}">target</div></body></html>`,
				'https://example.com/'
			);
			const selector = 'div#' + escapeCssIdent(id);
			let found: Element | null = null;
			expect(
				() => { found = doc.querySelector(selector); },
				`selector threw for id=${JSON.stringify(id)} selector=${selector}`
			).not.toThrow();
			expect(found, `no match for id=${JSON.stringify(id)} selector=${selector}`).not.toBeNull();
			expect(
				(found as unknown as Element).textContent,
				`matched the wrong element for id=${JSON.stringify(id)}`
			).toBe('target');
		}
	});
});

describe('generated selectors round-trip', () => {
	// debug.contentSelector is public output that callers paste back in as the
	// contentSelector option, so it has to be a selector querySelector accepts.
	test('debug.contentSelector is usable against the source document', () => {
		const para = '<p>This is a substantial paragraph of genuine article body text that a '
			+ 'content extractor should identify as the main content rather than boilerplate.</p>';
		const html = `<!doctype html><html><head><title>T</title></head><body>
			<nav><a href="/">Home</a></nav>
			<div hidden id="S:a"><h1>T</h1>${para.repeat(6)}</div>
			<footer><p>Copyright 2026 Example Inc.</p></footer>
		</body></html>`;

		const doc = parseDocument(html, 'https://example.com/');
		const result = new Defuddle(doc, { url: 'https://example.com/', debug: true }).parse();
		const selector = result.debug?.contentSelector;

		expect(selector).toBeTruthy();
		expect(selector).toContain('\\:');
		const fresh = parseDocument(html, 'https://example.com/');
		expect(() => fresh.querySelector(selector!)).not.toThrow();
		expect(fresh.querySelector(selector!)).not.toBeNull();
	});
});
