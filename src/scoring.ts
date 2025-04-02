import { FOOTNOTE_INLINE_REFERENCES } from './constants';

export interface ContentScore {
	score: number;
	element: Element;
}

export class ContentScorer {
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
} 