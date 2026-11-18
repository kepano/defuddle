const HTML_NAMESPACE = 'http://www.w3.org/1999/xhtml';
const ASCII_UPPER_RE = /[A-Z]/;
const ASCII_UPPER_RUN_RE = /[A-Z]+/g;

/**
 * HTML parsers lowercase attribute names (`<A HREF>` becomes `href`, React's
 * `colSpan` becomes `colspan`), and Defuddle's selectors and getAttribute()
 * calls rely on that. linkedom keeps the source case and won't change it
 * (WebReflection/linkedom#235), so on such pages `a[href]`, `img[src]`,
 * `.class` and `<META NAME>` match nothing.
 *
 * Returns `doc` itself when there is nothing to lowercase, which is always
 * the case in browsers and JSDOM: their parsers already did it. Otherwise
 * returns a copy, so the caller's document is never mutated. SVG and MathML
 * elements are left alone: their names are case-sensitive (viewBox,
 * definitionURL).
 */
export function lowercaseAttributeNames(doc: Document): Document {
	// XML documents (XHTML) are case-sensitive by design.
	if (doc.contentType && doc.contentType !== 'text/html') return doc;
	const { keepsCase, prepends } = probeSetAttribute(doc);
	// Spec DOMs lowercase in setAttribute() as their parsers do: nothing to fix.
	if (!keepsCase) return doc;
	if (!Array.from(doc.querySelectorAll('*')).some(hasUpperCaseName)) return doc;

	const copy = copyDocument(doc);
	for (const el of Array.from(copy.querySelectorAll('*'))) {
		if (hasUpperCaseName(el)) lowercaseNames(el, prepends);
	}
	return copy;
}

/** linkedom keeps the case of new attribute names and inserts them first. */
function probeSetAttribute(doc: Document): { keepsCase: boolean; prepends: boolean } {
	const probe = doc.createElement('i');
	probe.setAttribute('A', '');
	probe.setAttribute('b', '');
	const names = probe.getAttributeNames();
	return { keepsCase: names.includes('A'), prepends: names[0] === 'b' };
}

function hasUpperCaseName(el: Element): boolean {
	if (el.namespaceURI !== HTML_NAMESPACE) return false;
	if (!el.getAttributeNames().some(name => ASCII_UPPER_RE.test(name))) return false;
	// linkedom puts MathML in the HTML namespace.
	return !el.closest('math');
}

/**
 * Rebuild the attributes in source order. Like the HTML parser, keep the
 * first of several names that are equal once lowercased (`HREF` and `href`).
 * Only ASCII letters are lowercased, as in the HTML tokenizer.
 */
function lowercaseNames(el: Element, prepends: boolean): void {
	const attributes = new Map<string, string>();
	for (const { name, value } of Array.from(el.attributes)) {
		const lower = name.replace(ASCII_UPPER_RUN_RE, upper => upper.toLowerCase());
		if (!attributes.has(lower)) attributes.set(lower, value);
		el.removeAttribute(name);
	}
	const ordered = Array.from(attributes);
	for (const [name, value] of prepends ? ordered.reverse() : ordered) el.setAttribute(name, value);
}

/**
 * Deep-copy a document with its own DOMParser. linkedom's cloneNode() leaves
 * defaultView.DOMParser empty (extractors parse fetched HTML with it) and
 * drops document.URL and shadow roots.
 */
function copyDocument(doc: Document): Document {
	const Parser = doc.defaultView?.DOMParser;
	const copy = Parser ? new Parser().parseFromString('', 'text/html') : doc.cloneNode(true) as Document;
	if (Parser) copy.replaceChildren(...Array.from(doc.childNodes, node => copy.importNode(node, true)));

	try {
		(copy as { URL: string }).URL = doc.URL;
	} catch {
		// document.URL is read-only in spec DOMs.
	}

	// Same element order in both trees, so open shadow roots map by position.
	const from = doc.querySelectorAll('*');
	const to = copy.querySelectorAll('*');
	for (let i = 0; i < from.length; i++) {
		const shadow = from[i].shadowRoot;
		if (shadow) {
			to[i].attachShadow({ mode: 'open' })
				.append(...Array.from(shadow.childNodes, node => copy.importNode(node, true)));
		}
	}
	return copy;
}
