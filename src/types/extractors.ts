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

export interface ExtractorResult {
	content: string;
	contentHtml: string;
	extractedContent?: {
		[key: string]: string;
	};
	variables?: {
		[key: string]: string;
	};
	extractorType?: string;
} 