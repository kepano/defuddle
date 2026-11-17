import { describe, test, expect, vi, afterEach } from 'vitest';
import { JSDOM } from 'jsdom';
import { parseHTML } from 'linkedom';
import DefuddleClass from '../src/index';
import { Defuddle } from '../src/node';
import { parseLinkedomHTML } from '../src/utils/linkedom-compat';
import { lowercaseAttributeNames } from '../src/utils/attribute-case';

/**
 * HTML parsers lowercase attribute names; linkedom keeps the source case
 * (`<A HREF>`, React's `colSpan`), so selectors and getAttribute() miss them.
 * Defuddle lowercases them on a copy of the document before reading it.
 */

const URL_ = 'https://www.example.com/guide/loops.html';
const PARA = '<P>This old page was written by hand many years ago, and it still explains the topic in plain words for anyone who finds it today.</P>';

function linkedom(html: string): Document {
	return parseHTML(html).document as unknown as Document;
}

function jsdom(html: string, options: Record<string, unknown> = {}): Document {
	return new JSDOM(html, { url: URL_, ...options }).window.document;
}

function names(el: Element | null): string[] {
	return el ? el.getAttributeNames() : [];
}

describe('lowercaseAttributeNames', () => {
	test('makes upper-case HREF, SRC, CLASS and ID reachable', () => {
		const doc = lowercaseAttributeNames(linkedom(
			'<HTML><BODY><DIV ID="main" CLASS="sidebar menu"><A HREF="/a.html">a</A><IMG SRC="/b.png" ALT="b"></DIV></BODY></HTML>'
		));
		expect(doc.querySelector('a')?.getAttribute('href')).toBe('/a.html');
		expect(doc.querySelector('img[src="/b.png"]')).not.toBeNull();
		expect(doc.querySelector('.sidebar.menu')).not.toBeNull();
		expect(doc.getElementById('main')).not.toBeNull();
	});

	test('lowercases names on <html> and <head> elements', () => {
		const doc = lowercaseAttributeNames(linkedom(
			'<HTML LANG="en"><HEAD><META NAME="author" CONTENT="Pat Example"></HEAD><BODY></BODY></HTML>'
		));
		expect(doc.documentElement.getAttribute('lang')).toBe('en');
		expect(doc.querySelector('meta[name="author"]')?.getAttribute('content')).toBe('Pat Example');
	});

	test('lowercases React camelCase names on HTML elements', () => {
		const doc = lowercaseAttributeNames(linkedom(
			'<html><body><table><tr><td colSpan="2">a</td></tr></table><div itemProp="name" itemScope>b</div></body></html>'
		));
		expect(names(doc.querySelector('td'))).toEqual(['colspan']);
		expect(doc.querySelector('[itemprop="name"][itemscope]')).not.toBeNull();
	});

	test('returns the same document when no name needs lowercasing', () => {
		const doc = linkedom('<html><body><svg viewBox="0 0 1 1"><path d="M0 0"/></svg><p class="x">a</p></body></html>');
		expect(lowercaseAttributeNames(doc)).toBe(doc);
	});

	test('returns the same document for spec DOMs, whose parser already lowercased names', () => {
		const doc = jsdom('<html><body><p>a</p></body></html>');
		// Only reachable through the namespace API: a spec parser never produces it.
		doc.querySelector('p')!.setAttributeNS(null, 'Data-Test', '1');
		expect(lowercaseAttributeNames(doc)).toBe(doc);
		expect(names(doc.querySelector('p'))).toEqual(['Data-Test']);
	});

	test('leaves XHTML documents alone: their names are case-sensitive', () => {
		const doc = jsdom(
			'<html xmlns="http://www.w3.org/1999/xhtml"><head><title>t</title></head><body><p Class="x">a</p></body></html>',
			{ contentType: 'application/xhtml+xml' }
		);
		expect(lowercaseAttributeNames(doc)).toBe(doc);
		expect(names(doc.querySelector('p'))).toEqual(['Class']);
	});

	test('does not mutate the input document', () => {
		const html = '<HTML LANG="en"><BODY CLASS="page"><A HREF="/a.html" ONCLICK="go()">a</A></BODY></HTML>';
		const input = linkedom(html);
		const before = input.documentElement.outerHTML;
		const copy = lowercaseAttributeNames(input);
		expect(copy).not.toBe(input);
		expect(input.documentElement.outerHTML).toBe(before);
		expect(names(input.querySelector('a'))).toEqual(['HREF', 'ONCLICK']);
		expect(names(copy.querySelector('a'))).toEqual(['href', 'onclick']);
	});

	test('keeps SVG and MathML names, which are case-sensitive', () => {
		const doc = lowercaseAttributeNames(linkedom(
			'<html><body><P CLASS="x">a</P>' +
			'<svg viewBox="0 0 10 10" preserveAspectRatio="none"><use xlink:href="#i"/><linearGradient gradientUnits="userSpaceOnUse"/></svg>' +
			'<math><mi definitionURL="https://example.com/def">x</mi></math></body></html>'
		));
		expect(names(doc.querySelector('p'))).toEqual(['class']);
		expect(names(doc.querySelector('svg'))).toEqual(['viewBox', 'preserveAspectRatio']);
		expect(names(doc.querySelector('use'))).toEqual(['xlink:href']);
		expect(names(doc.querySelector('linearGradient'))).toEqual(['gradientUnits']);
		expect(names(doc.querySelector('mi'))).toEqual(['definitionURL']);
	});

	test('keeps namespaced names on HTML elements, lowercased', () => {
		const doc = lowercaseAttributeNames(linkedom(
			'<html XML:LANG="en" XMLNS:OG="https://ogp.me/ns#"><body><a XLINK:HREF="#x" href="/a">a</a></body></html>'
		));
		expect(doc.documentElement.getAttribute('xml:lang')).toBe('en');
		expect(doc.documentElement.getAttribute('xmlns:og')).toBe('https://ogp.me/ns#');
		expect(names(doc.querySelector('a'))).toEqual(['xlink:href', 'href']);
	});

	test('keeps the first of duplicate names, like the HTML parser', () => {
		const html = '<html><body><a HREF="/first" href="/second" Href="/third" CLASS="a" class="b">a</a></body></html>';
		const doc = lowercaseAttributeNames(linkedom(html));
		const link = doc.querySelector('a')!;
		expect(names(link)).toEqual(['href', 'class']);
		expect(link.getAttribute('href')).toBe('/first');
		expect(link.getAttribute('class')).toBe('a');
		const spec = jsdom(html).querySelector('a')!;
		expect(names(link)).toEqual(names(spec));
		expect(link.getAttribute('href')).toBe(spec.getAttribute('href'));
	});

	test('keeps source order, like the HTML parser', () => {
		const html = '<html><body><table><tr><TD COLSPAN="2" ALIGN="left" id="cell" VALIGN="top">a</TD></tr></table></body></html>';
		const cell = lowercaseAttributeNames(linkedom(html)).getElementById('cell');
		expect(names(cell)).toEqual(['colspan', 'align', 'id', 'valign']);
		expect(names(cell)).toEqual(names(jsdom(html).getElementById('cell')));
	});

	test('lowercases ASCII letters only, like the HTML tokenizer', () => {
		const html = '<html><body><p DATA-Ä="1">a</p></body></html>';
		const p = lowercaseAttributeNames(linkedom(html)).querySelector('p');
		expect(names(p)).toEqual(['data-Ä']);
		expect(names(p)).toEqual(names(jsdom(html).querySelector('p')));
	});

	test('keeps the document URL and DOMParser on the copy', () => {
		const copy = lowercaseAttributeNames(parseLinkedomHTML('<html><body><A HREF="/a">a</A></body></html>', URL_));
		expect(copy.URL).toBe(URL_);
		// Extractors parse fetched HTML with it; linkedom's cloneNode() leaves it empty.
		expect(typeof copy.defaultView?.DOMParser).toBe('function');
		expect(copy.body.ownerDocument).toBe(copy);
	});

	test('falls back to cloneNode() for documents without a DOMParser', () => {
		const clone = linkedom('<html><body><A HREF="/a">a</A></body></html>').cloneNode(true) as Document;
		expect(clone.defaultView?.DOMParser).toBeFalsy();
		const copy = lowercaseAttributeNames(clone);
		expect(copy).not.toBe(clone);
		expect(copy.querySelector('a')?.getAttribute('href')).toBe('/a');
	});

	test('carries open shadow roots over to the copy', () => {
		const doc = linkedom('<html><body><P CLASS="x">a</P><div id="host"></div></body></html>');
		doc.getElementById('host')!.attachShadow({ mode: 'open' }).append(doc.createTextNode('Shadow text.'));
		const copy = lowercaseAttributeNames(doc);
		expect(copy.getElementById('host')?.shadowRoot?.firstChild?.textContent).toBe('Shadow text.');
	});
});

