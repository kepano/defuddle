import { describe, test, expect } from 'vitest';
import { parseDocument } from './helpers';

const BASE_URL = 'http://fakehost/some/dir/';

const runSuite = process.env.READABILITY_PORT === '1';
const describeReadability = runSuite ? describe : describe.skip;

function firstElementChild(node: ParentNode): Element | null {
	for (const child of Array.from(node.childNodes)) {
		if (child.nodeType === child.ELEMENT_NODE) {
			return child as Element;
		}
	}
	return null;
}

describeReadability('Mozilla Readability Parser Compatibility', () => {
	test('preserves escaped HTML in text nodes while decoding textContent', () => {
		const html =
			'<p>Hello, everyone &amp; all their friends, &lt;this&gt; is a &quot; test with &apos; quotes.</p>';
		const doc = parseDocument(html, BASE_URL);
		const p = doc.querySelector('p');
		expect(p).toBeTruthy();
		expect(p!.innerHTML).toBe(
			'Hello, everyone &amp; all their friends, &lt;this&gt; is a " test with \' quotes.'
		);
		expect(p!.textContent).toBe(
			'Hello, everyone & all their friends, <this> is a " test with \' quotes.'
		);
	});

	test('decodes decimal and hex escapes in text content', () => {
		const doc = parseDocument('<p>&#32;&#x20;</p>', BASE_URL);
		expect(doc.querySelector('p')?.textContent).toBe('  ');
	});

	test('does not create element children from script comment-like content', () => {
		const doc = parseDocument('<script><?Silly test <img src="test"></script>', BASE_URL);
		const script = doc.querySelector('script');
		expect(script).toBeTruthy();
		expect(script!.children.length).toBe(0);
		expect(firstElementChild(script!)).toBeNull();
	});

	test('does not create nested script nodes from HTML comments inside scripts', () => {
		const html = '<script><!--Silly test > <script src="foo.js"></script>--></script>';
		const doc = parseDocument(html, BASE_URL);
		const script = doc.querySelector('script');
		expect(script).toBeTruthy();
		expect(script!.querySelector('script')).toBeNull();
		expect(script!.children.length).toBe(0);
	});

	test('keeps escaped tag-like text inside scripts as text content', () => {
		const doc = parseDocument(
			'<script>&lt;div>Hello, I\'m not really in a &lt;/div></script>',
			BASE_URL
		);
		const script = doc.querySelector('script');
		expect(script).toBeTruthy();
		expect(script!.textContent).toBe("<div>Hello, I'm not really in a </div>");
		expect(script!.children.length).toBe(0);
	});

	test('does not get confused by partial closing tags inside scripts', () => {
		const doc = parseDocument(
			"<script>var x = '&lt;script>Hi&lt;' + '/script>';</script>",
			BASE_URL
		);
		const script = doc.querySelector('script');
		expect(script).toBeTruthy();
		expect(script!.textContent).toBe("var x = '<script>Hi<' + '/script>';");
		expect(script!.children.length).toBe(0);
	});

	test('lowercases localName while preserving tagName casing semantics', () => {
		const doc = parseDocument('<DIV><svG><clippath/></svG></DIV>', BASE_URL);
		const div = doc.body.firstElementChild;
		expect(div?.tagName).toBe('DIV');
		expect(div?.localName).toBe('div');
		expect(div?.firstElementChild?.tagName).toBe('svg'.toUpperCase());
		expect(div?.firstElementChild?.localName).toBe('svg');
		expect(div?.firstElementChild?.firstElementChild?.tagName).toBe('clippath'.toUpperCase());
		expect(div?.firstElementChild?.firstElementChild?.localName).toBe('clippath');
	});

	test('recovers from delayed closing tags for void-like elements', () => {
		const doc = parseDocument("<div><input><p>I'm in an input</p></input></div>", BASE_URL);
		const div = doc.querySelector('div');
		expect(div).toBeTruthy();
		expect(div!.childElementCount).toBe(1);
		expect(div!.firstElementChild?.localName).toBe('input');
		expect(div!.firstElementChild?.firstElementChild?.localName).toBe('p');
	});

	test('resolves relative and protocol-relative base URIs', () => {
		const cases = [
			['relative/path', 'http://fakehost/some/dir/relative/path'],
			['/path', 'http://fakehost/path'],
			['http://absolute/', 'http://absolute/'],
			['//absolute/path', 'http://absolute/path'],
		] as const;

		for (const [baseHref, expected] of cases) {
			const html = `<html><head><base href="${baseHref}"></head><body><a href="child"></a></body></html>`;
			const doc = parseDocument(html, BASE_URL);
			const link = doc.querySelector('a') as HTMLAnchorElement | null;
			expect(link).toBeTruthy();
			expect(link!.ownerDocument.baseURI).toBe(expected);
			expect(link!.href).toBe(new URL('child', expected).href);
		}
	});

	test('normalizes simple namespace-prefixed HTML tag names', () => {
		const html =
			'<a0:html><a0:body><a0:DIV><a0:svG><a0:clippath/></a0:svG></a0:DIV></a0:body></a0:html>';
		const doc = parseDocument(html, BASE_URL);
		const div = doc.getElementsByTagName('div')[0];
		expect(div).toBeTruthy();
		expect(div.tagName).toBe('DIV');
		expect(div.localName).toBe('div');
		expect(div.firstElementChild?.tagName).toBe('SVG');
		expect(div.firstElementChild?.localName).toBe('svg');
		expect(div.firstElementChild?.firstElementChild?.tagName).toBe('CLIPPATH');
		expect(div.firstElementChild?.firstElementChild?.localName).toBe('clippath');
	});
});
