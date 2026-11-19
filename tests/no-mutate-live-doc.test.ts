import { describe, test, expect } from 'vitest';
import { readFileSync } from 'fs';
import { join } from 'path';
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

	test('keeps images in the live document with removeImages', () => {
		const doc = parseDocument(`<html><head><title>Photo post</title></head><body><article>
			<h1>Photo post</h1>
			<p>This article has enough words for the content scorer to extract it as the main content.
			It keeps going with several sentences so the word count is comfortably high.</p>
			<img src="https://example.com/photo.jpg" alt="Photo">
			<p>A second paragraph adds more text so extraction succeeds on the first try.</p>
		</article></body></html>`, 'https://example.com/post');

		const result = new Defuddle(doc, { url: 'https://example.com/post', removeImages: true }).parse();

		expect(result.content).toContain('second paragraph');
		expect(result.content).not.toContain('<img');
		expect(doc.querySelectorAll('img').length).toBe(1);
	});

	test('removes images from site extractor output without touching the live document', () => {
		const url = 'https://mastodon.social/@user/12345678';
		const html = readFileSync(join(__dirname, 'fixtures', 'comments--mastodon.social-@user-12345678.html'), 'utf8');
		const doc = parseDocument(html, url);
		const liveImages = doc.querySelectorAll('img').length;

		const withImages = new Defuddle(parseDocument(html, url), { url }).parse();
		const result = new Defuddle(doc, { url, removeImages: true }).parse();

		expect(withImages.content).toContain('<img');
		expect(result.extractorType).toBe('mastodon');
		expect(result.content).not.toContain('<img');
		expect(doc.querySelectorAll('img').length).toBe(liveImages);
	});

	const prose = '<p>The harbor wakes before the town does, and the fishing boats leave in a slow line past the breakwater. Gulls follow them out and drift back an hour later when the nets come up.</p>';

	test('promotes <noscript> images without touching the live document', () => {
		const doc = parseDocument(`<html><head><title>Harbor</title></head><body><article>
			<h1>Harbor at dawn</h1>${prose}
			<figure><img alt="Harbor" src="data:image/gif;base64,R0lGODlhAQABAAAAACw="><noscript><img alt="Harbor" src="https://example.com/harbor.jpg"></noscript></figure>
			${prose}
			<figure><noscript><img alt="Pier" src="https://example.com/pier.jpg"></noscript></figure>
			${prose}
		</article></body></html>`, 'https://example.com/harbor');
		const before = doc.documentElement.outerHTML;

		const result = new Defuddle(doc, { url: 'https://example.com/harbor' }).parse();

		expect(result.content).toContain('https://example.com/harbor.jpg');
		expect(result.content).toContain('https://example.com/pier.jpg');
		expect(doc.documentElement.outerHTML).toBe(before);
	});

	test('normalizes srcSet without touching the live document', () => {
		const doc = parseDocument(`<html><head><title>Harbor</title></head><body><article>
			<h1>Harbor at dawn</h1>${prose}
			<img srcSet="https://example.com/harbor-2x.jpg 2x" src="https://example.com/harbor.jpg" alt="Harbor" width="800" height="600">
			${prose}
		</article></body></html>`, 'https://example.com/harbor');
		const before = doc.documentElement.outerHTML;

		const result = new Defuddle(doc, { url: 'https://example.com/harbor' }).parse();

		expect(result.content).toContain('srcset="https://example.com/harbor-2x.jpg 2x"');
		expect(doc.documentElement.outerHTML).toBe(before);
	});

	test('cleans a Medium article without touching the live document', () => {
		const url = 'https://medium.com/@sam/harbor-at-dawn-123';
		const doc = parseDocument(`<html><head><title>Harbor at dawn</title><meta property="og:site_name" content="Medium"></head><body>
			<article class="meteredContent">
				<h1 data-testid="storyTitle">Harbor at dawn</h1>
				<div><span>Member-only story</span></div>
				<a data-testid="authorName" href="/@sam">Sam Rivera</a>
				<span data-testid="storyReadTime">4 min read</span>
				<div><button data-testid="headerClapButton">Clap</button></div>
				<div><p>Listen</p></div>
				${prose}
				<figure><div role="button"><img src="https://miro.medium.com/harbor.jpg" alt="Harbor" width="800" height="600"></div></figure>
				${prose}
				<div data-testid="post-preview"><a href="/@sam/another-post">Another post</a></div>
			</article>
		</body></html>`, url);
		const before = doc.documentElement.outerHTML;

		const result = new Defuddle(doc, { url }).parse();

		expect(result.extractorType).toBe('medium');
		expect(result.author).toBe('Sam Rivera');
		expect(result.content).toContain('https://miro.medium.com/harbor.jpg');
		expect(result.content).not.toContain('Member-only story');
		expect(result.content).not.toContain('Listen');
		expect(doc.documentElement.outerHTML).toBe(before);
	});

	test('renders NYT preloaded data without touching the live document', () => {
		const url = 'https://www.nytimes.com/2026/11/19/travel/harbor.html';
		const article = {
			headline: { default: 'Harbor at dawn' },
			sprinkledBody: { content: [{ __typename: 'ParagraphBlock', content: [{ __typename: 'TextInline', text: 'The fishing boats leave in a slow line past the breakwater before the town wakes up.' }] }] },
		};
		const doc = parseDocument(`<html><head><title>Harbor at dawn</title></head><body>
			<div id="app">Loading</div>
			<script>window.__preloadedData = ${JSON.stringify({ initialData: { data: { article } } })};</script>
		</body></html>`, url);
		const before = doc.documentElement.outerHTML;

		const result = new Defuddle(doc, { url }).parse();

		expect(result.extractorType).toBe('nytimes');
		expect(result.content).toContain('slow line past the breakwater');
		expect(doc.documentElement.outerHTML).toBe(before);
	});

	test('renders Substack preloads without touching the live document', () => {
		const url = 'https://example.substack.com/p/harbor';
		const preload = { post: { title: 'Harbor at dawn', body_html: '<p>The fishing boats leave in a slow line past the breakwater.</p>' } };
		const doc = parseDocument(`<html><head><title>Harbor at dawn</title></head><body>
			<script id="preloads-json" type="application/json">${JSON.stringify(preload)}</script>
		</body></html>`, url);
		const before = doc.documentElement.outerHTML;

		const result = new Defuddle(doc, { url }).parse();

		expect(result.extractorType).toBe('substack');
		expect(result.content).toContain('slow line past the breakwater');
		expect(doc.documentElement.outerHTML).toBe(before);
	});
});
