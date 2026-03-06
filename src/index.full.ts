import { Defuddle as DefuddleBase } from './defuddle';
import { DefuddleOptions, DefuddleResponse } from './types';
import { toMarkdown, createMarkdownContent } from './markdown';

// Export types
export type { DefuddleOptions, DefuddleResponse };

// Export standalone markdown conversion
export { createMarkdownContent };

class Defuddle {
	private defuddle: DefuddleBase;
	private options: DefuddleOptions;

	constructor(doc: Document, options: DefuddleOptions = {}) {
		this.defuddle = new DefuddleBase(doc, options);
		this.options = options;
	}

	parse(): DefuddleResponse {
		const result = this.defuddle.parse();
		toMarkdown(result, this.options, this.options.url ?? '');
		return result;
	}

	async parseAsync(): Promise<DefuddleResponse> {
		const result = await this.defuddle.parseAsync();
		toMarkdown(result, this.options, this.options.url ?? '');
		return result;
	}
}

// Attach named exports as static properties for UMD/CJS consumers
(Defuddle as any).createMarkdownContent = createMarkdownContent;

// Export Defuddle as default
export default Defuddle;

// This file exists to ensure proper type generation for the full bundle
// The actual math module switching is handled by webpack's alias configuration
