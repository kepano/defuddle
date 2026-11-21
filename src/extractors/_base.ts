import { ExtractorResult } from '../types/extractors';
import { parseHTML } from '../utils/dom';

export interface ExtractorOptions {
	contentSelector?: string;
	includeReplies?: boolean | 'extractors';
	language?: string;
	fetch?: typeof globalThis.fetch;
}

export abstract class BaseExtractor {
	protected document: Document;
	protected url: string;
	protected schemaOrgData?: any;
	protected options: ExtractorOptions;

	constructor(document: Document, url: string, schemaOrgData?: any, options?: ExtractorOptions) {
		this.document = document;
		this.url = url;
		this.schemaOrgData = schemaOrgData;
		this.options = options || {};
	}

	protected get fetch(): typeof globalThis.fetch {
		const fn = this.options.fetch || globalThis.fetch;
		return fn.bind(globalThis);
	}

	abstract canExtract(): boolean;
	abstract extract(): ExtractorResult;

	/**
	 * Change Defuddle's copy of the page before the standard pipeline reads a
	 * returned contentSelector. Do DOM changes here, never on this.document,
	 * which can be the live page the user sees.
	 */
	prepareDocument(doc: Document): void {}

	/** Append rendered HTML to the copy, inside a wrapper a contentSelector can find. */
	protected appendWrapper(doc: Document, attr: string, html: string): void {
		if (!html || !doc.body) return;
		const wrapper = doc.createElement('div');
		wrapper.setAttribute(attr, '');
		wrapper.appendChild(parseHTML(doc, html));
		doc.body.appendChild(wrapper);
	}

	/**
	 * Generate a title from the post description text, falling back to
	 * "Post by {author}" if the description is empty.
	 */
	protected postTitle(author: string, site: string): string {
		return `Post by ${author} on ${site}`;
	}

	canExtractAsync(): boolean {
		return false;
	}

	/**
	 * When true, parseAsync() will prefer extractAsync() over extract(),
	 * even if sync extraction produces content. Use this when the async
	 * path provides strictly better results (e.g. YouTube transcripts).
	 */
	prefersAsync(): boolean {
		return false;
	}

	async extractAsync(): Promise<ExtractorResult> {
		return this.extract();
	}
}
