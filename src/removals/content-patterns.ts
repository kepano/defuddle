import { CONTENT_ELEMENT_SELECTOR } from '../constants';
import { DebugRemoval } from '../types';
import { textPreview, countWords, normalizeText } from '../utils';
import { findContentStart, isAboveContentStart } from '../content-boundary';

const CONTENT_DATE_PATTERN = /(?:(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\s+\d{1,2}|\d{1,2}(?:st|nd|rd|th)?\s+(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*|\d{4}[-/]\d{1,2}[-/]\d{1,2})/i;
const RELATIVE_TIME_PATTERN = /\b\d+\s+(?:second|minute|hour|day|week|month|year)s?\s+ago\b/i;
const CONTENT_READ_TIME_PATTERN = /\d+\s*min(?:ute)?s?\s+read\b|(?:read(?:ing)?\s+time)\s*:?\s*\d+\s*min(?:ute)?s?\b/i;
const BYLINE_UPPERCASE_PATTERN = /^\p{Lu}/u;
const STARTS_WITH_BY_PATTERN = /^(?:posted\s+)?by\s+\S/i;
const BOILERPLATE_PATTERNS = [
	/^This (?:article|story|piece) (?:appeared|was published|originally appeared) in\b/i,
	/^A version of this (?:article|story) (?:appeared|was published) in\b/i,
	/^Originally (?:published|appeared) (?:in|on|at)\b/i,
	/^Any re-?use permitted\b/i,
	/^©\s*(?:Copyright\s+)?\d{4}/i,
	/^Comments?$/i,
	/^Leave a (?:comment|reply)$/i,
	/^Loading\.{3}$/,
	/^Affiliate links\b.*\b(?:earn|commission)/i,
	/\bRead our Comment Policy\b/i,
	/^Thank you for (?:being part of|joining) our community\b/i,
];
const NEWSLETTER_PATTERN = /\bsubscribe\b[\s\S]{0,40}\bnewsletter\b|\bnewsletter\b[\s\S]{0,40}\bsubscribe\b|\bsign[- ]up\b[\s\S]{0,80}\b(?:newsletter|email alert)|\b(?:don[\u2019']?t (?:want to )?miss|never miss)\b[\s\S]{0,80}\b(?:latest|best|exclusive|reports?|updates?|source)/i;
const SOCIAL_COUNTER_PATTERN = /^\d+\s+(?:Likes?|Comments?|Shares?|Retweets?|Reposts?|Restacks?)$/i;
const TIMEZONE_WIDGET_PATTERN = /^current time in$/i;
const PINNED_LABEL_PATTERN = /^pinned$/i;
const AUTHOR_CONTACT_LABEL_PATTERN = /^(?:written by|(?:author|contact|reporter|correspondent)s?)$/i;
const SHARE_AUTHOR_LABEL = /^(?:share|follow|authors?|written\s+by)$/i;
// CONTENT_ELEMENT_SELECTOR minus img/picture — author avatars are common in metadata widgets
const CONTENT_ELEMENT_NO_IMG_SELECTOR = CONTENT_ELEMENT_SELECTOR.replace(/img, picture, /, '');
const EMAIL_PATTERN = /[\w.-]+@[\w.-]+\.\w+/;
const PHONE_PATTERN = /\(?\d{3}\)?[\s.‑–-]?\d{3}[\s.‑–-]?\d{4}/;
const HEADING_TAG_PATTERN = /^H[1-6]$/;
const HEADING_SELECTOR = 'h1, h2, h3, h4, h5, h6';

function isOrContainsHeading(el: Element): boolean {
	return HEADING_TAG_PATTERN.test(el.tagName) || !!el.querySelector(HEADING_SELECTOR);
}

function isNewsletterElement(el: Element, maxWords: number): boolean {
	const text = el.textContent?.trim() || '';
	const words = countWords(text);
	if (words < 2 || words > maxWords) return false;
	if (el.querySelector(CONTENT_ELEMENT_SELECTOR)) return false;
	const normalizedText = text.replace(/([a-z])([A-Z])/g, '$1 $2').replace(/[\u2018\u2019]/g, "'");
	return NEWSLETTER_PATTERN.test(normalizedText);
}
const RELATED_HEADING_PATTERN = /^(?:related (?:posts?|articles?|content|stories|reads?|reading)|you (?:might|may|could) (?:also )?(?:like|enjoy|be interested in)|read (?:next|more|also)|further reading|see also|more (?:from .*|from|articles?|posts?|like this)|more to (?:read|explore)|explore more|about (?:the )?author|latest (?:news|events?|posts?|articles?|stories)(?:\s*[&+]\s*(?:news|events?|posts?|articles?|stories))?)$/i;
// CTA headings that are never real content — safe to remove even as direct children
const CTA_HEADING_PATTERN = /^(?:subscribe|sign up|follow us|share this|stay (?:updated|connected)|join (?:us|our)|search (?:the |our )?(?:site|blog|archives?|newsroom|website|catalog|store|shop|database))$/i;
const RELATED_INTRO_PATTERN = /^for more (?:on|about)\b/i;

// Shared date/number patterns for stripping metadata text.
const METADATA_STRIP_BASE = [
	/\b(?:Jan(?:uary)?|Feb(?:ruary)?|Mar(?:ch)?|Apr(?:il)?|May|Jun(?:e)?|Jul(?:y)?|Aug(?:ust)?|Sep(?:t(?:ember)?)?|Oct(?:ober)?|Nov(?:ember)?|Dec(?:ember)?)\b/gi,
	/\b\d+(?:st|nd|rd|th)?\b/g,
	/\d{4}[-/]\d{1,2}[-/]\d{1,2}/g,
];
// Read-time: strip everything including whitespace (expect empty residual)
const READ_TIME_STRIP_PATTERNS = [
	...METADATA_STRIP_BASE,
	/\bmin(?:ute)?s?\b/gi,
	/\bread(?:ing)?\b/gi,
	/\btime\b/gi,
	/\bestimated\b/gi,
	/[/|·•—–\-,:.\s]+/g,
];
// Byline: preserve spaces so name words can be split
const BYLINE_STRIP_PATTERNS = [
	...METADATA_STRIP_BASE,
	/\bby\b/gi,
	/[/|·•—–\-,]+/g,
];

function walkUpToWrapper(el: Element, text: string, mainContent: Element): Element {
	let target = el;
	while (target.parentElement && target.parentElement !== mainContent) {
		if ((target.parentElement.textContent?.trim() || '') !== text) break;
		target = target.parentElement;
	}
	return target;
}

function removeTrailingSiblings(element: Element, removeSelf: boolean, debug: boolean, debugRemovals?: DebugRemoval[]) {
	let sibling = element.nextElementSibling;
	while (sibling) {
		const next = sibling.nextElementSibling;
		if (sibling.id === 'footnotes') {
			sibling = next;
			continue;
		}
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

// Remove `target` and all following siblings, then cascade upward removing
// trailing siblings at each ancestor level up to `mainContent`.
function removeTrailingWithCascade(target: Element, mainContent: Element, debug: boolean, debugRemovals?: DebugRemoval[]) {
	const ancestors: Element[] = [];
	let anc = target.parentElement;
	while (anc && anc !== mainContent) {
		ancestors.push(anc);
		anc = anc.parentElement;
	}
	removeTrailingSiblings(target, true, debug, debugRemovals);
	for (const ancestor of ancestors) {
		removeTrailingSiblings(ancestor, false, debug, debugRemovals);
	}
}

// Walk up from `el` toward `mainContent` as long as each level has no preceding
// siblings with meaningful content (≤ 10 words total). Returns the highest such ancestor.
// Used to find the outermost container that is exclusively a trailing/isolated section.
function walkUpIsolated(el: Element, mainContent: Element): Element {
	let target = el;
	while (target.parentElement && target.parentElement !== mainContent) {
		let precedingWords = 0;
		let sib = target.previousElementSibling;
		while (sib) {
			precedingWords += countWords(sib.textContent || '');
			if (precedingWords > 10) break;
			sib = sib.previousElementSibling;
		}
		if (precedingWords > 10) break;
		target = target.parentElement;
	}
	return target;
}

// If the element immediately preceding `target` is a thin section (< 50 words, no content
// elements), remove it. These are typically CTA or promo blocks before related-posts sections.
function removeThinPrecedingSection(target: Element, debug: boolean, debugRemovals?: DebugRemoval[]) {
	const prevSib = target.previousElementSibling;
	if (!prevSib) return;
	if (countWords(prevSib.textContent || '') >= 50) return;
	if (prevSib.querySelector(CONTENT_ELEMENT_SELECTOR)) return;

	// If prevSib is preceded by a heading (or a wrapper containing one), it's
	// the body of a named section, not a CTA block — leave it alone.
	const beforePrev = prevSib.previousElementSibling;
	if (beforePrev && isOrContainsHeading(beforePrev)) {
		return;
	}

	if (debug && debugRemovals) {
		debugRemovals.push({ step: 'removeByContentPattern', reason: 'thin CTA section', text: textPreview(prevSib) });
	}
	prevSib.remove();
}

/**
 * Remove "hero header" blocks — wrappers that group a heading, a <time>, and
 * typically a hero image/byline at the top of a blog post. Individual metadata
 * elements are stripped elsewhere; this exists to delete the empty wrapper and
 * its orphaned hero image so they don't surface as bare children of mainContent.
 *
 * A <time> above the content boundary is the entry point; we walk up toward
 * the largest ancestor that still has little prose (contains h1 + time but
 * < 30 non-metadata words).
 */
function removeHeroHeader(mainContent: Element, contentStart: Element | null, debug: boolean, debugRemovals?: DebugRemoval[]) {
	const timeElements = mainContent.querySelectorAll('time');
	if (timeElements.length === 0) return;

	for (const time of timeElements) {
		// Must sit above the content body — i.e. pre-content metadata.
		if (!isAboveContentStart(time, contentStart)) continue;

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

// Some CMSs inject a breadcrumb (Home › Posts › Title) as the first element
// of the article body with no semantic class — identified by internal-only links where at
// least one targets the site root or a shallow path (/archive, /posts, /blog).
function isBreadcrumbList(list: Element): boolean {
	const listItems = list.querySelectorAll('li');
	if (listItems.length < 2 || listItems.length > 8) return false;

	const listLinks = Array.from(list.querySelectorAll('a'));
	if (listLinks.length < 1 || listLinks.length >= listItems.length) return false;
	if (list.querySelector('img, p, figure, blockquote')) return false;

	// Breadcrumb items are short labels (e.g. "Home", "Blog", "Post Title").
	// Content lists have longer prose items — reject if any item exceeds 8 words.
	for (const item of listItems) {
		if (countWords(item.textContent || '') > 8) return false;
	}

	let allInternal = true;
	let hasBreadcrumbLink = false;
	let shortLinkTexts = true;
	for (const a of listLinks) {
		const href = a.getAttribute('href') || '';
		if (href.startsWith('http') || href.startsWith('//')) { allInternal = false; break; }
		if (href === '/' || /^\/[a-zA-Z0-9_-]+\/?$/.test(href)) hasBreadcrumbLink = true;
		if (((a.textContent || '').trim().split(/\s+/).filter(Boolean).length) > 5) shortLinkTexts = false;
	}
	return allInternal && hasBreadcrumbLink && shortLinkTexts;
}

// Remove "eyebrow" elements — short category/taxonomy labels immediately preceding
// the first <h1> (e.g. "Blog post", "Off-nominal", "Announcements"). These are
// presentational and don't belong in extracted content. Runs before selector removal
// so the h1 anchor is still present on pages that strip title classes (e.g. Substack).
export function removeEyebrowLabel(mainContent: Element, debug: boolean, debugRemovals?: DebugRemoval[]) {
	const firstHeading = mainContent.querySelector('h1') || mainContent.querySelector('h2');
	if (!firstHeading) return;

	// Walk up through wrappers where the heading (or its ancestor) is the
	// first child, so we can match eyebrows that appear as siblings of an
	// h1 ancestor rather than of the h1 directly.
	let current: Element = firstHeading;
	while (current.parentElement && current.parentElement !== mainContent &&
		!current.previousElementSibling) {
		current = current.parentElement;
	}
	const prev = current.previousElementSibling;
	if (!prev) return;

	const text = prev.textContent?.trim() || '';
	const words = countWords(text);
	if (words < 1 || words > 6) return;
	if (text.length > 40) return;
	if (/[.!?]/.test(text)) return;
	if (CONTENT_DATE_PATTERN.test(text)) return;
	if (prev.querySelector(
		'img, picture, video, iframe, figure, table, pre, code, time, [datetime], ' +
		'h1, h2, h3, h4, h5, h6, ul, ol, blockquote'
	)) return;

	if (debug && debugRemovals) {
		debugRemovals.push({ step: 'removeEyebrowLabel', reason: 'eyebrow label', text: textPreview(prev) });
	}
	prev.remove();
}

export function removeByContentPattern(mainContent: Element, debug: boolean, url: string, title: string, description: string, debugRemovals?: DebugRemoval[]) {
	// Structural anchor for "where the prose body starts." Heuristics targeting
	// pre-content use this as the authoritative above/below check — replacing
	// ad-hoc `contentText.indexOf(text) < N` byte-offset thresholds.
	const contentStart = findContentStart(mainContent, title);
	const isPreContent = (el: Element): boolean => isAboveContentStart(el, contentStart);
	const normalizedTitle = normalizeText(title);
	const normalizedDesc = normalizeText(description);
	const firstList = mainContent.querySelector('ul, ol');
	if (firstList && isBreadcrumbList(firstList)) {
		let target: Element = firstList;
		while (target.parentElement && target.parentElement !== mainContent &&
			   target.parentElement.children.length === 1) {
			target = target.parentElement;
		}
		if (debug && debugRemovals) {
			debugRemovals.push({ step: 'removeByContentPattern', reason: 'breadcrumb navigation list', text: textPreview(target) });
		}
		target.remove();
	}

	// Remove promotional block <a> elements appearing before the first heading.
	// These are announcement banners (e.g. "You're Invited: ...") injected above the article.
	// Identified by: appears before the first <h1>, has block children (a <div>), short text.
	const firstH1 = mainContent.querySelector('h1');
	if (firstH1) {
		for (const link of mainContent.querySelectorAll('a[href]')) {
			if (!link.parentNode) continue;
			if (!(link.compareDocumentPosition(firstH1) & 4)) continue;
			if (!link.querySelector('div')) continue;
			if (link.querySelector('img, picture, video')) continue;
			const text = link.textContent?.trim() || '';
			if (countWords(text) > 25) continue;
			if (/[.!?]\s/.test(text)) continue;
			if (debug && debugRemovals) {
				debugRemovals.push({ step: 'removeByContentPattern', reason: 'promotional banner link', text: textPreview(link) });
			}
			link.remove();
		}
	}


	// Remove hero header blocks — containers near the top of content that
	// wrap date, title heading, author, tags, and a hero image together.
	// After individual metadata elements are stripped, these leave behind
	// orphaned images and empty wrappers. Detect and remove the whole block.
	removeHeroHeader(mainContent, contentStart, debug, debugRemovals);

	// Remove "Listen to this article" audio player widgets.
	// TTS services inject audio/video players with "Listen to this article/story" text.
	// Also remove pre-content audio/video in short containers (player UI without prose).
	for (const media of mainContent.querySelectorAll('audio, video')) {
		if (!media.parentNode) continue;
		if (!media.getAttribute('src') && !media.querySelector('source')) continue;

		let container = media as Element;
		while (container.parentElement && container.parentElement !== mainContent) {
			if (countWords(container.parentElement.textContent?.trim() || '') > 25) break;
			container = container.parentElement;
		}

		const containerText = container.textContent?.trim() || '';
		const isListenWidget = /\blisten\s+to\s+(?:this\s+)?(?:article|story|post|episode|podcast)\b/i.test(containerText);
		// Pre-content audio/video in a short container is almost always a TTS
		// widget — real podcast/media embeds appear within the article body.
		const isPreContentPlayer = !isListenWidget && isPreContent(container) &&
			countWords(containerText) <= 25;

		if (isListenWidget || isPreContentPlayer) {
			if (debug && debugRemovals) {
				debugRemovals.push({ step: 'removeByContentPattern', reason: 'audio player widget', text: textPreview(container) });
			}
			container.remove();
		}
	}

	const contentText = mainContent.textContent || '';

	let parsedPageUrl: URL | null = null;
	try { parsedPageUrl = new URL(url); } catch {}

	// Remove table of contents — lists of same-page anchor links near the top of content.
	// These are navigation aids that duplicate heading text and add noise to extracted content.
	for (const list of mainContent.querySelectorAll('ul, ol')) {
		if (!list.parentNode) continue;
		if (list.closest('#footnotes')) continue;

		// Must be near the top of content — check before enumerating links
		const listText = list.textContent?.trim() || '';
		const listPos = contentText.indexOf(listText.substring(0, 60));
		if (listPos < 0 || listPos > contentText.length * 0.3) continue;

		const links = Array.from(list.querySelectorAll('a[href]'));
		if (links.length < 3) continue;

		if (list.querySelector(CONTENT_ELEMENT_SELECTOR)) continue;

		// Count same-page anchor links (fragment-only or same-page URL with fragment)
		let anchorCount = 0;
		for (const link of links) {
			const href = link.getAttribute('href') || '';
			if (href.startsWith('#')) {
				anchorCount++;
			} else if (parsedPageUrl && href.includes('#')) {
				try {
					const resolved = new URL(href, url);
					if (resolved.pathname === parsedPageUrl.pathname &&
						resolved.hostname === parsedPageUrl.hostname) {
						anchorCount++;
					}
				} catch {}
			}
		}

		if (anchorCount < 3 || anchorCount / links.length < 0.8) continue;

		let target: Element = list;
		while (target.parentElement && target.parentElement !== mainContent &&
			target.parentElement.children.length === 1) {
			target = target.parentElement;
		}

		// Remove an adjacent preceding heading if it's a ToC label
		const prevEl = target.previousElementSibling;
		if (prevEl && HEADING_TAG_PATTERN.test(prevEl.tagName)) {
			const hText = prevEl.textContent?.trim() || '';
			if (/^(?:table of )?contents$|^on this page$|^in this (?:article|guide|post)$/i.test(hText)) {
				if (debug && debugRemovals) {
					debugRemovals.push({ step: 'removeByContentPattern', reason: 'table of contents heading', text: textPreview(prevEl) });
				}
				prevEl.remove();
			}
		}

		// Remove surrounding HR separators that framed the ToC
		const prevSib = target.previousElementSibling;
		const nextSib = target.nextElementSibling;

		if (debug && debugRemovals) {
			debugRemovals.push({ step: 'removeByContentPattern', reason: 'table of contents', text: textPreview(target) });
		}
		target.remove();

		if (prevSib?.tagName === 'HR') prevSib.remove();
		if (nextSib?.tagName === 'HR') nextSib.remove();
		break;
	}

	const candidates = Array.from(mainContent.querySelectorAll('p, span, div, time'));

	// Single pass over candidates for all metadata-removal checks.
	// Shared work (text extraction, word count, closest check, indexOf) is computed
	// once per element instead of once per loop per element.
	let bylineFound = false;
	let authorDateFound = false;

	for (const el of candidates) {
		if (!el.parentNode) continue;

		const text = el.textContent?.trim() || '';
		const words = countWords(text);

		// All checks target short metadata elements; skip anything clearly too long.
		if (words > 15 || words === 0) continue;

		if (el.closest('pre, code')) continue;

		const tag = el.tagName;
		const hasDate = CONTENT_DATE_PATTERN.test(text);
		// Defer indexOf — only compute when a check needs it
		let pos = -2; // sentinel: not yet computed
		const getPos = () => { if (pos === -2) pos = contentText.indexOf(text); return pos; };

		// Remove "Current time in" timezone widgets (e.g. NYT live blogs).
		// The label is a child of a container that also holds timezone entries.
		if (TIMEZONE_WIDGET_PATTERN.test(text) && getPos() <= 300) {
			let target: Element = el;
			if (target.parentElement && target.parentElement !== mainContent) {
				target = target.parentElement;
			}
			if (debug && debugRemovals) {
				debugRemovals.push({ step: 'removeByContentPattern', reason: 'timezone widget', text: textPreview(target) });
			}
			target.remove();
			continue;
		}

		// Remove standalone "Pinned" labels (e.g. live blog pinned post markers).
		if (words === 1 && PINNED_LABEL_PATTERN.test(text)) {
			if (debug && debugRemovals) {
				debugRemovals.push({ step: 'removeByContentPattern', reason: 'pinned label', text: textPreview(el) });
			}
			el.remove();
			continue;
		}

		// Remove pre-content elements duplicating the page title or description.
		// Targets non-heading title elements (div, span) on sites with non-semantic
		// markup — the title/description are already extracted as metadata fields.
		for (const [normalized, reason] of [
			[normalizedTitle, 'duplicate title'],
			[normalizedDesc, 'duplicate description'],
		] as const) {
			if (normalized && words >= 3 && isPreContent(el) &&
				normalizeText(text) === normalized) {
				if (debug && debugRemovals) {
					debugRemovals.push({ step: 'removeByContentPattern', reason, text: textPreview(el) });
				}
				el.remove();
				break;
			}
		}
		if (!el.parentNode) continue;

		// Remove article metadata header blocks (DIV/P) near the top of content.
		// Catches Tailwind-based blog layouts with non-semantic date+category divs,
		// and news site eyebrows with relative timestamps (e.g. "21 hours ago - Politics & Policy").
		if ((tag === 'DIV' || tag === 'P') && words >= 1 && words <= 10 && (hasDate || RELATIVE_TIME_PATTERN.test(text)) && !/[.!?]/.test(text) && isPreContent(el)) {
			if (!Array.from(el.querySelectorAll('p, h1, h2, h3, h4, h5, h6')).some(b => countWords(b.textContent || '') > 8)) {
				if (debug && debugRemovals) {
					debugRemovals.push({ step: 'removeByContentPattern', reason: 'article metadata header block', text: textPreview(el) });
				}
				el.remove();
				continue;
			}
		}

		// Remove category/topic badge blocks near the start of content.
		// These are small containers holding only an image link and a category name link.
		if (tag === 'DIV' && words >= 1 && words <= 5 && !/[.!?]/.test(text) && isPreContent(el) && el.querySelector('img')) {
			const links = el.querySelectorAll('a[href]');
			if (links.length > 0) {
				let linkTextLen = 0;
				for (const link of links) linkTextLen += (link.textContent?.trim() || '').length;
				if (linkTextLen / (text.length || 1) >= 0.8) {
					if (debug && debugRemovals) {
						debugRemovals.push({ step: 'removeByContentPattern', reason: 'category badge', text: textPreview(el) });
					}
					el.remove();
					continue;
				}
			}
		}

		// Remove standalone "By [Name]" author bylines near the start of content.
		if (!bylineFound && STARTS_WITH_BY_PATTERN.test(text) && words >= 2 && !/[.!?]$/.test(text) && isPreContent(el)) {
			const target = walkUpToWrapper(el, text, mainContent);
			if (debug && debugRemovals) {
				debugRemovals.push({ step: 'removeByContentPattern', reason: 'author byline', text: textPreview(target) });
			}
			target.remove();
			bylineFound = true;
			continue;
		}

		// Remove read time metadata (e.g. "8 min read", "Mar 4th 2026 | 3 min read").
		// With a date: any position, no block children. Without: short text near the start.
		if (CONTENT_READ_TIME_PATTERN.test(text) &&
			(hasDate ? el.querySelectorAll('p, div, section, article').length === 0
			         : words <= 5 && isPreContent(el))) {
			let cleaned = text;
			for (const pattern of READ_TIME_STRIP_PATTERNS) {
				cleaned = cleaned.replace(pattern, '');
			}
			if (cleaned.trim().length === 0) {
				const target = hasDate ? el : walkUpToWrapper(el, text, mainContent);
				if (debug && debugRemovals) {
					debugRemovals.push({ step: 'removeByContentPattern', reason: 'read time metadata', text: textPreview(target) });
				}
				target.remove();
				continue;
			}
		}

		// Remove author + date bylines (name + date, any order) near the start.
		if (!authorDateFound && words >= 2 && words <= 10 && hasDate && isPreContent(el)) {
			let residual = text;
			for (const pattern of BYLINE_STRIP_PATTERNS) {
				residual = residual.replace(pattern, '');
			}
			residual = residual.trim();
			if (residual) {
				const nameWords = residual.split(/\s+/).filter(w => w.length > 0);
				if (nameWords.length >= 1 && nameWords.length <= 4 && nameWords.every(w => BYLINE_UPPERCASE_PATTERN.test(w))) {
					const target = walkUpToWrapper(el, text, mainContent);
					if (debug && debugRemovals) {
						debugRemovals.push({ step: 'removeByContentPattern', reason: 'author date metadata', text: textPreview(target) });
					}
					target.remove();
					authorDateFound = true;
					continue;
				}
			}
		}

		// Remove standalone date elements near the start of content.
		if (hasDate && words <= 5 && isPreContent(el)) {
			let residual = text;
			for (const pattern of METADATA_STRIP_BASE) {
				residual = residual.replace(pattern, '');
			}
			residual = residual.replace(/[,\s/\-]+/g, '').trim();
			if (residual.length === 0) {
				const target = walkUpToWrapper(el, text, mainContent);
				if (debug && debugRemovals) {
					debugRemovals.push({ step: 'removeByContentPattern', reason: 'standalone date metadata', text: textPreview(target) });
				}
				target.remove();
				continue;
			}
		}
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
		// Skip the standardized footnotes list
		if (list.closest('#footnotes')) continue;
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

		// Skip lists introduced by a preceding heading or paragraph ending with ":"
		// — those are content lists, not standalone metadata
		const prevSibling = list.previousElementSibling;
		if (prevSibling) {
			// Direct heading or a wrapper div containing a heading (e.g. GitHub's div.markdown-heading)
			if (isOrContainsHeading(prevSibling)) continue;
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

		const target = walkUpToWrapper(list, listText, mainContent);

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
	const urlPath = parsedPageUrl?.pathname || '';
	const pageHost = parsedPageUrl?.hostname.replace(/^www\./, '') || '';
	if (urlPath) {
		const shortElements = mainContent.querySelectorAll('div, span, p, a[href]');
		const firstHeading = mainContent.querySelector('h1, h2, h3');
		for (const el of shortElements) {
			if (!el.parentNode) continue;
			const text = el.textContent?.trim() || '';
			const words = countWords(text);
			if (words > 10) continue;
			// Must be a leaf-ish element (no block children)
			if (el.querySelectorAll('p, div, section, article').length > 0) continue;
			// For bare <a> elements, skip if embedded in flowing prose (parent has other text).
			// Exception: allow embedded <a> elements that appear before the first heading —
			// these are back-navigation links in page headers, not inline prose links.
			if (el.matches('a[href]') && el.parentElement && el.parentElement !== mainContent) {
				const parentText = el.parentElement.textContent?.trim() || '';
				if (parentText !== text) {
					// Skip links inside paragraphs — these are inline prose links, not breadcrumbs
					if (el.closest('p')) continue;
					if (!firstHeading) continue;
					if (!(el.compareDocumentPosition(firstHeading) & 4)) continue;
				}
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

	// Remove trailing "related posts" blocks — a container at the end of content
	// whose children are all short, link-dense paragraphs with no prose sentences.
	// Pattern: <section>/<div>/<aside> containing only <p> elements where each
	// paragraph is mostly links (article title + category tags, no prose).
	let lastChild = mainContent.lastElementChild;
	while (lastChild && ['HR', 'BR'].includes(lastChild.tagName)) {
		lastChild = lastChild.previousElementSibling;
	}
	if (lastChild && ['SECTION', 'DIV', 'ASIDE'].includes(lastChild.tagName)) {
		const paras: Element[] = [];
		let hasNonPara = false;
		for (const child of lastChild.children) {
			const text = child.textContent?.trim() || '';
			if (!text) continue;
			if (child.tagName === 'P') paras.push(child);
			else if (child.tagName !== 'BR') { hasNonPara = true; break; }
		}
		if (paras.length >= 2 && !hasNonPara) {
			const allLinkDense = paras.every(p => {
				const text = (p.textContent?.trim() || '').replace(/\s+/g, ' ');
				const links = p.querySelectorAll('a[href]');
				if (links.length === 0) return false;
				let linkTextLen = 0;
				for (const link of links) linkTextLen += (link.textContent?.trim() || '').length;
				if (linkTextLen / (text.length || 1) <= 0.6) return false;
				let nonLinkText = text;
				for (const link of links) nonLinkText = nonLinkText.split(link.textContent?.trim() || '').join('');
				return !/[.!?]/.test(nonLinkText);
			});
			if (allLinkDense) {
				if (debug && debugRemovals) {
					debugRemovals.push({
						step: 'removeByContentPattern',
						reason: 'trailing related posts block',
						text: textPreview(lastChild)
					});
				}
				lastChild.remove();
			}
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
			// Skip the standardized footnotes container (appended at the end by standardizeFootnotes)
			if (child.id === 'footnotes') {
				child = child.previousElementSibling;
				continue;
			}
			// An <hr> is a content boundary — include it and stop walking
			if (child.tagName === 'HR') {
				trailingEls.push(child);
				break;
			}
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
		// Skip if trailing elements contain content indicators (math, code, tables, images)
		// or multiple prose paragraphs (which indicate a real content section like a conclusion).
		if (trailingEls.length >= 1 && trailingWords < totalWords * 0.15) {
			const hasHeading = trailingEls.some(el => isOrContainsHeading(el));
			const hasContent = trailingEls.some(el =>
				el.querySelector(CONTENT_ELEMENT_SELECTOR)
			);
			// Multiple prose paragraphs indicate a conclusion, not a CTA/promo block.
			let proseParagraphs = 0;
			for (const el of trailingEls) {
				if (el.tagName === 'P' && countWords(el.textContent || '') > 5) {
					proseParagraphs++;
				}
			}
			if (hasHeading && !hasContent && proseParagraphs < 2) {
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
		if (el.closest('pre, code')) continue;
		const text = el.textContent?.trim() || '';
		const words = countWords(text);
		if (words > 50 || words < 1) continue;

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
				if (targetPos < 200) {
					// Walk-up reached a high-level wrapper (targetPos ≈ 0). Can't
					// safely truncate from there. But if the original element is a
					// trailing orphan with no following siblings, remove it directly.
					if (target !== el && !el.nextElementSibling) {
						if (debug && debugRemovals) {
							debugRemovals.push({
								step: 'removeByContentPattern',
								reason: 'boilerplate text',
								text: textPreview(el)
							});
						}
						el.remove();
					}
					continue;
				}

				removeTrailingWithCascade(target, mainContent, debug, debugRemovals);
				break;
			}
		}
	}

	// Remove "Related posts" / "Read next" / "About the Author" sections identified by their heading text.
	for (const heading of mainContent.querySelectorAll('h2, h3, h4, h5, h6')) {
		if (!heading.parentNode) continue;
		const headingText = heading.textContent?.trim() || '';
		const isCta = CTA_HEADING_PATTERN.test(headingText);
		if (!isCta && !RELATED_HEADING_PATTERN.test(headingText)) continue;

		// Must appear after substantial content
		if (contentText.indexOf(headingText) < 500) continue;

		const target = walkUpIsolated(heading, mainContent);

		if (target === heading) {
			// Heading is a direct child — only remove CTA headings (never real content)
			if (!isCta) continue;
			removeTrailingSiblings(heading, true, debug, debugRemovals);
		} else {
			removeThinPrecedingSection(target, debug, debugRemovals);

			if (debug && debugRemovals) {
				debugRemovals.push({ step: 'removeByContentPattern', reason: 'related content section', text: textPreview(target) });
			}

			removeTrailingWithCascade(target, mainContent, debug, debugRemovals);
		}
		break;
	}

	// Remove orphaned "For more on/about ..." intro paragraphs left behind
	// after related content embeds are stripped by selector removal.
	for (const el of mainContent.querySelectorAll('p')) {
		if (!el.parentNode) continue;
		const text = el.textContent?.trim() || '';
		if (!RELATED_INTRO_PATTERN.test(text)) continue;
		if (countWords(text) > 20) continue;
		if (el.querySelector(CONTENT_ELEMENT_SELECTOR)) continue;

		if (debug && debugRemovals) {
			debugRemovals.push({ step: 'removeByContentPattern', reason: 'related content intro', text: textPreview(el) });
		}
		el.remove();
	}

	// Remove related post card grids that lack a detectable heading
	// (e.g. the heading was removed by removeLowScoring before this step runs).
	// Matches a container whose children are predominantly image-bearing cards (img + heading).
	const contentWordCount = countWords(contentText);
	for (const el of mainContent.querySelectorAll('div')) {
		if (!el.parentNode) continue;
		if (el.children.length < 2) continue;
		const children = Array.from(el.children);

		// Each qualifying card must contain an image and either a heading or a link
		// (headings may have been stripped by earlier selector removal steps)
		const cardCount = children.filter(c =>
			c.querySelector('img, picture') && (c.querySelector('h2, h3, h4') || c.querySelector('a[href]'))
		).length;
		if (cardCount < 2 || cardCount < children.length * 0.7) continue;

		// Must appear after substantial content (not a top-of-page listing)
		const firstText = children[0].textContent?.trim().substring(0, 30) || '';
		if (firstText.length < 5 || contentText.indexOf(firstText) < 500) continue;

		// Skip grids whose text is a large share of total content (e.g. numbered takeaways).
		const gridWords = countWords(el.textContent || '');
		if (contentWordCount > 0 && gridWords / contentWordCount > 0.3) continue;

		const target = walkUpIsolated(el, mainContent);
		if (target === el) continue;

		removeThinPrecedingSection(target, debug, debugRemovals);

		if (debug && debugRemovals) {
			debugRemovals.push({ step: 'removeByContentPattern', reason: 'related post cards', text: textPreview(target) });
		}
		removeTrailingSiblings(target, true, debug, debugRemovals);
		break;
	}

	// Remove newsletter signup sections identified by their text content.
	// Catches signup forms whose class names are hashed (e.g. Chakra UI apps)
	// after the <form> element itself has been removed by selector removal.
	// Note: textContent in some DOM implementations (e.g. linkedom) concatenates adjacent
	// element text without whitespace, so we normalize camelCase boundaries before matching.
	for (const el of mainContent.querySelectorAll('div, section, aside')) {
		if (!el.parentNode) continue;
		if (el.closest('pre, code')) continue;
		if (!isNewsletterElement(el, 60)) continue;

		// Walk up while the parent doesn't have significantly more content
		// (i.e. the newsletter is the only or near-only child).
		const elWords = countWords(el.textContent?.trim() || '');
		let target: Element = el;
		while (target.parentElement && target.parentElement !== mainContent) {
			const parentWords = countWords(target.parentElement.textContent?.trim() || '');
			if (parentWords > elWords * 2 + 15) break;
			target = target.parentElement;
		}

		if (debug && debugRemovals) {
			debugRemovals.push({ step: 'removeByContentPattern', reason: 'newsletter signup', text: textPreview(target) });
		}
		target.remove();
		break;
	}

	// Remove newsletter signup lists — <ul> elements whose only content is
	// newsletter signup links (e.g. Guardian standfirst).
	for (const el of mainContent.querySelectorAll('ul')) {
		if (!el.parentNode) continue;
		if (!isNewsletterElement(el, 30)) continue;

		if (debug && debugRemovals) {
			debugRemovals.push({ step: 'removeByContentPattern', reason: 'newsletter signup list', text: textPreview(el) });
		}
		el.remove();
		break;
	}

	// Remove author/contact info blocks near the end of content.
	// These contain labels like "Written by" or "Contact" alongside names,
	// email addresses, and phone numbers — common in news/university sites.
	for (const el of mainContent.querySelectorAll('div, section')) {
		if (!el.parentNode) continue;
		const text = el.textContent?.trim() || '';
		const words = countWords(text);
		if (words < 2 || words > 40) continue;

		// Must be near the end of content
		const pos = contentText.indexOf(text.substring(0, 60));
		if (pos < 0) continue;
		const distFromEnd = contentText.length - (pos + text.length);
		if (distFromEnd > 300) continue;

		// Must contain an author/contact label
		const children = el.querySelectorAll('div, span, p, dt, dd, li');
		let hasLabel = false;
		for (const child of children) {
			const childText = child.textContent?.trim() || '';
			if (AUTHOR_CONTACT_LABEL_PATTERN.test(childText)) {
				hasLabel = true;
				break;
			}
		}
		if (!hasLabel) continue;

		// Must also contain contact info (email or phone) or a mailto link
		const hasContactInfo = EMAIL_PATTERN.test(text) || PHONE_PATTERN.test(text) || el.querySelector('a[href^="mailto:"]');
		if (!hasContactInfo) continue;

		const target = walkUpIsolated(el, mainContent);
		if (debug && debugRemovals) {
			debugRemovals.push({ step: 'removeByContentPattern', reason: 'author contact block', text: textPreview(target) });
		}
		target.remove();
		break;
	}

	// Remove author/share metadata widgets — short containers with labels like
	// "Author", "Share", "Written by" common in Tailwind/Next.js blog templates.
	// Images excluded from content check since author avatars are common.
	for (const el of mainContent.querySelectorAll('p, span, div')) {
		if (!el.parentNode) continue;
		const elText = el.textContent?.trim() || '';
		if (!SHARE_AUTHOR_LABEL.test(elText)) continue;

		let container = el;
		while (container.parentElement && container.parentElement !== mainContent) {
			const parent = container.parentElement;
			if (countWords(parent.textContent?.trim() || '') > 15) break;
			container = parent;
		}

		if (container.querySelector(CONTENT_ELEMENT_NO_IMG_SELECTOR)) continue;

		if (debug && debugRemovals) {
			debugRemovals.push({ step: 'removeByContentPattern', reason: 'author/share widget', text: textPreview(container) });
		}
		container.remove();
	}

	// Remove social engagement counters ("9 Likes", "3 Comments", etc.)
	// Check block elements near the end of content, and bare <a> elements (no href) anywhere
	for (const el of mainContent.querySelectorAll('a, p, div, span')) {
		if (!el.parentNode) continue;
		const text = el.textContent?.trim() || '';
		if (!SOCIAL_COUNTER_PATTERN.test(text)) continue;
		if (el.tagName === 'A' && el.getAttribute('href')) continue;
		if (el.tagName !== 'A') {
			const pos = contentText.indexOf(text);
			const distFromEnd = contentText.length - (pos + text.length);
			if (distFromEnd > 200) continue;
		}
		const target = walkUpToWrapper(el, text, mainContent);
		if (debug && debugRemovals) {
			debugRemovals.push({ step: 'removeByContentPattern', reason: 'social engagement counter', text: textPreview(target) });
		}
		target.remove();
	}

	// Remove trailing tag/category link blocks — short blocks near the end of
	// content containing only links (e.g. "Features", "Amazon", "Amazon Kindle").
	// These are tag clouds or category link sections appended after the article body.
	for (const el of mainContent.querySelectorAll('div')) {
		if (!el.parentNode) continue;
		const text = el.textContent?.trim() || '';
		const words = countWords(text);
		if (words < 1 || words > 10) continue;
		if (/[.!?]/.test(text)) continue;
		if (el.querySelector(CONTENT_ELEMENT_SELECTOR)) continue;

		const pos = contentText.indexOf(text);
		if (pos < 0) continue;
		const distFromEnd = contentText.length - (pos + text.length);
		if (distFromEnd > 300) continue;

		const links = el.querySelectorAll('a[href]');
		if (links.length === 0) continue;
		let linkTextLen = 0;
		for (const link of links) linkTextLen += (link.textContent?.trim() || '').length;
		if (linkTextLen / (text.length || 1) < 0.8) continue;

		if (debug && debugRemovals) {
			debugRemovals.push({ step: 'removeByContentPattern', reason: 'trailing tag link block', text: textPreview(el) });
		}
		el.remove();
	}

}
