import { describe, test, expect } from 'vitest';
import Defuddle from '../src/index';
import { parseDocument } from './helpers';

/**
 * parse() must never mutate the caller's live document. The clipper hands
 * Defuddle the live page DOM (it needs a real window to read computed styles),
 * so stripping <style>/<script> from it in place would destroy the page's
 * layout — e.g. opening the clipper on google.com used to wipe its inline
 * <style> blocks and collapse the page.
 */
describe('parse() does not mutate the live document', () => {
	function buildDoc() {
		const html = `
		<!DOCTYPE html>
		<html>
		<head><title>Live Page</title></head>
		<body>
			<style id="page-style">.headline { color: red }</style>
			<article>
				<h1 class="headline">Real article headline</h1>
				<p>This is a normal article with enough words for the content scorer to
				extract it as the main content without falling back to anything. It keeps
				going with several sentences so the word count is comfortably high.</p>
				<p>A second paragraph adds more text so extraction succeeds on the first try.</p>
				<script>console.log('inline script')</script>
			</article>
		</body>
		</html>`;
		return parseDocument(html);
	}

	test('keeps <style> elements in the live document after parse', () => {
		const doc = buildDoc();
		expect(doc.querySelectorAll('style').length).toBe(1);

		const result = new Defuddle(doc).parse();

		// Extraction still worked...
		expect(result.content).toContain('second paragraph');
		// ...but the live document was left intact.
		expect(doc.querySelectorAll('style').length).toBe(1);
		expect(doc.getElementById('page-style')).not.toBeNull();
		expect(doc.querySelectorAll('script').length).toBe(1);
	});

	test('keeps the live document intact when the schema.org fallback triggers', () => {
		// A short visible article alongside a longer element that matches the
		// schema.org text forces the schema fallback / re-extraction path, which
		// also used to strip the live document.
		const longText = 'This is the full post body with far more words than the short article summary the scorer extracts. Adding several more sentences here so the schema text word count reliably exceeds the extracted content and triggers the fallback path that re-extracts from the matched element.';
		const html = `
		<!DOCTYPE html>
		<html>
		<head>
			<title>Feed</title>
			<script type="application/ld+json">
			{ "@type": "SocialMediaPosting", "text": "${longText}" }
			</script>
		</head>
		<body>
			<style id="page-style">.x { color: blue }</style>
			<article><h1>Title</h1><p>Short summary.</p></article>
			<div class="full-post"><p>${longText}</p></div>
		</body>
		</html>`;
		const doc = parseDocument(html);

		const result = new Defuddle(doc).parse();

		expect(result.content).toContain('full post body');
		expect(doc.querySelectorAll('style').length).toBe(1);
		expect(doc.getElementById('page-style')).not.toBeNull();
	});
});
