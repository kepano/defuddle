import { Defuddle } from './defuddle';
import { DefuddleOptions, DefuddleResponse } from './types';
import { createMarkdownContent } from './markdown';

/**
 * Defuddle with markdown support enabled by default
 * This export includes turndown and enables separateMarkdown by default
 */
export default class DefuddleWithMarkdown extends Defuddle {
  constructor(doc: Document, options: DefuddleOptions = {}) {
    // Enable separateMarkdown by default if not explicitly set
    const markdownOptions: DefuddleOptions = {
      ...options,
      separateMarkdown: options.separateMarkdown ?? true,
      markdownProcessor: options.markdownProcessor ?? createMarkdownContent
    };
    super(doc, markdownOptions);
  }
}

// Re-export types
export type { DefuddleOptions, DefuddleResponse };