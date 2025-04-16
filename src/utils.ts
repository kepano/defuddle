import { NODE_TYPE } from './constants';

// Type guard
export function isElement(node: Node): node is Element {
	return node.nodeType === NODE_TYPE.ELEMENT_NODE;
}

export function getComputedStyle(element: Element): CSSStyleDeclaration | null {
	const win = getWindow(element.ownerDocument);
	if (!win) return null;
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

export function logDebug(message: string, ...args: any[]): void {
	if (typeof window !== 'undefined' && (window as any).defuddleDebug) {
		console.log('Defuddle:', message, ...args);
	}
} 