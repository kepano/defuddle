import { isDangerousUrl } from './dom';

/**
 * Converts Steam/forum-style BBCode to HTML.
 * Core tags are standard across phpBB, vBulletin, MyBB, SMF, XenForo, and Steam.
 * Steam-specific tags (e.g. [previewyoutube]) are included.
 */
export function bbcodeToHtml(bbcode: string): string {
	let html = bbcode;

	// Headings
	html = html.replace(/\[h1\]([\s\S]*?)\[\/h1\]/gi, '<h1>$1</h1>');
	html = html.replace(/\[h2\]([\s\S]*?)\[\/h2\]/gi, '<h2>$1</h2>');
	html = html.replace(/\[h3\]([\s\S]*?)\[\/h3\]/gi, '<h3>$1</h3>');

	// Inline formatting
	html = html.replace(/\[b\]([\s\S]*?)\[\/b\]/gi, '<strong>$1</strong>');
	html = html.replace(/\[i\]([\s\S]*?)\[\/i\]/gi, '<em>$1</em>');
	html = html.replace(/\[u\]([\s\S]*?)\[\/u\]/gi, '<u>$1</u>');
	html = html.replace(/\[s\]([\s\S]*?)\[\/s\]/gi, '<s>$1</s>');

	// Links: [url=...] or [url="..."]
	html = html.replace(/\[url=["']?([^"'\]]+)["']?\]([\s\S]*?)\[\/url\]/gi, (_, href, text) => {
		if (isDangerousUrl(href)) return text;
		return `<a href="${href}">${text}</a>`;
	});

	// Images
	html = html.replace(/\[img\]([\s\S]*?)\[\/img\]/gi, '<img src="$1">');

	// Steam: YouTube preview [previewyoutube="videoId;full"][/previewyoutube]
	html = html.replace(/\[previewyoutube=["']?([^;'"]+)[^"'\]]*["']?\]\[\/previewyoutube\]/gi, '<img src="https://www.youtube.com/watch?v=$1">');

	// Lists
	html = html.replace(/\[list\]([\s\S]*?)\[\/list\]/gi, (_, inner) => {
		const items = inner.replace(/\[\*\]([\s\S]*?)(?=\[\*\]|\[\/list\]|$)/gi, '<li>$1</li>');
		return `<ul>${items}</ul>`;
	});
	html = html.replace(/\[olist\]([\s\S]*?)\[\/olist\]/gi, (_, inner) => {
		const items = inner.replace(/\[\*\]([\s\S]*?)(?=\[\*\]|\[\/olist\]|$)/gi, '<li>$1</li>');
		return `<ol>${items}</ol>`;
	});

	// Blockquote
	html = html.replace(/\[quote(?:=[^\]]+)?\]([\s\S]*?)\[\/quote\]/gi, '<blockquote>$1</blockquote>');

	// Code
	html = html.replace(/\[code\]([\s\S]*?)\[\/code\]/gi, '<pre><code>$1</code></pre>');

	// Spoiler
	html = html.replace(/\[spoiler\]([\s\S]*?)\[\/spoiler\]/gi, '<details><summary>Spoiler</summary>$1</details>');

	// Paragraphs: [p]...[/p]
	html = html.replace(/\[p\]([\s\S]*?)\[\/p\]/gi, (_, inner) => {
		const withBreaks = inner.replace(/\n/g, '<br>');
		return `<p>${withBreaks}</p>`;
	});

	// Any remaining newlines as line breaks (content outside [p] tags)
	html = html.replace(/\n/g, '<br>');

	// Strip any remaining unrecognized BBCode tags
	html = html.replace(/\[[^\]]+\]/g, '');

	return html;
}
