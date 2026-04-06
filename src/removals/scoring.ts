import { FOOTNOTE_INLINE_REFERENCES, BLOCK_ELEMENTS_SELECTOR, FOOTNOTE_LIST_SELECTORS } from '../constants';
import { DebugRemoval } from '../types';
import { textPreview, countWords, logDebug } from '../utils';
import { getClassName } from '../utils/dom';

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

export class ContentScorer {
	private doc: Document;
	private debug: boolean;

	constructor(doc: Document, debug: boolean = false) {
		this.doc = doc;
		this.debug = debug;
	}

	static scoreElement(element: Element): number {
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
		const hasFootnotes = element.querySelector(FOOTNOTE_INLINE_REFERENCES);
		if (hasFootnotes) score += 10;

		const hasFootnotesList = element.querySelector(FOOTNOTE_LIST_SELECTORS);
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
	public static scoreAndRemove(doc: Document, debug: boolean = false, debugRemovals?: DebugRemoval[], mainContent?: Element | null): void {
		const startTime = Date.now();

		// Track all elements to be removed
		const elementsToRemove = new Map<Element, number>();

		// Get all block elements
		const blockElements = Array.from(doc.querySelectorAll(BLOCK_ELEMENTS_SELECTOR));

		// Process each block element
		blockElements.forEach(element => {
			// Skip elements that are already marked for removal
			if (elementsToRemove.has(element)) {
				return;
			}

			// Skip ancestors of mainContent to avoid disconnecting it
			if (mainContent && element.contains(mainContent)) {
				return;
			}

			// Skip elements inside code blocks — they are code structure, not page navigation
			if (element.closest('pre')) {
				return;
			}

			// Skip elements that are likely to be content
			if (ContentScorer.isLikelyContent(element)) {
				return;
			}

			// Score the element based on various criteria
			const score = ContentScorer.scoreNonContentBlock(element);

			// If the score is below the threshold, mark for removal
			if (score < 0) {
				elementsToRemove.set(element, score);
			}
		});

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
	 * Determines if an element is likely to be content based on its structure and attributes.
	 */
	private static isLikelyContent(element: Element): boolean {
		// Check if the element has a role that indicates content
		const role = element.getAttribute('role');
		if (role && ['article', 'main', 'contentinfo'].includes(role)) {
			return true;
		}

		// Check if the element has a class or id that indicates content
		const className = getClassName(element).toLowerCase();
		const id = element.id.toLowerCase();

		for (const indicator of contentIndicators) {
			if (className.includes(indicator) || id.includes(indicator)) {
				return true;
			}
		}

		// Elements containing code blocks, tables, or figures are likely content
		if (element.querySelector('pre, table, figure, picture')) {
			return true;
		}

		const text = element.textContent || '';
		const words = countWords(text);

		// Check for headings that signal non-content sections (e.g. "Related articles")
		// even if the element has enough text/paragraphs to otherwise look like content.
		// Skip very large elements (1000+ words) as they are likely page-level wrappers.
		if (words < 1000) {
			const headings = element.querySelectorAll('h1, h2, h3, h4, h5, h6');
			let hasNavigationHeading = false;
			for (let i = 0; i < headings.length; i++) {
				const headingText = (headings[i].textContent || '').toLowerCase().trim();
				if (navigationHeadingPattern.test(headingText)) {
					hasNavigationHeading = true;
					break;
				}
			}

			if (hasNavigationHeading) {
				if (words < 200) {
					return false;
				}
				// Larger sections (e.g. card grids) are also non-content
				// if they have high link density
				const linkCount = element.getElementsByTagName('a').length;
				const linkDensity = linkCount / (words || 1);
				if (linkDensity > 0.2) {
					return false;
				}
			}
		}

		// Article card listing detection: blocks with many headings and images
		// but very little prose per heading are likely article card grids
		// (e.g. "related articles", "more stories"), not single-article content.
		// Also checked in scoreNonContentBlock as a score penalty for elements
		// that pass the content checks above but still look like card grids.
		if (ContentScorer.isCardGrid(element, words)) {
			return false;
		}

		// Small elements containing social media profile links are likely
		// author bios or social widgets, not article content.
		if (words < 80) {
			const links = element.getElementsByTagName('a');
			for (let i = 0; i < links.length; i++) {
				const href = (links[i].getAttribute('href') || '').toLowerCase();
				if (socialProfilePattern.test(href)) {
					return false;
				}
			}
		}

		const paragraphs = element.getElementsByTagName('p').length;
		const listItems = element.getElementsByTagName('li').length;
		const contentBlocks = paragraphs + listItems;

		// If the element has a significant amount of text and paragraphs/list items, it's likely content
		if (words > 50 && contentBlocks > 1) {
			return true;
		}

		// Check for elements with significant text content, even if they don't have many paragraphs
		if (words > 100) {
			return true;
		}

		// Check for elements with text content and some paragraphs/list items
		if (words > 30 && contentBlocks > 0) {
			return true;
		}

		// Prose text with sentence-ending punctuation and low link density is
		// likely content even without <p> tags (e.g. transcript segments using divs/spans)
		if (words >= 10 && /[.?!]/.test(text)) {
			const linkCount = element.getElementsByTagName('a').length;
			const linkDensity = linkCount / words;
			if (linkDensity < 0.1) {
				return true;
			}
		}

		return false;
	}

	/**
	 * Scores a block element based on various criteria to determine if it's likely not content.
	 * Returns a negative score if the element is likely not content, a positive score if it is.
	 */
	private static scoreNonContentBlock(element: Element): number {
		// Skip footnote list elements and their descendants
		try {
			if (element.matches(FOOTNOTE_LIST_SELECTORS) ||
				element.querySelector(FOOTNOTE_LIST_SELECTORS) ||
				element.closest(FOOTNOTE_LIST_SELECTORS)) {
				return 0;
			}
		} catch (e) {}

		let score = 0;

		// Get text content
		const text = element.textContent || '';
		const words = countWords(text);

		// Skip very small elements
		if (words < 3) {
			return 0;
		}

		// Comma counting — prose has commas, navigation/boilerplate doesn't.
		// This counterbalances negative signals from navigation indicators.
		const commas = text.split(/,/).length - 1;
		score += commas;

		const textLower = text.toLowerCase();
		let indicatorMatches = 0;
		for (const regex of navigationIndicatorRegexes) {
			if (regex.test(textLower)) {
				indicatorMatches++;
			}
		}
		score -= indicatorMatches * 10;

		// Check for high link density (navigation)
		const linkElements = element.getElementsByTagName('a');
		const links = linkElements.length;
		const linkDensity = links / (words || 1);
		if (linkDensity > 0.5) {
			score -= 15;
		}

		// Check for high link text ratio (e.g. card groups, nav sections)
		// Requires multiple links to avoid penalizing content paragraphs
		// that happen to be wrapped in a single link
		if (links > 1 && words < 80) {
			let linkTextLength = 0;
			for (let i = 0; i < linkElements.length; i++) {
				linkTextLength += (linkElements[i].textContent || '').length;
			}
			const totalTextLength = text.length;
			if (totalTextLength > 0 && linkTextLength / totalTextLength > 0.8) {
				score -= 15;
			}
		}

		// Check for list structure (navigation)
		const lists = element.getElementsByTagName('ul').length + element.getElementsByTagName('ol').length;
		if (lists > 0 && links > lists * 3) {
			score -= 10;
		}

		// Check for social media profile links (author bios, social widgets)
		if (words < 80) {
			const elLinks = element.getElementsByTagName('a');
			for (let i = 0; i < elLinks.length; i++) {
				const href = (elLinks[i].getAttribute('href') || '').toLowerCase();
				if (socialProfilePattern.test(href)) {
					score -= 15;
					break;
				}
			}
		}

		// Penalize very small blocks that look like standalone author bylines with dates
		// e.g. "By Author Name · March 4, 2026". Requires both an author attribution
		// and a date to avoid false positives.
		if (words < 15) {
			if (bylinePattern.test(text) && datePattern.test(text)) {
				score -= 10;
			}
		}

		// Penalize blocks that look like article card grids
		if (ContentScorer.isCardGrid(element, words)) {
			score -= 15;
		}

		// Check for specific class patterns that indicate non-content
		const className = getClassName(element).toLowerCase();
		const id = element.id.toLowerCase();

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
	private static isCardGrid(element: Element, words: number): boolean {
		if (words < 3 || words >= 500) return false;
		const headings = element.querySelectorAll('h2, h3, h4');
		if (headings.length < 3) return false;
		const images = element.querySelectorAll('img');
		if (images.length < 2) return false;
		let headingWordCount = 0;
		for (let i = 0; i < headings.length; i++) {
			headingWordCount += countWords(headings[i].textContent || '');
		}
		const prosePerHeading = (words - headingWordCount) / headings.length;
		return prosePerHeading < 20;
	}
}
