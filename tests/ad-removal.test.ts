import { describe, expect, test } from 'vitest';
import { Defuddle } from '../src/node';
import { parseDocument } from './helpers';

describe('Ad removal', () => {
	test('removes Google ad slots and ad network iframes from extracted content', async () => {
		const html = `<!DOCTYPE html>
<html>
<head>
	<title>Article with ads</title>
	<meta name="description" content="A test article with ad slots.">
</head>
<body>
	<main>
		<article>
			<h1>Article with ads</h1>
			<p>This article contains a real opening paragraph with enough text for the extractor to identify it as the main content.</p>
			<ins class="adsbygoogle" data-ad-client="ca-pub-123" data-ad-slot="456"></ins>
			<div id="div-gpt-ad-123">
				<iframe src="https://securepubads.g.doubleclick.net/tag/js/gpt.js"></iframe>
			</div>
			<p>The second paragraph should remain after the advertising slots have been removed from the extracted result.</p>
			<iframe src="https://pagead2.googlesyndication.com/pagead/html/r20240501/r20190131/zrt_lookup.html"></iframe>
		</article>
	</main>
</body>
</html>`;

		const result = await Defuddle(
			parseDocument(html, 'https://example.com/article-with-ads'),
			'https://example.com/article-with-ads'
		);

		expect(result.content).toContain('The second paragraph should remain');
		expect(result.content).not.toContain('adsbygoogle');
		expect(result.content).not.toContain('div-gpt-ad');
		expect(result.content).not.toContain('doubleclick.net');
		expect(result.content).not.toContain('googlesyndication.com');
	});

	test('removes sponsored recommendation widgets without removing unrelated words', async () => {
		const html = `<!DOCTYPE html>
<html>
<head><title>Roadmap article</title></head>
<body>
	<article>
		<h1>Roadmap article</h1>
		<p class="roadmap">Roadmap should stay because this class is part of the article content rather than an ad marker.</p>
		<p id="shadow-adventure">Adventure should stay because the id only contains the letters ad inside a larger word.</p>
		<div class="taboola-widget">Sponsored links from around the web</div>
		<div class="outbrain-module">Promoted stories</div>
		<p>The article conclusion should remain in the extracted content after sponsored widgets are removed.</p>
	</article>
</body>
</html>`;

		const result = await Defuddle(
			parseDocument(html, 'https://example.com/roadmap-article'),
			'https://example.com/roadmap-article'
		);

		expect(result.content).toContain('Roadmap should stay');
		expect(result.content).toContain('Adventure should stay');
		expect(result.content).not.toContain('Sponsored links from around the web');
		expect(result.content).not.toContain('Promoted stories');
	});
});