describe.each(['linkedom', 'jsdom'])('Defuddle on upper-case attribute names (%s)', implementation => {
	function parse(html: string): Document {
		return implementation === 'jsdom' ? jsdom(html) : parseLinkedomHTML(html, URL_);
	}

	function page(head: string, body: string): string {
		return `<!DOCTYPE HTML PUBLIC "-//W3C//DTD HTML 4.01//EN"><HTML LANG="en"><HEAD><TITLE>Old Page</TITLE>${head}</HEAD><BODY>${body}</BODY></HTML>`;
	}

	test('reads metadata from upper-case META, LINK and HTML attributes', async () => {
		const result = await Defuddle(parse(page(
			'<META NAME="author" CONTENT="Pat Example">' +
			'<META NAME="description" CONTENT="An old page about loops.">' +
			'<META PROPERTY="og:site_name" CONTENT="Example Guide">' +
			'<META PROPERTY="og:image" CONTENT="https://www.example.com/cover.png">' +
			'<LINK REL="icon" HREF="/icon.png">',
			`<H1>Old Page</H1>${PARA}${PARA}`
		)), URL_);
		expect(result).toMatchObject({
			author: 'Pat Example',
			description: 'An old page about loops.',
			site: 'Example Guide',
			image: 'https://www.example.com/cover.png',
			favicon: '/icon.png',
			language: 'en',
		});
		expect(result.metaTags).toContainEqual({ name: 'author', property: null, content: 'Pat Example' });
	});

	test('keeps upper-case images and resolves links against <BASE HREF>', async () => {
		const result = await Defuddle(parse(page(
			'<BASE HREF="https://www.example.com/v2/">',
			`<H1>Old Page</H1>${PARA}<P>See <A HREF="details.html">the details</A>.</P><P><IMG SRC="diagram.png" ALT="Diagram" WIDTH="400" HEIGHT="200"></P>${PARA}`
		)), URL_, { separateMarkdown: true });
		expect(result.contentMarkdown).toContain('[the details](https://www.example.com/v2/details.html)');
		expect(result.contentMarkdown).toContain('![Diagram](https://www.example.com/v2/diagram.png)');
	});

	test('removes class-based clutter written in upper case', async () => {
		const result = await Defuddle(parse(page('',
			`<DIV CLASS="sidebar"><P>Maintained by volunteers who check every chapter against the current release before publishing it.</P></DIV>` +
			`<DIV CLASS="sect1"><H1>Old Page</H1>${PARA}${PARA}</DIV>`
		)), URL_);
		expect(result.content).not.toContain('Maintained by volunteers');
		expect(result.content).toContain('written by hand');
	});

	test('resolves links against the document URL when no url option is given', () => {
		const result = new DefuddleClass(parse(page('', `<H1>Old Page</H1>${PARA}<P>See <A HREF="details.html">the details</A>.</P>${PARA}`))).parse();
		expect(result.content).toContain('href="https://www.example.com/guide/details.html"');
	});

	test('does not mutate the input document', async () => {
		const doc = parse(page('<META NAME="author" CONTENT="Pat Example">', `<H1>Old Page</H1>${PARA}<P><A HREF="/a.html">a</A></P>${PARA}`));
		const before = doc.documentElement.outerHTML;
		const result = await Defuddle(doc, URL_);
		expect(result.author).toBe('Pat Example');
		expect(doc.documentElement.outerHTML).toBe(before);
	});

	test('keeps imperative shadow root content', async () => {
		const doc = parse(page('', `<H1>Old Page</H1>${PARA}<DIV ID="host"></DIV>${PARA}`));
		doc.querySelector('div')!.attachShadow({ mode: 'open' }).append(doc.createTextNode('Imperative shadow text.'));
		const result = await Defuddle(doc, URL_);
		expect(result.content).toContain('Imperative shadow text.');
	});
});

describe('Defuddle when lowercasing attribute names fails', () => {
	afterEach(() => vi.restoreAllMocks());

	test('parses the original document', () => {
		const doc = parseLinkedomHTML(`<html><body><article><h1>Old Page</h1>${PARA}${PARA}</article></body></html>`, URL_);
		const error = vi.spyOn(console, 'error').mockImplementation(() => {});
		vi.spyOn(doc, 'createElement').mockImplementationOnce(() => {
			throw new Error('simulated DOM failure');
		});
		const result = new DefuddleClass(doc, { url: URL_ }).parse();
		expect(result.content).toContain('written by hand');
		expect(error).toHaveBeenCalledWith('Defuddle', 'Error lowercasing attribute names:', expect.any(Error));
	});
});
