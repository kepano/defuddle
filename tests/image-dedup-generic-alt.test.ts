import { describe, test, expect } from 'vitest';
import { Defuddle } from '../src/node';
import { parseDocument } from './helpers';

const URL = 'https://example.com';

function countImages(md: string): number {
	return (md.match(/!\[/g) || []).length;
}

describe('image dedup: generic/identical alt across distinct images', () => {
	// Regression for kepano/defuddle#286 and the WeChat 公众号 "only first image"
	// symptom: many DISTINCT images sharing a generic identical alt (e.g. alt="Image")
	// were collapsed to one by the alt-based dedup heuristic.
	test('keeps all distinct images that share an identical generic alt (bare imgs)', async () => {
		const imgs = Array.from({ length: 6 }, (_, i) =>
			`<p><img src="https://cdn.example.com/photo-${i}.jpg" alt="Image"></p>`
		).join('\n');
		const html = `<html><head><title>T</title></head><body><article>
			<h1>Gallery</h1>
			<p>Intro paragraph with enough words for the content scorer to keep this article body.</p>
			${imgs}
			<p>Closing paragraph with sufficient text so the parser treats this as real content.</p>
		</article></body></html>`;

		const result = await Defuddle(parseDocument(html, URL), URL, { separateMarkdown: true });
		expect(countImages(result.contentMarkdown || '')).toBe(6);
	});

	test('keeps all distinct images that share an empty alt (bare imgs)', async () => {
		const imgs = Array.from({ length: 5 }, (_, i) =>
			`<p><img src="https://cdn.example.com/pic-${i}.png" alt=""></p>`
		).join('\n');
		const html = `<html><head><title>T</title></head><body><article>
			<h1>No-alt gallery</h1>
			<p>Intro paragraph with enough words for the content scorer to keep this article body.</p>
			${imgs}
			<p>Closing paragraph with sufficient text so the parser treats this as real content.</p>
		</article></body></html>`;

		const result = await Defuddle(parseDocument(html, URL), URL, { separateMarkdown: true });
		expect(countImages(result.contentMarkdown || '')).toBe(5);
	});

	test('WeChat-style mmbiz images (data-src + alt="Image") all survive', async () => {
		// Mimics post-scroll WeChat DOM: real src + data-src, all alt="Image",
		// each a distinct asset (different hash path, identical /640 size suffix).
		const imgs = Array.from({ length: 8 }, (_, i) =>
			`<p style="text-align:center;"><img class="rich_pages wxw-img" ` +
			`data-src="https://mmbiz.qpic.cn/mmbiz_png/hashAAA${i}BBB/640?wx_fmt=png" ` +
			`src="https://mmbiz.qpic.cn/mmbiz_png/hashAAA${i}BBB/640?wx_fmt=png" alt="Image"></p>`
		).join('\n');
		const html = `<html><head><title>WeChat article</title></head><body>
			<div id="js_content"><article>
			<p>正文开头，需要足够的中文内容让正文打分器把这段识别为主体内容而不是噪音。</p>
			${imgs}
			<p>正文结尾，同样需要足够的文字让解析器保留整篇文章主体。</p>
			</article></div></body></html>`;

		const result = await Defuddle(parseDocument(html, 'https://mp.weixin.qq.com/s/test'),
			'https://mp.weixin.qq.com/s/test', { separateMarkdown: true });
		expect(countImages(result.contentMarkdown || '')).toBe(8);
	});

	test('still keeps a legitimately repeated image (identical src, same alt)', async () => {
		const html = `<html><head><title>T</title></head><body><article>
			<h1>Repeat</h1>
			<p>Here is a formula <img src="https://example.com/f.png" alt="E=mc2"> inline with more words here.</p>
			<p>The same formula <img src="https://example.com/f.png" alt="E=mc2"> appears again with more words.</p>
		</article></body></html>`;

		const result = await Defuddle(parseDocument(html, URL), URL, { separateMarkdown: true });
		expect(countImages(result.contentMarkdown || '')).toBe(2);
	});
});
