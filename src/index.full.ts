import { Defuddle as BaseDefuddle } from './defuddle';
import { createMarkdownContent } from './markdown';
import { DefuddleOptions, DefuddleResponse } from './types';

// Export types
export type { DefuddleOptions, DefuddleResponse };

export class Defuddle extends BaseDefuddle {
	constructor(document: Document, options: DefuddleOptions = {}) {
		super(document, options);
	}

	parse(): DefuddleResponse {
		const result = super.parse();

		if (this.options.markdown) {
			result.content = createMarkdownContent(result.content, this.options.url ?? '');
		} else if (this.options.separateMarkdown) {
			result.contentMarkdown = createMarkdownContent(
				result.content,
				this.options.url ?? ''
			);
		}

		return result;
	}
}

// Export Defuddle (full bundle) as default, with markdown support enabled.
export default Defuddle;

// This file exists to ensure proper type generation for the full bundle
// The actual math module switching is handled by webpack's alias configuration 
