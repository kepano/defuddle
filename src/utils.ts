const NODE_TYPE = {
	ELEMENT_NODE: 1,
	ATTRIBUTE_NODE: 2,
	TEXT_NODE: 3,
	CDATA_SECTION_NODE: 4,
	ENTITY_REFERENCE_NODE: 5,
	ENTITY_NODE: 6,
	PROCESSING_INSTRUCTION_NODE: 7,
	COMMENT_NODE: 8,
	DOCUMENT_NODE: 9,
	DOCUMENT_TYPE_NODE: 10,
	DOCUMENT_FRAGMENT_NODE: 11,
	NOTATION_NODE: 12
};

export function isElement(node: Node): node is Element {
	return node.nodeType === NODE_TYPE.ELEMENT_NODE;
}

export function isTextNode(node: Node): node is Text {
	return node.nodeType === NODE_TYPE.TEXT_NODE;
}

export function isCommentNode(node: Node): node is Comment {
	return node.nodeType === NODE_TYPE.COMMENT_NODE;
}

// Uses closest('svg') as fallback since linkedom may not set namespaceURI correctly
export function isSVGElement(el: Element): boolean {
	return el.closest?.('svg') !== null || el.namespaceURI === 'http://www.w3.org/2000/svg';
}

export function getComputedStyle(element: Element): CSSStyleDeclaration | null {
	const win = getWindow(element.ownerDocument);
	if (!win || typeof win.getComputedStyle !== 'function') return null;
	return win.getComputedStyle(element);
}

export function getWindow(doc: Document): Window | null {
	// First try defaultView
	if (doc.defaultView) {
		return doc.defaultView;
	}
	
	// Then try ownerWindow
	if ((doc as any).ownerWindow) {
		return (doc as any).ownerWindow;
	}
	
	// Finally try to get window from document
	if ((doc as any).window) {
		return (doc as any).window;
	}
	
	return null;
}

export function textPreview(el: Element): string {
	return (el.textContent || '').trim().substring(0, 200);
}

export function logDebug(debug: boolean, message: string, ...args: any[]): void {
	if (debug) {
		console.log('Defuddle:', message, ...args);
	}
}

// CJK character ranges for use in regex character classes (BMP only)
export const CJK_CHAR_RANGES = '\\u3040-\\u309f\\u30a0-\\u30ff\\u3400-\\u4dbf\\u4e00-\\u9fff\\uf900-\\ufaff\\uac00-\\ud7af';

/**
 * Count words in text, handling CJK characters (Chinese, Japanese, Korean).
 * CJK characters are counted individually since they don't use spaces between words.
 * Non-CJK text is counted by splitting on whitespace.
 */
export function countWords(text: string): number {
	if (!text) return 0;

	let cjkCount = 0;
	let wordCount = 0;
	let inWord = false;

	for (let i = 0; i < text.length; i++) {
		const code = text.charCodeAt(i);

		// Check for CJK character ranges (BMP only — Extension B+ are
		// surrogate pairs and would need codePointAt, rare in practice)
		if (
			(code >= 0x3040 && code <= 0x309f) || // Hiragana
			(code >= 0x30a0 && code <= 0x30ff) || // Katakana
			(code >= 0x3400 && code <= 0x4dbf) || // CJK Extension A
			(code >= 0x4e00 && code <= 0x9fff) || // CJK Unified Ideographs
			(code >= 0xf900 && code <= 0xfaff) || // CJK Compatibility Ideographs
			(code >= 0xac00 && code <= 0xd7af)    // Korean Hangul
		) {
			cjkCount++;
			inWord = false;
		} else if (code <= 32) {
			inWord = false;
		} else if (!inWord) {
			wordCount++;
			inWord = true;
		}
	}

	return cjkCount + wordCount;
}
