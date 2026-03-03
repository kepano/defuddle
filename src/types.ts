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

export interface MetaTagItem {
	name?: string | null;
	property?: string | null;
	content: string | null;
}

export interface DefuddleResponse extends DefuddleMetadata {
	content: string;
	contentMarkdown?: string;
	extractorType?: string;
	metaTags?: MetaTagItem[];
}

export interface DefuddleOptions {
	/**
	 * Enable debug logging
	 * Defaults to false
	 */
	debug?: boolean;

	/**
	 * URL of the page being parsed
	 */
	url?: string;

	/**
	 * Convert output to Markdown
	 * Defaults to false
	 */
	markdown?: boolean;

	/**
	 * Include Markdown in the response
	 * Defaults to false
	 */
	separateMarkdown?: boolean;

	/**
	 * Remove elements matching exact selectors like ads, social buttons, etc
	 * Defaults to true
	 */
	removeExactSelectors?: boolean;

	/**
	 * Remove elements matching partial selectors like ads, social buttons, etc
	 * Defaults to true
	 */
	removePartialSelectors?: boolean;

	/**
	 * Remove images
	 * Defaults to false
	 */
	removeImages?: boolean;

	/**
	 * Allow async extractors to fetch content from third-party APIs
	 * when no content can be extracted from the local HTML.
	 * Defaults to true
	 */
	useAsync?: boolean;
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
