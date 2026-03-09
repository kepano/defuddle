export interface DefuddleMetadata {
	title: string;
	description: string;
	domain: string;
	favicon: string;
	image: string;
	language: string;
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

export interface DebugRemoval {
	step: string;
	selector?: string;
	reason?: string;
	text: string;
}

export interface DebugInfo {
	contentSelector: string;
	removals: DebugRemoval[];
}

export interface DefuddleResponse extends DefuddleMetadata {
	content: string;
	contentMarkdown?: string;
	extractorType?: string;
	metaTags?: MetaTagItem[];
	debug?: DebugInfo;
	variables?: { [key: string]: string };
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

	/**
	 * Toggle hidden element removal
	 * Defaults to true
	 */
	removeHiddenElements?: boolean;

	/**
	 * Toggle content scoring/removal
	 * Defaults to true
	 */
	removeLowScoring?: boolean;

	/**
	 * Toggle small image removal
	 * Defaults to true
	 */
	removeSmallImages?: boolean;

	/**
	 * Toggle HTML standardization (footnotes, headings, code blocks, etc.)
	 * Defaults to true
	 */
	standardize?: boolean;

	/**
	 * Toggle content-based pattern removal (read time, boilerplate, article cards)
	 * Defaults to true
	 */
	removeContentPatterns?: boolean;

	/**
	 * CSS selector to use as main content element, bypassing auto-detection
	 */
	contentSelector?: string;
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
