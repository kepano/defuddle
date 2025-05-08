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
	contentMarkdown?: string;
	extractorType?: string;
}

export interface DefuddleOptions {
	/**
	 * Enable debug logging
	 */
	debug?: boolean;

	/**
	 * URL of the page being parsed
	 */
	url?: string;

	/**
	 * Convert output to Markdown
	 */
	markdown?: boolean;

	/**
	 * Include Markdown in the response
	 */
	separateMarkdown?: boolean;

	/**
	 * Whether to remove elements matching exact selectors like ads, social buttons, etc.
	 * Defaults to true.
	 */
	removeExactSelectors?: boolean;

	/**
	 * Whether to remove elements matching partial selectors like ads, social buttons, etc.
	 * Defaults to true.
	 */
	removePartialSelectors?: boolean;
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
