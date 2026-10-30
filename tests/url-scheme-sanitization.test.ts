import { describe, test, expect } from 'vitest';
import { Defuddle } from '../src/node';
import { parseLinkedomHTML } from '../src/utils/linkedom-compat';
import { isDangerousUrl } from '../src/utils/dom';

/**
 * URL scheme sanitization on the generic extraction path.
 *
 * `data:` and `blob:` encode a whole document into an attribute, which routes
 * around the script and event-handler stripping done elsewhere in the pipeline,
 * so neither is accepted in a URI attribute. `data:image/*` is the exception —
 * inline images are a normal part of page content — except as an iframe `src`,
 * where an SVG document can execute script.
 *
 * These run with `standardize: false` as well as the defaults, because every
 * pipeline step is optional and sanitization has to hold regardless.
 *
 * External `https:` iframes are deliberately not blocked: embeds are legitimate
 * content and the caller parsing the page opted into them.
 */

const FILLER = '<p>Lorem ipsum dolor sit amet consectetur adipiscing elit sed do eiusmod tempor incididunt ut labore et dolore magna aliqua ut enim ad minim veniam quis nostrud exercitation ullamco laboris.</p>';

function buildPage(body: string): string {
	return `<html><head><title>Test</title></head><body><article>${FILLER}${body}${FILLER}</article></body></html>`;
}

async function parse(body: string, options: Record<string, unknown> = {}) {
	const doc = parseLinkedomHTML(buildPage(body));
	const result = await Defuddle(doc, 'https://example.com/page', options);
	return result.content;
}

describe('isDangerousUrl', () => {
	test('blocks script-smuggling schemes', () => {
		expect(isDangerousUrl('javascript:alert(1)')).toBe(true);
		expect(isDangerousUrl('data:text/html,<script>alert(1)</script>')).toBe(true);
		expect(isDangerousUrl('blob:https://evil.example/uuid')).toBe(true);
	});

	test('allows inline images and ordinary URLs', () => {
		expect(isDangerousUrl('data:image/png;base64,iVBORw0KGgo=')).toBe(false);
		expect(isDangerousUrl('https://example.com/a')).toBe(false);
		expect(isDangerousUrl('mailto:a@example.com')).toBe(false);
	});

	test('allows relative URLs, which bbcode and comment builders pass', () => {
		expect(isDangerousUrl('/relative/path')).toBe(false);
		expect(isDangerousUrl('#anchor')).toBe(false);
		expect(isDangerousUrl('page.html')).toBe(false);
	});

	test('rejects every data: URI when inline images are not allowed', () => {
		// iframe src: an SVG document in a frame can execute script, unlike <img>.
		expect(isDangerousUrl('data:image/svg+xml,<svg/>', false)).toBe(true);
		expect(isDangerousUrl('data:image/png;base64,iVBORw0KGgo=', false)).toBe(true);
		expect(isDangerousUrl('https://example.com/a', false)).toBe(false);
	});

	test('ignores whitespace and control characters used to evade matching', () => {
		expect(isDangerousUrl('java\tscript:alert(1)')).toBe(true);
		expect(isDangerousUrl('  JavaScript:alert(1)')).toBe(true);
		expect(isDangerousUrl('data:\ntext/html,x')).toBe(true);
	});
});

describe('generic extraction path sanitization', () => {
	// Both default options and standardize:false — the allowlist that used to
	// provide incidental cover is off in the latter.
	for (const options of [{}, { standardize: false }]) {
		const label = JSON.stringify(options);

		test(`strips data: iframe src ${label}`, async () => {
			const content = await parse('<iframe src="data:text/html,<script>alert(1)</script>"></iframe>', options);
			expect(content).not.toContain('data:text/html');
			expect(content).not.toContain('alert(1)');
		});

		test(`strips data:image/svg+xml iframe src ${label}`, async () => {
			const content = await parse('<iframe src="data:image/svg+xml,<svg xmlns=\'http://www.w3.org/2000/svg\'><script>alert(2)</script></svg>"></iframe>', options);
			expect(content).not.toContain('data:image/svg+xml');
		});

		test(`strips blob: iframe src ${label}`, async () => {
			const content = await parse('<iframe src="blob:https://evil.example/uuid"></iframe>', options);
			expect(content).not.toContain('blob:');
		});

		test(`strips javascript: href ${label}`, async () => {
			const content = await parse('<a href="javascript:alert(3)">click</a>', options);
			expect(content).not.toContain('javascript:');
		});

		test(`strips event handler attributes ${label}`, async () => {
			const content = await parse('<p onclick="alert(4)">text</p>', options);
			expect(content).not.toContain('onclick');
		});

		test(`strips srcdoc ${label}`, async () => {
			const content = await parse('<iframe srcdoc="<script>alert(5)</script>"></iframe>', options);
			expect(content).not.toContain('srcdoc');
		});

		test(`preserves external iframe embeds ${label}`, async () => {
			const content = await parse('<iframe src="https://www.youtube.com/embed/abc"></iframe>', options);
			expect(content).toContain('https://www.youtube.com/embed/abc');
		});

		test(`preserves relative links ${label}`, async () => {
			const content = await parse('<a href="/relative/ok">link</a>', options);
			expect(content).toContain('/relative/ok');
		});
	}

	test('preserves an iframe sandbox attribute set by the page', async () => {
		// sandbox only ever restricts a frame, so keeping it cannot make an embed
		// more permissive than the source page intended.
		const content = await parse('<iframe src="https://example.com/embed" sandbox="allow-scripts"></iframe>');
		expect(content).toContain('sandbox="allow-scripts"');
	});

	test('strips event handlers on the content root element itself', async () => {
		// The root is serialized via outerHTML, so querySelectorAll('*') alone
		// would miss its attributes. standardize:false because the attribute
		// allowlist otherwise covers the root and would mask this.
		const doc = parseLinkedomHTML(
			`<html><head><title>Test</title></head><body><article onclick="alert('root')">${FILLER}${FILLER}</article></body></html>`
		);
		const result = await Defuddle(doc, 'https://example.com/page', { standardize: false });
		expect(result.content).not.toContain('onclick');
	});
});
