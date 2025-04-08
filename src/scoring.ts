import { FOOTNOTE_INLINE_REFERENCES, BLOCK_ELEMENTS } from './constants';

const contentIndicators = [
	'article',
	'content',
	'entry',
	'image',
	'img',
	'photo',
	'figure',
	'figcaption',
	'table',
	'pre',
	'main',
	'post',
	'story'
];

// Text content to test against
const navigationIndicators = [
	'advertisement',
	'all rights reserved',
	'banner',
	'cookie',
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
	'newsletter',
	'popular',
	'privacy',
	'recommended',
	'register',
	'related',
	'share',
	'sidebar',
	'sign in',
	'sign up',
	'signup',
	'social',
	'sponsored',
	'subscribe',
	'subscribe',
	'terms',
	'trending'
];

// Classes that indicate non-content these are elements are
// not removed, but lower the score
const nonContentPatterns = [
	'ad',
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
		const words = text.split(/\s+/).length;
		score += words;

		// Paragraph ratio
		const paragraphs = element.getElementsByTagName('p').length;
		score += paragraphs * 10;

		// Link density (penalize high link density)
		const links = element.getElementsByTagName('a').length;
		const linkDensity = links / (words || 1);
		score -= linkDensity * 5;

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
		const hasDate = /\b(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\s+\d{1,2},?\s+\d{4}\b/i.test(text);
		if (hasDate) score += 10;

		const hasAuthor = /\b(?:by|written by|author:)\s+[A-Za-z\s]+\b/i.test(text);
		if (hasAuthor) score += 10;

		// Check for common content classes/attributes
		const className = element.className.toLowerCase();
		if (className.includes('content') || className.includes('article') || className.includes('post')) {
			score += 15;
		}

		// Check for footnotes/references
		const hasFootnotes = element.querySelector(FOOTNOTE_INLINE_REFERENCES);
		if (hasFootnotes) score += 10;

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
				const tableClass = parentTable.className.toLowerCase();
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
	 * and removes those that are likely not content
	 */
	public static scoreAndRemove(doc: Document, debug: boolean = false) {
		const startTime = Date.now();
		let removedCount = 0;

		// Track all elements to be removed
		const elementsToRemove = new Set<Element>();

		// Get all block elements
		const blockElements = Array.from(doc.querySelectorAll(BLOCK_ELEMENTS.join(',')));

		// Process each block element
		blockElements.forEach(element => {
			// Skip elements that are already marked for removal
			if (elementsToRemove.has(element)) {
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
				elementsToRemove.add(element);
				removedCount++;
			}
		});

		// Remove all collected elements in a single pass
		elementsToRemove.forEach(el => el.remove());

		const endTime = Date.now();
		if (debug) {
			console.log('Defuddle', 'Removed non-content blocks:', {
				count: removedCount,
				processingTime: `${(endTime - startTime).toFixed(2)}ms`
			});
		}
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
		const className = element.className.toLowerCase();
		const id = element.id.toLowerCase();
		
		for (const indicator of contentIndicators) {
			if (className.includes(indicator) || id.includes(indicator)) {
				return true;
			}
		}

		// Check if the element has a high text density
		const text = element.textContent || '';
		const words = text.split(/\s+/).length;
		const paragraphs = element.getElementsByTagName('p').length;
		
		// If the element has a significant amount of text and paragraphs, it's likely content
		if (words > 50 && paragraphs > 1) {
			return true;
		}

		return false;
	}

	/**
	 * Scores a block element based on various criteria to determine if it's likely not content.
	 * Returns a negative score if the element is likely not content, a positive score if it is.
	 */
	private static scoreNonContentBlock(element: Element): number {
		let score = 0;

		// Get text content
		const text = element.textContent || '';
		const words = text.split(/\s+/).length;

		// Skip very small elements
		if (words < 3) {
			return 0;
		}

		for (const indicator of navigationIndicators) {
			if (text.toLowerCase().includes(indicator)) {
				score -= 10;
			}
		}

		// Check for high link density (navigation)
		const links = element.getElementsByTagName('a').length;
		const linkDensity = links / (words || 1);
		if (linkDensity > 0.5) {
			score -= 15;
		}

		// Check for list structure (navigation)
		const lists = element.getElementsByTagName('ul').length + element.getElementsByTagName('ol').length;
		if (lists > 0 && links > lists * 3) {
			score -= 10;
		}

		// Check for specific class patterns that indicate non-content
		const className = element.className.toLowerCase();
		const id = element.id.toLowerCase();

		for (const pattern of nonContentPatterns) {
			if (className.includes(pattern) || id.includes(pattern)) {
				score -= 8;
			}
		}

		// Check for elements with many child elements but little text (typical for navigation)
		// const childElements = element.children.length;
		// if (childElements > 5 && words < childElements * 3) {
		// 	score -= 12;
		// }

		// Check for elements with many divs but little text (typical for layout elements)
		// const divs = element.getElementsByTagName('div').length;
		// if (divs > 3 && words < divs * 2) {
		// 	score -= 10;
		// }

		return score;
	}
} 