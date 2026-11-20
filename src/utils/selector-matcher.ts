// css-select (linkedom) tests every element against every selector in a list.
// This matches compound selectors (tag, #id, .class, [attr], [attr op "value" i],
// :not(compound)) in plain JS, indexed by tag, attribute or class. A selector
// like header:not(:has(img)) runs matches() on that tag only, and the rest
// (combinators) goes to one querySelectorAll call.

type Test = (el: Element) => boolean;

export interface SelectorMatcher {
	tags: Set<string>;
	ids: Set<string>;
	classes: Set<string>;
	byTag: Map<string, Test[]>;
	byAttribute: Map<string, Test[]>;
	byClass: Map<string, Test[]>;
	matchesByTag: Map<string, string>;
	fallback: string;
	selector: string;
}

const IDENT = /^-?[_a-zA-Z][\w-]*/;
const ATTRIBUTE = /^\[\s*([\w-]+)\s*(?:([~^$*|]?=)\s*(?:"([^"\\]*)"|'([^'\\]*)'|([\w-]+))\s*([is])?\s*)?\]/;
const WHITESPACE = /[\t\n\f\r ]+/;

// HTML attributes whose values selectors match case-insensitively
const CASE_INSENSITIVE_ATTRIBUTES = new Set(('accept accept-charset align alink axis bgcolor charset checked clear ' +
	'codetype color compact declare defer dir direction disabled enctype face frame hreflang http-equiv lang language ' +
	'link media method multiple nohref noresize noshade nowrap readonly rel rev rules scope scrolling selected shape ' +
	'target text type valign valuetype vlink').split(' '));

function hasClass(el: Element, name: string): boolean {
	const className = el.getAttribute('class');
	return Boolean(className) && className!.split(WHITESPACE).includes(name);
}

function attributeTest(name: string, op: string | undefined, value: string, caseInsensitive: boolean): Test {
	if (!op) return el => el.hasAttribute(name);
	const expected = caseInsensitive ? value.toLowerCase() : value;
	const read = (el: Element) => {
		const actual = el.getAttribute(name);
		return actual !== null && caseInsensitive ? actual.toLowerCase() : actual;
	};
	switch (op) {
		case '=': return el => read(el) === expected;
		case '~=': return el => expected !== '' && !WHITESPACE.test(expected) && (read(el) || '').split(WHITESPACE).includes(expected);
		case '|=': return el => { const v = read(el); return v === expected || (v !== null && v.startsWith(expected + '-')); };
		case '^=': return el => expected !== '' && (read(el) || '').startsWith(expected);
		case '$=': return el => expected !== '' && (read(el) || '').endsWith(expected);
		default: return el => expected !== '' && (read(el) || '').includes(expected);
	}
}

// Returns null for anything outside the supported grammar
function compileCompound(selector: string): Test | null {
	const tests: Test[] = [];
	let i = 0;
	const tag = selector.match(IDENT);
	if (tag) {
		const name = tag[0].toUpperCase();
		tests.push(el => el.tagName.toUpperCase() === name);
		i = tag[0].length;
	}
	while (i < selector.length) {
		const rest = selector.slice(i);
		let m: RegExpMatchArray | null;
		if (rest[0] === '#' && (m = rest.slice(1).match(IDENT))) {
			const id = m[0];
			tests.push(el => el.getAttribute('id') === id);
			i += 1 + id.length;
		} else if (rest[0] === '.' && (m = rest.slice(1).match(IDENT))) {
			const name = m[0];
			tests.push(el => hasClass(el, name));
			i += 1 + name.length;
		} else if (rest[0] === '[' && (m = rest.match(ATTRIBUTE))) {
			tests.push(attributeTest(m[1], m[2], m[3] ?? m[4] ?? m[5] ?? '',
				m[6] ? m[6] === 'i' : CASE_INSENSITIVE_ATTRIBUTES.has(m[1])));
			i += m[0].length;
		} else if (rest.startsWith(':not(')) {
			const end = rest.indexOf(')');
			const inner = end > 0 ? compileCompound(rest.slice(5, end).trim()) : null;
			if (!inner || /[(,]/.test(rest.slice(5, end))) return null;
			tests.push(el => !inner(el));
			i += end + 1;
		} else {
			return null;
		}
	}
	return el => tests.every(test => test(el));
}

function hasTopLevelCombinator(selector: string): boolean {
	let outer = selector;
	while (/\([^()]*\)/.test(outer)) outer = outer.replace(/\([^()]*\)/g, '');
	return /[\s>+~]/.test(outer);
}

function add(map: Map<string, Test[]>, key: string, test: Test) {
	const tests = map.get(key);
	if (tests) tests.push(test);
	else map.set(key, [test]);
}

export function compileSelectors(selectors: string[]): SelectorMatcher {
	const matcher: SelectorMatcher = {
		tags: new Set(), ids: new Set(), classes: new Set(),
		byTag: new Map(), byAttribute: new Map(), byClass: new Map(), matchesByTag: new Map(),
		fallback: '', selector: selectors.join(',')
	};
	const fallback: string[] = [];
	for (const selector of selectors) {
		if (/^[a-z][\w-]*$/i.test(selector)) { matcher.tags.add(selector.toUpperCase()); continue; }
		if (/^#[\w-]+$/.test(selector)) { matcher.ids.add(selector.slice(1)); continue; }
		if (/^\.[\w-]+$/.test(selector)) { matcher.classes.add(selector.slice(1)); continue; }
		const test = compileCompound(selector);
		let key: RegExpMatchArray | null;
		if (!test && (key = selector.match(/^[a-z][\w-]*(?=:)/i)) && !hasTopLevelCombinator(selector)) {
			const tag = key[0].toUpperCase();
			const joined = matcher.matchesByTag.get(tag);
			matcher.matchesByTag.set(tag, joined ? `${joined},${selector}` : selector);
		}
		else if (!test) fallback.push(selector);
		else if ((key = selector.match(/^[a-z][\w-]*/i))) add(matcher.byTag, key[0].toUpperCase(), test);
		else if ((key = selector.match(/^\[\s*([\w-]+)/))) add(matcher.byAttribute, key[1], test);
		else if ((key = selector.match(/^\.([\w-]+)/))) add(matcher.byClass, key[1], test);
		else fallback.push(selector);
	}
	matcher.fallback = fallback.join(',');
	return matcher;
}

function matchesCompiled(matcher: SelectorMatcher, el: Element): boolean {
	const tag = el.tagName.toUpperCase();
	if (matcher.tags.has(tag)) return true;
	const id = el.getAttribute('id');
	if (id && matcher.ids.has(id)) return true;
	const className = el.getAttribute('class');
	if (className) {
		for (const name of className.split(WHITESPACE)) {
			if (matcher.classes.has(name) || matcher.byClass.get(name)?.some(test => test(el))) return true;
		}
	}
	if (matcher.byTag.get(tag)?.some(test => test(el))) return true;
	const selector = matcher.matchesByTag.get(tag);
	if (selector && el.matches(selector)) return true;
	for (const name of el.getAttributeNames()) {
		if (matcher.byAttribute.get(name)?.some(test => test(el))) return true;
	}
	return false;
}

// Same elements, in the same order, as doc.querySelectorAll(selectors.join(','))
export function querySelectorList(doc: Document, matcher: SelectorMatcher): Element[] {
	// Quirks-mode pages match classes and ids case-insensitively in some DOMs
	if (doc.compatMode === 'BackCompat') {
		return Array.from(doc.querySelectorAll(matcher.selector));
	}
	const fallback = matcher.fallback ? new Set(doc.querySelectorAll(matcher.fallback)) : null;
	const result: Element[] = [];
	const visit = (el: Element) => {
		if (fallback?.has(el) || matchesCompiled(matcher, el)) result.push(el);
		if (el.tagName.toUpperCase() === 'TEMPLATE') return;
		for (let child = el.firstElementChild; child; child = child.nextElementSibling) visit(child);
	};
	if (doc.documentElement) visit(doc.documentElement);
	return result;
}
