import { ExtractorResult, ExtractorVariables, ExtractedContent } from '../types/extractors';

export interface ExtractorOptions {
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