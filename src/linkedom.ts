import { parseHTML } from 'linkedom';
import DefuddleClass from './index';
import type { DefuddleOptions, DefuddleResponse } from './types';
import { toMarkdown } from './markdown';

/**
 * Parse HTML content using linkedom
 * @param html HTML string to parse
 * @param url Optional URL of the page being parsed
 * @param options Optional parsing options
 * @returns Promise with parsed content and metadata
 */
export async function Defuddle(
	html: string,
	url?: string,
	options?: DefuddleOptions
): Promise<DefuddleResponse> {
	const { document } = parseHTML(html);

	// linkedom doesn't implement styleSheets, getComputedStyle, or document.URL.
	// Stub them so defuddle's internals proceed without throwing.
	const doc = document as any;
	if (!doc.styleSheets) doc.styleSheets = [];
	if (doc.defaultView && !doc.defaultView.getComputedStyle) {
		doc.defaultView.getComputedStyle = () => ({ display: '' });
	}
	// Fall back to "about:blank" so new URL(document.URL) never throws inside
	// the extractor registry when no URL is provided by the caller.
	const pageUrl = url || 'about:blank';
	if (!doc.URL) doc.URL = pageUrl;

	const defuddle = new DefuddleClass(document as unknown as Document, {
		...options,
		url: pageUrl,
	});

	const result = await defuddle.parseAsync();
	toMarkdown(result, options ?? {}, pageUrl);
	return result;
}

export { DefuddleClass, DefuddleOptions, DefuddleResponse };
