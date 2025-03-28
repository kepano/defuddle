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
} 