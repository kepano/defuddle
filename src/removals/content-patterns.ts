import { CONTENT_ELEMENT_SELECTOR } from '../constants';
import { DebugRemoval } from '../types';
import { textPreview, countWords } from '../utils';

const CONTENT_DATE_PATTERN = /(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\s+\d{1,2}/i;
const CONTENT_READ_TIME_PATTERN = /\d+\s*min(?:ute)?s?\s+read\b/i;
const BYLINE_UPPERCASE_PATTERN = /^\p{Lu}/u;
const BOILERPLATE_PATTERNS = [
	/^This (?:article|story|piece) (?:appeared|was published|originally appeared) in\b/i,
	/^A version of this (?:article|story) (?:appeared|was published) in\b/i,
	/^Originally (?:published|appeared) (?:in|on|at)\b/i,
];
// Shared date/number patterns for stripping metadata text.
const METADATA_STRIP_BASE = [
	/\b(?:Jan(?:uary)?|Feb(?:ruary)?|Mar(?:ch)?|Apr(?:il)?|May|Jun(?:e)?|Jul(?:y)?|Aug(?:ust)?|Sep(?:t(?:ember)?)?|Oct(?:ober)?|Nov(?:ember)?|Dec(?:ember)?)\b/gi,
	/\b\d+(?:st|nd|rd|th)?\b/g,
];
// Read-time: strip everything including whitespace (expect empty residual)
const READ_TIME_STRIP_PATTERNS = [
	...METADATA_STRIP_BASE,
	/\bmin(?:ute)?s?\b/gi,
	/\bread\b/gi,
	/[/|·•—–\-,.\s]+/g,
];
// Byline: preserve spaces so name words can be split
const BYLINE_STRIP_PATTERNS = [
	...METADATA_STRIP_BASE,
	/\bby\b/gi,
	/[/|·•—–\-,]+/g,
];

function removeTrailingSiblings(element: Element, removeSelf: boolean, debug: boolean, debugRemovals?: DebugRemoval[]) {
	let sibling = element.nextElementSibling;
	while (sibling) {
		const next = sibling.nextElementSibling;
		if (debug && debugRemovals) {
			debugRemovals.push({
				step: 'removeByContentPattern',
				reason: 'trailing non-content',
				text: textPreview(sibling)
			});
		}
		sibling.remove();
		sibling = next;
	}
	if (removeSelf) {
		if (debug && debugRemovals) {
			debugRemovals.push({
				step: 'removeByContentPattern',
				reason: 'boilerplate text',
				text: textPreview(element)
			});
		}
		element.remove();
	}
}

/**
 * Detect and remove "hero header" blocks near the top of content.
 * These are containers that wrap a heading (h1/h2), a <time> element,
 * and optionally author info and a hero image — common in blog layouts.
 * The block has very little prose; it's purely presentational metadata.
 *
 * Strategy: find <time> elements near the start, then walk up to find
 * the largest ancestor that's still mostly metadata (contains h1 + time,
 * has little prose). This handles arbitrary nesting depth.
 */
function removeHeroHeader(mainContent: Element, debug: boolean, debugRemovals?: DebugRemoval[]) {
	const timeElements = mainContent.querySelectorAll('time');
	if (timeElements.length === 0) return;

	const contentText = mainContent.textContent || '';

	for (const time of timeElements) {
		// Must be near the start of content
		const timeText = time.textContent?.trim() || '';
		const pos = contentText.indexOf(timeText);
		if (pos > 300) continue;

		// Walk up from the <time> element to find the largest ancestor
		// that contains both a heading and a <time>, but has little prose.
		let bestBlock: Element | null = null;
		let current: Element | null = time.parentElement;

		while (current && current !== mainContent) {
			// Must contain both a heading and a time element
			const hasHeadingAndTime = current.querySelector('h1, h2') && current.querySelector('time');
			if (hasHeadingAndTime) {
				const blockText = current.textContent?.trim() || '';
				const totalWords = countWords(blockText);

				// Count words in metadata elements (headings, time, tagged lists).
				// Use a Set to avoid double-counting nested elements.
				const metadataEls = new Set<Element>();
				for (const el of current.querySelectorAll('h1, h2, h3, time, [aria-label]')) {
					// Skip if this element is inside another metadata element
					let dominated = false;
					for (const existing of metadataEls) {
						if (existing.contains(el)) { dominated = true; break; }
					}
					if (!dominated) metadataEls.add(el);
				}
				let metadataWords = 0;
				for (const el of metadataEls) {
					metadataWords += countWords(el.textContent || '');
				}
				const proseWords = totalWords - metadataWords;

				if (proseWords < 30) {
					bestBlock = current;
				} else {
					// Too much prose — stop walking up
					break;
				}
			}

			current = current.parentElement;
		}

		if (bestBlock) {
			if (debug && debugRemovals) {
				debugRemovals.push({
					step: 'removeByContentPattern',
					reason: 'hero header block',
					text: textPreview(bestBlock)
				});
			}
			bestBlock.remove();
			return;
		}
	}
}

export function removeByContentPattern(mainContent: Element, debug: boolean, url: string, debugRemovals?: DebugRemoval[]) {
	// Remove hero header blocks — containers near the top of content that
	// wrap date, title heading, author, tags, and a hero image together.
	// After individual metadata elements are stripped, these leave behind
	// orphaned images and empty wrappers. Detect and remove the whole block.
	removeHeroHeader(mainContent, debug, debugRemovals);

	const contentText = mainContent.textContent || '';
	const candidates = Array.from(mainContent.querySelectorAll('p, span, div, time'));

	// Remove read time metadata (e.g. "Mar 4th 2026 | 3 min read")
	// Only removes leaf elements whose text is PURELY date + read time,
	// not mixed with other meaningful content like tag names.
	for (const el of candidates) {
		if (!el.parentNode) continue;
		if (el.closest('pre') || el.closest('code')) continue;

		const text = el.textContent?.trim() || '';
		const words = countWords(text);

		// Match date + read time in short elements
		if (words <= 15 && CONTENT_DATE_PATTERN.test(text) && CONTENT_READ_TIME_PATTERN.test(text)) {
			// Ensure this is a leaf-ish element, not a large container
			if (el.querySelectorAll('p, div, section, article').length === 0) {
				// Verify the text is ONLY date + read time metadata
				// by stripping all date/time words and checking nothing remains
				let cleaned = text;
				for (const pattern of READ_TIME_STRIP_PATTERNS) {
					cleaned = cleaned.replace(pattern, '');
				}
				if (cleaned.trim().length > 0) continue;

				if (debug && debugRemovals) {
					debugRemovals.push({
						step: 'removeByContentPattern',
						reason: 'read time metadata',
						text: textPreview(el)
					});
				}
				el.remove();
			}
		}
	}

	// Remove author + date bylines near the start of content.
	// Short elements whose text is ONLY a person name + date + separators,
	// in any order. Catches Tailwind/CSS-in-JS sites with non-semantic
	// class names that can't be matched by selector removal.
	for (const el of candidates) {
		if (!el.parentNode) continue;
		if (el.closest('pre') || el.closest('code')) continue;

		const text = el.textContent?.trim() || '';
		const words = countWords(text);
		if (words > 10 || words < 2) continue;

		// Must contain a date — without one, short capitalized text
		// could be a heading or label, not a byline.
		if (!CONTENT_DATE_PATTERN.test(text)) continue;

		// Strip date, year, separators, and "by" — if only
		// capitalized name-like words remain, this is a byline.
		let residual = text;
		for (const pattern of BYLINE_STRIP_PATTERNS) {
			residual = residual.replace(pattern, '');
		}
		residual = residual.trim();
		if (!residual) continue;
		const nameWords = residual.split(/\s+/).filter(w => w.length > 0);
		if (nameWords.length === 0 || nameWords.length > 4) continue;
		if (!nameWords.every(w => BYLINE_UPPERCASE_PATTERN.test(w))) continue;

		// Must be near the start of content
		const pos = contentText.indexOf(text);
		if (pos > 500) continue;

		// Walk up through wrappers whose only text content matches
		let target: Element = el;
		while (target.parentElement && target.parentElement !== mainContent) {
			const parentText = target.parentElement.textContent?.trim() || '';
			if (parentText !== text) break;
			target = target.parentElement;
		}

		if (debug && debugRemovals) {
			debugRemovals.push({
				step: 'removeByContentPattern',
				reason: 'author date metadata',
				text: textPreview(target)
			});
		}
		target.remove();
		break;
	}

	// Remove standalone time/date elements near the start or end of content.
	// A <time> in its own paragraph at the boundary is metadata (publish date),
	// but <time> inline within prose should be preserved (see issue #136).
	const timeElements = Array.from(mainContent.querySelectorAll('time'));
	for (const time of timeElements) {
		if (!time.parentNode) continue;
		// Walk up through inline/formatting wrappers only (i, em, span, b, strong)
		// Stop at block elements to avoid removing containers with other content.
		let target: Element = time;
		let targetText = target.textContent?.trim() || '';
		while (target.parentElement && target.parentElement !== mainContent) {
			const parentTag = target.parentElement.tagName.toLowerCase();
			const parentText = target.parentElement.textContent?.trim() || '';
			// If parent is a <p> that only wraps this time, include it
			if (parentTag === 'p' && parentText === targetText) {
				target = target.parentElement;
				break;
			}
			// Only walk through inline formatting wrappers
			if (['i', 'em', 'span', 'b', 'strong', 'small'].includes(parentTag) &&
				parentText === targetText) {
				target = target.parentElement;
				targetText = parentText;
				continue;
			}
			break;
		}
		const text = target.textContent?.trim() || '';
		const words = countWords(text);
		if (words > 10) continue;
		// Check if this element is near the start or end of mainContent
		const pos = contentText.indexOf(text);
		const distFromEnd = contentText.length - (pos + text.length);
		if (pos > 200 && distFromEnd > 200) continue;
		if (debug && debugRemovals) {
			debugRemovals.push({
				step: 'removeByContentPattern',
				reason: 'boundary date element',
				text: textPreview(target)
			});
		}
		target.remove();
	}

	// Remove blog post metadata lists near content boundaries.
	// These are short <ul>/<ol>/<dl> elements where every item is a brief
	// label + value pair (date, reading time, author, share, etc.) with no
	// prose sentences. Detected structurally: all items are very short,
	// none contain sentence-ending punctuation, and the total text is minimal.
	// <dl> elements are also checked: they often appear as author metadata
	// blocks in Next.js/Tailwind blog templates (avatar + name + social handle).
	const metadataLists = mainContent.querySelectorAll('ul, ol, dl');
	for (const list of metadataLists) {
		if (!list.parentNode) continue;
		const isDl = list.tagName === 'DL';
		const items = Array.from(list.children).filter(el =>
			isDl ? el.tagName === 'DD' : el.tagName === 'LI'
		);
		// For description lists, allow single-item (e.g. one author block);
		// for ul/ol require at least 2 items to avoid removing single-item content lists.
		const minItems = isDl ? 1 : 2;
		if (items.length < minItems || items.length > 8) continue;

		// Must be near the start or end of content
		const listText = list.textContent?.trim() || '';
		const listPos = contentText.indexOf(listText);
		const distFromEnd = contentText.length - (listPos + listText.length);
		if (listPos > 500 && distFromEnd > 500) continue;

		// Skip lists introduced by a preceding paragraph (e.g. "Features include:")
		// — those are content lists, not standalone metadata
		const prevSibling = list.previousElementSibling;
		if (prevSibling) {
			const prevText = prevSibling.textContent?.trim() || '';
			if (prevText.endsWith(':')) continue;
		}

		// Every item must be very short (label + value) with no prose
		let isMetadata = true;
		for (const item of items) {
			const text = item.textContent?.trim() || '';
			const words = countWords(text);
			if (words > 8) { isMetadata = false; break; }
			// Prose has sentence-ending punctuation; metadata doesn't
			if (/[.!?]$/.test(text)) { isMetadata = false; break; }
		}
		if (!isMetadata) continue;

		// Total text should be very short — this is metadata, not content
		if (countWords(listText) > 30) continue;

		// Walk up to find the container to remove (e.g. a wrapper div)
		let target: Element = list;
		while (target.parentElement && target.parentElement !== mainContent) {
			const parentText = target.parentElement.textContent?.trim() || '';
			if (parentText !== listText) break;
			target = target.parentElement;
		}

		if (debug && debugRemovals) {
			debugRemovals.push({
				step: 'removeByContentPattern',
				reason: 'blog metadata list',
				text: textPreview(target)
			});
		}
		target.remove();
	}

	// Remove section breadcrumbs and back-navigation links.
	// Matches short elements (div, span, p) containing a link to a parent path,
	// and bare <a> elements used as standalone back links (e.g. "← back", "↑ index").
	// Two parent-link patterns are recognized:
	//   1. Direct prefix: linkPath is a path prefix of the current URL
	//      e.g. current=/blog/2024/post, link=/blog/ or /blog
	//   2. Parent index file: link points to index.html/index.php in a parent directory
	//      e.g. current=/articles/hensels, link=../index.html → /index.html
	// Bare <a> elements are only matched when not embedded in flowing prose
	// (the parent element's text must equal the link's text).
	let urlPath = '';
	let pageHost = '';
	try {
		const parsedUrl = new URL(url);
		urlPath = parsedUrl.pathname;
		pageHost = parsedUrl.hostname.replace(/^www\./, '');
	} catch {}
	if (urlPath) {
		const shortElements = mainContent.querySelectorAll('div, span, p, a[href]');
		for (const el of shortElements) {
			if (!el.parentNode) continue;
			const text = el.textContent?.trim() || '';
			const words = countWords(text);
			if (words > 10) continue;
			// Must be a leaf-ish element (no block children)
			if (el.querySelectorAll('p, div, section, article').length > 0) continue;
			// For bare <a> elements, skip if embedded in flowing prose (parent has other text)
			if (el.matches('a[href]') && el.parentElement && el.parentElement !== mainContent) {
				if ((el.parentElement.textContent?.trim() || '') !== text) continue;
			}
			const link: Element | null = el.matches('a[href]') ? el : el.querySelector('a[href]');
			if (!link) continue;
			try {
				const linkPath = new URL(link.getAttribute('href') || '', url).pathname;
				// Also catch index.html links to a parent directory (e.g. ../index.html)
				const linkDir = linkPath.replace(/\/[^/]*$/, '/');
				const isParentIndex = /^index\.(html?|php)$/i.test(linkPath.split('/').pop() || '') && urlPath.startsWith(linkDir);
				if (linkPath !== '/' && linkPath !== urlPath && (urlPath.startsWith(linkPath) || isParentIndex)) {
					if (debug && debugRemovals) {
						debugRemovals.push({
							step: 'removeByContentPattern',
							reason: 'section breadcrumb',
							text: textPreview(el)
						});
					}
					el.remove();
				}
			} catch {}
		}
	}

	// Remove trailing external link lists — a heading + list of purely
	// off-site links as the last content block (affiliate picks, product
	// roundups, etc.). Only removed when nothing meaningful follows.
	if (pageHost) {
		const headings = mainContent.querySelectorAll('h2, h3, h4, h5, h6');
		for (const heading of headings) {
			if (!heading.parentNode) continue;
			const list = heading.nextElementSibling;
			if (!list || (list.tagName !== 'UL' && list.tagName !== 'OL')) continue;
			const items = Array.from(list.children).filter(el => el.tagName === 'LI');
			if (items.length < 2) continue;

			// The list must be the last meaningful block — nothing after it
			// except whitespace or empty elements. Walk up through ancestors
			// to check siblings at each level up to mainContent.
			let trailingContent = false;
			let checkEl: Element | null = list;
			while (checkEl && checkEl !== mainContent) {
				let sibling = checkEl.nextElementSibling;
				while (sibling) {
					if ((sibling.textContent?.trim() || '').length > 0) {
						trailingContent = true;
						break;
					}
					sibling = sibling.nextElementSibling;
				}
				if (trailingContent) break;
				checkEl = checkEl.parentElement;
			}
			if (trailingContent) continue;

			// Every list item must be primarily a link pointing off-site
			let allExternalLinks = true;
			for (const item of items) {
				const links = item.querySelectorAll('a[href]');
				if (links.length === 0) { allExternalLinks = false; break; }
				const itemText = item.textContent?.trim() || '';
				let linkTextLen = 0;
				for (const link of links) {
					linkTextLen += (link.textContent?.trim() || '').length;
					try {
						const linkHost = new URL(link.getAttribute('href') || '', url).hostname.replace(/^www\./, '');
						if (linkHost === pageHost) { allExternalLinks = false; break; }
					} catch {}
				}
				if (!allExternalLinks) break;
				if (linkTextLen < itemText.length * 0.6) { allExternalLinks = false; break; }
			}
			if (!allExternalLinks) continue;

			if (debug && debugRemovals) {
				debugRemovals.push({
					step: 'removeByContentPattern',
					reason: 'trailing external link list',
					text: textPreview(heading)
				});
				debugRemovals.push({
					step: 'removeByContentPattern',
					reason: 'trailing external link list',
					text: textPreview(list)
				});
			}
			list.remove();
			heading.remove();
		}
	}

	// Remove trailing thin sections — the last few direct children of
	// mainContent that contain a heading but very little prose. These are
	// typically CTAs, newsletter prompts, or promotional sections that
	// have been partially stripped by prior removal steps.
	const totalWords = countWords(mainContent.textContent || '');
	if (totalWords > 300) {
		// Walk backwards from the last direct child of mainContent,
		// collecting trailing elements that are thin (empty or very short prose).
		// Exclude SVG text (path data) from word counts — it's not prose.
		const trailingEls: Element[] = [];
		let trailingWords = 0;
		let child = mainContent.lastElementChild;
		while (child) {
			// Count prose words, excluding SVG path data which inflates word counts
			let svgWords = 0;
			for (const svg of child.querySelectorAll('svg')) {
				svgWords += countWords(svg.textContent || '');
			}
			const words = countWords(child.textContent?.trim() || '') - svgWords;
			if (words > 25) break;
			trailingWords += words;
			trailingEls.push(child);
			child = child.previousElementSibling;
		}
		// Must have a heading in the trailing elements and total < 15% of content.
		// Skip if trailing elements contain content indicators (math, code, tables, images).
		if (trailingEls.length >= 1 && trailingWords < totalWords * 0.15) {
			const hasHeading = trailingEls.some(el =>
				/^H[1-6]$/.test(el.tagName) || el.querySelector('h1, h2, h3, h4, h5, h6')
			);
			const hasContent = trailingEls.some(el =>
				el.querySelector(CONTENT_ELEMENT_SELECTOR)
			);
			if (hasHeading && !hasContent) {
				for (const el of trailingEls) {
					if (debug && debugRemovals) {
						debugRemovals.push({ step: 'removeByContentPattern', reason: 'trailing thin section', text: textPreview(el) });
					}
					el.remove();
				}
			}
		}
	}

	// Remove boilerplate sentences and trailing non-content.
	// Search elements for end-of-article boilerplate, then truncate
	// from the best ancestor that has siblings to remove.
	const fullText = mainContent.textContent || '';
	const boilerplateElements = mainContent.querySelectorAll('p, div, span, section');
	for (const el of boilerplateElements) {
		if (!el.parentNode) continue;
		const text = el.textContent?.trim() || '';
		const words = countWords(text);
		if (words > 50 || words < 3) continue;

		for (const pattern of BOILERPLATE_PATTERNS) {
			if (pattern.test(text)) {
				// Walk up to find an ancestor that has next siblings to truncate.
				// Don't walk all the way to mainContent's direct child — if there's
				// a single wrapper div, that would remove everything.
				let target: Element = el;
				while (target.parentElement && target.parentElement !== mainContent) {
					if (target.nextElementSibling) break;
					target = target.parentElement;
				}

				// Only truncate if there's substantial content before the boilerplate
				const targetText = target.textContent || '';
				const targetPos = fullText.indexOf(targetText);
				if (targetPos < 200) continue;

				// Collect ancestors before modifying the DOM
				const ancestors: Element[] = [];
				let anc = target.parentElement;
				while (anc && anc !== mainContent) {
					ancestors.push(anc);
					anc = anc.parentElement;
				}

				// Remove target element and its following siblings
				removeTrailingSiblings(target, true, debug, debugRemovals);

				// Cascade upward: remove following siblings at each
				// ancestor level too. Everything after the boilerplate
				// in document order is non-content.
				for (const ancestor of ancestors) {
					removeTrailingSiblings(ancestor, false, debug, debugRemovals);
				}
				return;
			}
		}
	}

}
