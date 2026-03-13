import DefuddleClass from './index';
import type { DefuddleOptions, DefuddleResponse } from './types';
import { toMarkdown } from './markdown';

/**
 * Parse a Document using any DOM implementation (JSDOM, linkedom, happy-dom, etc.)
 * @param doc Document instance to parse
 * @param url URL of the page being parsed
 * @param options Optional parsing options
 * @returns Promise with parsed content and metadata
 */
export async function Defuddle(
	doc: Document,
	url?: string,
	options?: DefuddleOptions
): Promise<DefuddleResponse> {
	const pageUrl = url || (doc as any).URL || 'about:blank';

	const defuddle = new DefuddleClass(doc, {
		...options,
		url: pageUrl
	});

	const result = await defuddle.parseAsync();

	toMarkdown(result, options ?? {}, pageUrl);

	return result;
}

export { DefuddleClass, DefuddleOptions, DefuddleResponse };
