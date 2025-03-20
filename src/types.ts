// Define the DefuddleMetadata interface
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

// Define the DefuddleResponse interface
export interface DefuddleResponse extends DefuddleMetadata {
	content: string;
	sections: string[];
}

// Define the DefuddleOptions interface
export interface DefuddleOptions {
	debug?: boolean;
	keepClasses?: boolean;
} 