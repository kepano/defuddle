import { BLOCK_ELEMENTS, FOOTNOTE_INLINE_REFERENCES, FOOTNOTE_LIST_SELECTORS } from '../constants';
import { DebugRemoval } from '../types';
import { textPreview, countWords, logDebug } from '../utils';
import { getClassName } from '../utils/dom';

const BLOCK_ELEMENTS_UPPER = new Set(BLOCK_ELEMENTS.map(t => t.toUpperCase()));
const CONTENT_PROTECTED_TAGS = new Set(['PRE', 'TABLE', 'FIGURE', 'PICTURE']);
const HEADING_TAGS = new Set(['H1', 'H2', 'H3', 'H4', 'H5', 'H6']);
const CONTENT_ROLES = new Set(['article', 'main', 'contentinfo']);

function collectFootnoteListElements(root: Element, footnoteListSet: Set<Element>, footnoteListAncestors: Set<Element>): void {
	const lists = Array.from(root.querySelectorAll(FOOTNOTE_LIST_SELECTORS));
	if (root.matches(FOOTNOTE_LIST_SELECTORS)) lists.unshift(root);
	for (const el of lists) {
		footnoteListSet.add(el);
		for (let cur: Element | null = el; cur && !footnoteListAncestors.has(cur); cur = cur.parentElement) {
			footnoteListAncestors.add(cur);
		}
	}
}

function hasDescendantTag(root: Element, tags: Set<string>): boolean {
	for (let child = root.firstElementChild; child; child = child.nextElementSibling) {
		if (tags.has(child.tagName.toUpperCase()) || hasDescendantTag(child, tags)) {
			return true;
		}
	}
	return false;
}

function findFirstHeading(root: Element): Element | null {
	for (let child = root.firstElementChild; child; child = child.nextElementSibling) {
		if (HEADING_TAGS.has(child.tagName.toUpperCase())) return child;
		if (child.firstElementChild) {
			const found = findFirstHeading(child);
			if (found) return found;
		}
	}
	return null;
}

function collectHeadings(root: Element, out: Element[] = []): Element[] {
	for (let child = root.firstElementChild; child; child = child.nextElementSibling) {
		if (HEADING_TAGS.has(child.tagName.toUpperCase())) {
			out.push(child);
		}
		if (child.firstElementChild) {
			collectHeadings(child, out);
		}
	}
	return out;
}

function countCommas(text: string): number {
	let count = 0;
	let pos = text.indexOf(',');
	while (pos !== -1) {
		count++;
		pos = text.indexOf(',', pos + 1);
	}
	return count;
}

const contentIndicators = [
	'admonition',
	'article',
	'content',
	'entry',
	'image',
	'img',
	'font',
	'figure',
	'figcaption',
	'pre',
	'main',
	'post',
	'story',
	'table'
];

// Text content to test against
const navigationIndicators = [
	'advertisement',
	'all rights reserved',
	'banner',
	'cookie',
	'comments',
	'copyright',
	'follow me',
	'follow us',
	'footer',
	'header',
	'homepage',
	'login',
	'menu',
	'more articles',
	'more like this',
	'most read',
	'nav',
	'navigation',
	'newsletter',
	'popular',
	'privacy',
	'recommended',
	'register',
	'related',
	'responses',
	'share',
	'sidebar',
	'sign in',
	'sign up',
	'signup',
	'social',
	'sponsored',
	'subscribe',
	'terms',
	'trending'
];

// Social media profile URL pattern — used to detect author bios
const socialProfilePattern = /\b(linkedin\.com\/(in|company)\/|twitter\.com\/(?!intent\b)\w|x\.com\/(?!intent\b)\w|facebook\.com\/(?!share\b)\w|instagram\.com\/\w|threads\.net\/\w|mastodon\.\w)/i;

