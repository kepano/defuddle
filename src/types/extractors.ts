export interface ConversationMessage {
	author: string;
	content: string;
	timestamp?: string;
	metadata?: {
		role: string;
		[key: string]: string;
	};
}

export interface ConversationMetadata {
	title: string;
	site: string;
	url: string;
	messageCount: number;
	description?: string;
}

export interface Footnote {
	url: string;
	text: string;
}

export interface ExtractorResult {
	content: string;
	contentHtml: string;
	contentSelector?: string;
	extractedContent?: {
		[key: string]: string;
	};
	variables?: {
		[key: string]: string;
	};
} 