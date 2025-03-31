import { JSDOM, VirtualConsole } from 'jsdom';
import Defuddle from './index';
import type { DefuddleOptions, DefuddleResponse } from './types';

/**
 * Parse HTML content using JSDOM
 * @param htmlOrDom HTML string or JSDOM instance to parse
 * @param url Optional URL of the page being parsed
 * @param options Optional parsing options
 * @returns Promise with parsed content and metadata
 */
export async function parseHTML(
	htmlOrDom: string | JSDOM,
	url?: string,
	options?: DefuddleOptions
): Promise<DefuddleResponse> {
	
	let dom: JSDOM;
	
	if (typeof htmlOrDom === 'string') {
		dom = new JSDOM(htmlOrDom, {
			url,
			runScripts: 'outside-only',
			resources: 'usable',
			pretendToBeVisual: true,
			includeNodeLocations: true,
			storageQuota: 10000000,
			// Add virtual console to suppress warnings
			virtualConsole: new VirtualConsole().sendTo(console, { omitJSDOMErrors: true }),
			
			// Configure window properties
			beforeParse(window) {
				// Ensure NodeFilter is available
				(window as any).NodeFilter = {
					SHOW_ALL: 4294967295,
					SHOW_ELEMENT: 1,
					SHOW_ATTRIBUTE: 2,
					SHOW_TEXT: 4,
					SHOW_CDATA_SECTION: 8,
					SHOW_ENTITY_REFERENCE: 16,
					SHOW_ENTITY: 32,
					SHOW_PROCESSING_INSTRUCTION: 64,
					SHOW_COMMENT: 128,
					SHOW_DOCUMENT: 256,
					SHOW_DOCUMENT_TYPE: 512,
					SHOW_DOCUMENT_FRAGMENT: 1024,
					SHOW_NOTATION: 2048,
					FILTER_ACCEPT: 1,
					FILTER_REJECT: 2,
					FILTER_SKIP: 3
				};
			}
		});
	} else {
		dom = htmlOrDom;
	}

	// Create Defuddle instance with URL in options
	const defuddle = new Defuddle(dom.window.document, {
		...options,
		url: url || dom.window.location.href,
		debug: true // Force debug mode to see what's happening
	});

	const result = defuddle.parse();
	return result;
}

export { Defuddle, DefuddleOptions, DefuddleResponse }; 