import { ExtractorResult, ExtractorVariables, ExtractedContent } from '../types/extractors';

export abstract class BaseExtractor {
	protected document: Document;
	protected url: string;
	protected schemaOrgData?: any;

	constructor(document: Document, url: string, schemaOrgData?: any) {
		this.document = document;
		this.url = url;
		this.schemaOrgData = schemaOrgData;
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