// Date pattern for detecting standalone bylines — no leading \b because
// textContent can concatenate adjacent elements without whitespace
const datePattern = /(?:(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\s+\d{1,2}|\d{1,2}(?:st|nd|rd|th)?\s+(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*)/i;

// Author attribution pattern — case-sensitive "By" + capitalized name
const bylinePattern = /\bBy\s+[A-Z]/;

// Pre-compiled navigation indicator regexes for scoreNonContentBlock
const navigationIndicatorRegexes = navigationIndicators.map(
	indicator => new RegExp(`\\b${indicator.replace(/\s+/g, '\\s+')}\\b`)
);

// Single combined regex for heading text matching in isLikelyContent
const navigationHeadingPattern = new RegExp(
	navigationIndicators.map(i => i.replace(/\s+/g, '\\s+')).join('|'), 'i'
);

// Table of contents heading labels — excluded from heading wrapper protection
const tocHeadingPattern = /^(?:table of )?contents$|^on this page$|^in this (?:article|guide|post)$/i;

// Date pattern for content scoring (extended with year)
const contentDatePattern = /\b(?:(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\s+\d{1,2},?\s+\d{4}|\d{1,2}(?:st|nd|rd|th)?\s+(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*,?\s+\d{4})\b/i;

// Author attribution pattern for content scoring
const contentAuthorPattern = /\b(?:by|written by|author:)\s+[A-Za-z\s]+\b/i;

// Classes that indicate non-content these are elements are
// not removed, but lower the score
const nonContentPatterns = [
	'advert',
	'ad-',
	'ads',
	'banner',
	'cookie',
	'copyright',
	'footer',
	'header',
	'homepage',
	'menu',
	'nav',
	'newsletter',
	'popular',
	'privacy',
	'recommended',
	'related',
	'rights',
	'share',
	'sidebar',
	'social',
	'sponsored',
	'subscribe',
	'terms',
	'trending',
	'widget'
];

export interface ContentScore {
	score: number;
	element: Element;
}

export interface ScoreFootnoteContext {
	footnoteRefAncestors: Set<Element>;
	footnoteListAncestors: Set<Element>;
}

export class ContentScorer {
	static scoreElement(element: Element, footnoteContext?: ScoreFootnoteContext): number {
		let score = 0;

		// Text density
		const text = element.textContent || '';
		const words = countWords(text);
		score += words;

		// Paragraph ratio
		const paragraphs = element.getElementsByTagName('p').length;
		score += paragraphs * 10;

		// Comma counting — prose text has commas, navigation doesn't
		const commas = text.split(/,/).length - 1;
		score += commas;

		// Image ratio (penalize high image density)
		const images = element.getElementsByTagName('img').length;
		const imageDensity = images / (words || 1);
		score -= imageDensity * 3;

		// Position bonus (center/right elements)
		try {
			const style = element.getAttribute('style') || '';
			const align = element.getAttribute('align') || '';
			const isRightSide = style.includes('float: right') || 
							   style.includes('text-align: right') || 
							   align === 'right';
			if (isRightSide) score += 5;
		} catch (e) {
			// Ignore position if we can't get style
		}

		// Content indicators
		const hasDate = contentDatePattern.test(text);
		if (hasDate) score += 10;

		const hasAuthor = contentAuthorPattern.test(text);
		if (hasAuthor) score += 10;

		// Check for common content classes/attributes
		const className = getClassName(element).toLowerCase();
		if (className.includes('content') || className.includes('article') || className.includes('post')) {
			score += 15;
		}

		// Check for footnotes/references
		const hasFootnotes = footnoteContext
			? footnoteContext.footnoteRefAncestors.has(element)
			: Boolean(element.querySelector(FOOTNOTE_INLINE_REFERENCES));
		if (hasFootnotes) score += 10;

		const hasFootnotesList = footnoteContext
			? footnoteContext.footnoteListAncestors.has(element)
			: Boolean(element.querySelector(FOOTNOTE_LIST_SELECTORS));
		if (hasFootnotesList) score += 10;

		// Check for nested tables (penalize)
		const nestedTables = element.getElementsByTagName('table').length;
		score -= nestedTables * 5;

		// Additional scoring for table cells
		if (element.tagName.toLowerCase() === 'td') {
			// Table cells get a bonus for being in the main content area
			const parentTable = element.closest('table');
			if (parentTable) {
				// Only favor cells in tables that look like old-style content layouts
				const tableWidth = parseInt(parentTable.getAttribute('width') || '0');
				const tableAlign = parentTable.getAttribute('align') || '';
				const tableClass = getClassName(parentTable).toLowerCase();
				const isTableLayout = 
					tableWidth > 400 || // Common width for main content tables
					tableAlign === 'center' ||
					tableClass.includes('content') ||
					tableClass.includes('article');

				if (isTableLayout) {
					// Additional checks to ensure this is likely the main content cell
					const allCells = Array.from(parentTable.getElementsByTagName('td'));
					const cellIndex = allCells.indexOf(element as HTMLTableCellElement);
					const isCenterCell = cellIndex > 0 && cellIndex < allCells.length - 1;
					
					if (isCenterCell) {
						score += 10;
					}
				}
			}
		}

		// Link density as a multiplier — scales the score down proportionally
		// rather than applying a fixed penalty. Capped at 0.5 reduction to
		// avoid over-penalizing link-heavy content like blog index pages.
		const linkElements = element.getElementsByTagName('a');
		let linkTextLength = 0;
		for (let i = 0; i < linkElements.length; i++) {
			linkTextLength += (linkElements[i].textContent || '').length;
		}
		const textLength = text.length || 1;
		const linkDensity = Math.min(linkTextLength / textLength, 0.5);
		score *= (1 - linkDensity);

		return score;
	}

	static findBestElement(elements: Element[], minScore: number = 50): Element | null {
		let bestElement: Element | null = null;
		let bestScore = 0;

		elements.forEach(element => {
			const score = this.scoreElement(element);
			if (score > bestScore) {
				bestScore = score;
				bestElement = element;
			}
		});

		return bestScore > minScore ? bestElement : null;
	}

	/**
	 * Scores blocks based on their content and structure
	 * and removes those that are likely not content.
	 */
	public static scoreAndRemove(doc: Document | Element, debug: boolean = false, debugRemovals?: DebugRemoval[], mainContent?: Element | null): void {
		const startTime = Date.now();

		// Track all elements to be removed
		const elementsToRemove = new Map<Element, number>();

		// Precompute ancestors of mainContent so el.contains(mainContent) is O(1)
		const mainAncestors = new Set<Element>();
		if (mainContent) {
			for (let cur: Element | null = mainContent; cur; cur = cur.parentElement) {
				mainAncestors.add(cur);
			}
		}

		// Precompute footnote list containers and their ancestors once
		const footnoteListSet = new Set<Element>();
		const footnoteListAncestors = new Set<Element>();
		const isDoc = 'documentElement' in doc;
		const root = isDoc ? doc.documentElement : doc;
		if (root) {
			collectFootnoteListElements(root, footnoteListSet, footnoteListAncestors);
		}

		// Single-pass pre-order walk tracking ancestor context instead of
		// querySelectorAll(BLOCK_ELEMENTS_SELECTOR) + 3 closest() calls per block.
		const visit = (
			el: Element,
			inPre: boolean,
			inDefuddle: boolean,
			inTableCell: boolean,
			inFootnoteList: boolean
		): void => {
			const tag = el.tagName.toUpperCase();
			const selfOrAncPre = inPre || tag === 'PRE';
			if (selfOrAncPre) return;

			const selfOrAncDefuddle = inDefuddle || el.hasAttribute('data-defuddle');
			if (selfOrAncDefuddle) return;

			const selfOrAncTableCell = inTableCell || tag === 'TD' || tag === 'TH';
			if (selfOrAncTableCell) return;

			const selfOrAncFootnote = inFootnoteList || footnoteListSet.has(el);
			if (selfOrAncFootnote) return;

			let removed = false;
			if (
				BLOCK_ELEMENTS_UPPER.has(tag) &&
				!mainAncestors.has(el) &&
				!footnoteListAncestors.has(el)
			) {
				const score = ContentScorer.evaluateBlockForRemoval(el);
				if (score < 0) {
					elementsToRemove.set(el, score);
					removed = true;
				}
			}

			// Outside debug mode, descendants of a removed element are removed with it.
			if ((removed && !debug) || tag === 'TEMPLATE') return;

			for (let child = el.firstElementChild; child; child = child.nextElementSibling) {
				visit(child, selfOrAncPre, selfOrAncDefuddle, selfOrAncTableCell, selfOrAncFootnote);
			}
		};

		if (root) {
			if (isDoc) {
				visit(root, false, false, false, false);
			} else {
				let rootInPre = false;
				let rootInDefuddle = false;
				let rootInTableCell = false;
				for (let cur: Element | null = root; cur; cur = cur.parentElement) {
					const t = cur.tagName.toUpperCase();
					if (t === 'PRE') rootInPre = true;
					if (t === 'TD' || t === 'TH') rootInTableCell = true;
					if (cur.hasAttribute('data-defuddle')) rootInDefuddle = true;
				}
				if (!rootInPre && !rootInDefuddle && !rootInTableCell && !footnoteListSet.has(root)) {
					for (let child = root.firstElementChild; child; child = child.nextElementSibling) {
						visit(child, false, false, false, false);
					}
				}
			}
		}

		// Remove all collected elements in a single pass
		elementsToRemove.forEach((score, el) => {
			if (debug && debugRemovals) {
				debugRemovals.push({
					step: 'scoreAndRemove',
					reason: `score: ${score}`,
					text: textPreview(el)
				});
			}
			el.remove();
		});

		const endTime = Date.now();
		logDebug(debug, 'Removed non-content blocks:', {
			count: elementsToRemove.size,
			processingTime: `${(endTime - startTime).toFixed(2)}ms`
		});
	}

	/**
	 * Combined likely-content check + non-content scoring that reuses textContent,
	 * word count, heading collection, link list, social check, and card-grid check.
	 * Returns 0 when the element should be kept, or a negative score when removable.
	 */
	private static evaluateBlockForRemoval(element: Element): number {
		// Check if the element has a role that indicates content
		const role = element.getAttribute('role');
		if (role && CONTENT_ROLES.has(role)) {
			return 0;
		}

		// Check if the element has a class or id that indicates content
		const className = getClassName(element).toLowerCase();
		const id = element.id.toLowerCase();

		for (const indicator of contentIndicators) {
			if (className.includes(indicator) || id.includes(indicator)) {
				return 0;
			}
		}

		// Elements containing code blocks, tables, or figures are likely content
		if (hasDescendantTag(element, CONTENT_PROTECTED_TAGS)) {
			return 0;
		}

		const text = element.textContent || '';
		const words = countWords(text);

		// Very small elements are never removed (scoreNonContentBlock returns 0 for words < 3)
		if (words < 3) {
			return 0;
		}

		// Heading wrapper check: stop at the first heading; only collect all headings when words < 1000.
		const headings = words < 1000 ? collectHeadings(element) : null;
		const firstHeading = headings ? (headings[0] ?? null) : findFirstHeading(element);
		if (firstHeading) {
			const headingText = (firstHeading.textContent || '').trim();
			if (headingText && headingText === text.trim()) {
				const headingLower = headingText.toLowerCase();
				if (!navigationHeadingPattern.test(headingLower) &&
					!tocHeadingPattern.test(headingLower)) {
					return 0;
				}
			}
		}

		let linkElements: HTMLCollectionOf<Element> | null = null;
		const getLinks = () => {
			if (!linkElements) linkElements = element.getElementsByTagName('a');
			return linkElements;
		};

		let likelyContent = false;
		let rejectedByNavHeading = false;

		if (headings && headings.length > 0) {
			let hasNavigationHeading = false;
			let hasTitleHeading = false;
			for (let i = 0; i < headings.length; i++) {
				const headingText = (headings[i].textContent || '').toLowerCase().trim();
				if (navigationHeadingPattern.test(headingText)) {
					hasNavigationHeading = true;
				} else if (headingText && headings[i].tagName.toUpperCase() === 'H1') {
					hasTitleHeading = true;
				}
			}
			if (hasTitleHeading) {
				hasNavigationHeading = false;
			}

			if (hasNavigationHeading) {
				if (words < 200) {
					rejectedByNavHeading = true;
				} else {
					const linkCount = getLinks().length;
					const linkDensity = linkCount / (words || 1);
					if (linkDensity > 0.2) {
						rejectedByNavHeading = true;
					}
				}
			}
		}

		let cardGrid: boolean | undefined;
		let hasSocialProfile: boolean | undefined;

		if (!rejectedByNavHeading) {
			cardGrid = headings ? ContentScorer.isCardGrid(element, words, headings) : false;
			if (!cardGrid) {
				if (words < 80) {
					const links = getLinks();
					hasSocialProfile = false;
					for (let i = 0; i < links.length; i++) {
						const href = (links[i].getAttribute('href') || '').toLowerCase();
						if (socialProfilePattern.test(href)) {
							hasSocialProfile = true;
							break;
						}
					}
				}
				if (!hasSocialProfile) {
					if (words > 100) {
						likelyContent = true;
					} else {
						const paragraphs = element.getElementsByTagName('p').length;
						const listItems = element.getElementsByTagName('li').length;
						const contentBlocks = paragraphs + listItems;

						if ((words > 50 && contentBlocks > 1) || (words > 30 && contentBlocks > 0)) {
							likelyContent = true;
						} else if (words >= 10 && /[.?!]/.test(text)) {
							const linkCount = getLinks().length;
							if (linkCount / words < 0.1) {
								likelyContent = true;
							}
						}
					}
				}
			}
		}

		if (likelyContent) {
			return 0;
		}

		// Score as non-content block, reusing already-computed data
		let score = countCommas(text);

		const textLower = text.toLowerCase();
		let indicatorMatches = 0;
		for (const regex of navigationIndicatorRegexes) {
			if (regex.test(textLower)) {
				indicatorMatches++;
			}
		}
		score -= indicatorMatches * 10;

		const links = getLinks();
		const linkCount = links.length;
		if (linkCount / words > 0.5) {
			score -= 15;
		}

		if (linkCount > 1 && words < 80) {
			let linkTextLength = 0;
			for (let i = 0; i < linkCount; i++) {
				linkTextLength += (links[i].textContent || '').length;
			}
			const totalTextLength = text.length;
			if (totalTextLength > 0 && linkTextLength / totalTextLength > 0.8) {
				score -= 15;
			}
		}

		const lists = element.getElementsByTagName('ul').length + element.getElementsByTagName('ol').length;
		if (lists > 0 && linkCount > lists * 3) {
			score -= 10;
		}

		if (words < 80) {
			if (hasSocialProfile === undefined) {
				hasSocialProfile = false;
				for (let i = 0; i < linkCount; i++) {
					const href = (links[i].getAttribute('href') || '').toLowerCase();
					if (socialProfilePattern.test(href)) {
						hasSocialProfile = true;
						break;
					}
				}
			}
			if (hasSocialProfile) {
				score -= 15;
			}
		}

		if (words < 15) {
			if (bylinePattern.test(text) && datePattern.test(text)) {
				score -= 10;
			}
		}

		if (cardGrid === undefined) {
			cardGrid = headings ? ContentScorer.isCardGrid(element, words, headings) : false;
		}
		if (cardGrid) {
			score -= 15;
		}

		for (const pattern of nonContentPatterns) {
			if (className.includes(pattern) || id.includes(pattern)) {
				score -= 8;
			}
		}

		return score;
	}

	/**
	 * Detects article card grids: blocks with 3+ headings and 2+ images
	 * but very little prose per heading.
	 */
	private static isCardGrid(element: Element, words: number, allHeadings: Element[]): boolean {
		if (words < 3 || words >= 500) return false;
		let hCount = 0;
		let headingWordCount = 0;
		for (let i = 0; i < allHeadings.length; i++) {
			const t = allHeadings[i].tagName.toUpperCase();
			if (t === 'H2' || t === 'H3' || t === 'H4') {
				hCount++;
			}
		}
		if (hCount < 3) return false;
		if (element.getElementsByTagName('img').length < 2) return false;
		for (let i = 0; i < allHeadings.length; i++) {
			const t = allHeadings[i].tagName.toUpperCase();
			if (t === 'H2' || t === 'H3' || t === 'H4') {
				headingWordCount += countWords(allHeadings[i].textContent || '');
			}
		}
		const prosePerHeading = (words - headingWordCount) / hCount;
		return prosePerHeading < 20;
	}
}
