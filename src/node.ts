import { JSDOM } from 'jsdom';
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
	console.log('Starting parseHTML with:', { url, options });
	
	let dom: JSDOM;
	
	if (typeof htmlOrDom === 'string') {
		console.log('Creating new JSDOM instance from string');
		// Create a new JSDOM instance with proper configuration
		dom = new JSDOM(htmlOrDom, {
			url,
			runScripts: 'outside-only',
			resources: 'usable',
			pretendToBeVisual: true,
			// Ensure proper window setup
			includeNodeLocations: true,
			storageQuota: 10000000
		});
	} else {
		console.log('Using provided JSDOM instance');
		dom = htmlOrDom;
	}

	console.log('Document ready, creating Defuddle instance');
	console.log('Window properties:', Object.keys(dom.window));
	console.log('Image class:', dom.window.Image);
	console.log('HTMLImageElement:', dom.window.HTMLImageElement);

	// Create Defuddle instance with URL in options
	const defuddle = new Defuddle(dom.window.document, {
		...options,
		url: url || dom.window.location.href,
		debug: true // Force debug mode to see what's happening
	});
	
	console.log('Starting parse');
	const result = defuddle.parse();
	console.log('Parse complete, returning result');
	return result;
}

export { Defuddle, DefuddleOptions, DefuddleResponse }; 