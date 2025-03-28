export interface DefuddleMetadata {
	title: string;
	description: string;
	domain: string;
	favicon: string;
	image: string;
	parseTime: number;
	published: string;
	author: string;
	site: string;
	schemaOrgData: any;
	wordCount: number;
}

export interface DefuddleResponse extends DefuddleMetadata {
	content: string;
	extractorType?: string;
}

export interface DefuddleOptions {
	debug?: boolean;
	keepClasses?: boolean;
	url?: string;
}

export interface ExtractorVariables {
	[key: string]: string;
}

export interface ExtractedContent {
	title?: string;
	author?: string;
	published?: string;
	content?: string;
	contentHtml?: string;
	variables?: ExtractorVariables;
} 