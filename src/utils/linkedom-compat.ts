import { parseHTML } from 'linkedom';

/**
 * Parse HTML with linkedom and apply polyfills for missing DOM APIs
 * (styleSheets, getComputedStyle) that defuddle's internals expect.
 */
export function parseLinkedomHTML(html: string, url?: string): Document {
	const { document } = parseHTML(html);
	const doc = document as any;
	if (!doc.styleSheets) doc.styleSheets = [];
	if (doc.defaultView && !doc.defaultView.getComputedStyle) {
		doc.defaultView.getComputedStyle = () => ({ display: '' });
	}
	// document.URL is read-only per spec, but linkedom allows mutation.
	// This sets the base URL for relative URL resolution and extractor matching.
	if (url) doc.URL = url;
	return document as unknown as Document;
}

