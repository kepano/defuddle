import { JSDOM, VirtualConsole } from 'jsdom';
import { Defuddle } from './defuddle';
import { DefuddleOptions, DefuddleResponse } from './types';

/**
 * Parse HTML content in a Node.js environment using JSDOM
 * @param html - The HTML string to parse
 * @param url - Optional URL to help resolve relative URLs
 * @param options - Options for parsing
 * @returns The parsed content and metadata
 */
export async function parse(html: string, url?: string, options?: DefuddleOptions): Promise<DefuddleResponse> {
	const virtualConsole = new VirtualConsole();
	virtualConsole.on('error', () => {
		// Suppress JSDOM errors
	});

	const dom = new JSDOM(html, {
		url,
		virtualConsole,
		runScripts: 'outside-only',
		resources: 'usable',
		pretendToBeVisual: true,
		beforeParse(window) {
			// Add any necessary polyfills or window modifications here
		}
	});

	const doc = dom.window.document;
	const defuddle = new Defuddle(doc, options);
	return defuddle.parse();
}

export { Defuddle, DefuddleOptions, DefuddleResponse }; 