import { JSDOM, VirtualConsole } from 'jsdom';
import DefuddleClass from './index';
import type { DefuddleOptions, DefuddleResponse } from './types';
import { createMarkdownContent } from './markdown';

/**
 * Parse HTML content using JSDOM
 * @param htmlOrDom HTML string or JSDOM instance to parse
 * @param url Optional URL of the page being parsed
 * @param options Optional parsing options
 * @returns Promise with parsed content and metadata
 */
export async function Defuddle(
	htmlOrDom: string | JSDOM,
	url?: string,
	options?: DefuddleOptions
): Promise<DefuddleResponse> {
	
	let dom: JSDOM;
	
	if (typeof htmlOrDom === 'string') {
		dom = new JSDOM(htmlOrDom, {
			url,
//			runScripts: 'outside-only',
			resources: 'usable',
			pretendToBeVisual: true,
			includeNodeLocations: true,
			storageQuota: 10000000,
			// Add virtual console to suppress warnings
			virtualConsole: new VirtualConsole().sendTo(console, { omitJSDOMErrors: true })
		});
	} else {
		dom = htmlOrDom;
	}

	const pageUrl = url || dom.window.location.href;

	// Create Defuddle instance with URL in options
	const defuddle = new DefuddleClass(dom.window.document, {
		...options,
		url: pageUrl
	});

	const result = defuddle.parse();

	// Convert to markdown if requested
	if (options?.markdown) {
		result.content = createMarkdownContent(result.content, pageUrl);
	} else if (options?.separateMarkdown) {
		result.contentMarkdown = createMarkdownContent(result.content, pageUrl);
	}

	return result;
}

export { DefuddleClass, DefuddleOptions, DefuddleResponse }; 
