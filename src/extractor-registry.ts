import { BaseExtractor, ExtractorOptions } from './extractors/_base';

// Extractors
import { RedditExtractor } from './extractors/reddit';
import { TwitterExtractor } from './extractors/twitter';
import { XArticleExtractor } from './extractors/x-article';
import { YoutubeExtractor } from './extractors/youtube';
import { HackerNewsExtractor } from './extractors/hackernews';
import { ChatGPTExtractor } from './extractors/chatgpt';
import { ClaudeExtractor } from './extractors/claude';
import { GrokExtractor } from './extractors/grok';
import { GeminiExtractor } from './extractors/gemini';
import { GitHubExtractor } from './extractors/github';
import { XOembedExtractor } from './extractors/x-oembed';
import { BbcodeDataExtractor } from './extractors/bbcode-data';
import { C2WikiExtractor } from './extractors/c2-wiki';
import { SubstackExtractor } from './extractors/substack';

type ExtractorConstructor = new (document: Document, url: string, schemaOrgData?: any, options?: ExtractorOptions) => BaseExtractor;

interface ExtractorMapping {
	patterns: (string | RegExp)[];
	extractor: ExtractorConstructor;
}

export class ExtractorRegistry {
	private static mappings: ExtractorMapping[] = [];

	static initialize() {
		// Register all extractors with their URL patterns
		// X Article extractor must be registered BEFORE Twitter to take priority
		// DOM-based canExtract() determines if page has article content
		this.register({
			patterns: [
				'x.com',
				'twitter.com',
			],
			extractor: XArticleExtractor
		});

		this.register({
			patterns: [
				'twitter.com',
				/\/x\.com\/.*/,
			],
			extractor: TwitterExtractor
		});

		this.register({
			patterns: [
				'x.com',
				'twitter.com',
			],
			extractor: XOembedExtractor
		});

		this.register({
			patterns: [
				'reddit.com',
				'old.reddit.com',
				'new.reddit.com',
				/^https:\/\/[^\/]+\.reddit\.com/
			],
			extractor: RedditExtractor
		});

		this.register({
			patterns: [
				'youtube.com',
				'youtu.be',
				/youtube\.com\/watch\?v=.*/,
				/youtu\.be\/.*/
			],
			extractor: YoutubeExtractor
		});

		this.register({
			patterns: [
				/news\.ycombinator\.com\/item\?id=.*/
			],
			extractor: HackerNewsExtractor
		});

		this.register({
			patterns: [
				/^https?:\/\/chatgpt\.com\/(c|share)\/.*/
			],
			extractor: ChatGPTExtractor
		});

		this.register({
			patterns: [
				'claude.ai',
				/^https?:\/\/claude\.ai\/(chat|share)\/.*/
			],
			extractor: ClaudeExtractor
		});

		this.register({
			patterns: [
				/^https?:\/\/grok\.com\/(chat|share)(\/.*)?$/
			],
			extractor: GrokExtractor,
		});

		this.register({
			patterns: [
				/^https?:\/\/gemini\.google\.com\/app\/.*/
			],
			extractor: GeminiExtractor
		});

		this.register({
			patterns: [
				'github.com',
				/^https?:\/\/github\.com\/.*/
			],
			extractor: GitHubExtractor
		});

		this.register({
			patterns: [
				'wiki.c2.com',
			],
			extractor: C2WikiExtractor
		});

		this.register({
			patterns: [
				/^https?:\/\/substack\.com\/@[^/]+\/note\/.+/,
				/^https?:\/\/substack\.com\/home\/post\/p-\d+/,
				'substack.com',
			],
			extractor: SubstackExtractor
		});

		this.register({
			patterns: [/.*/],
			extractor: BbcodeDataExtractor
		});
	}

	static register(mapping: ExtractorMapping) {
		this.mappings.push(mapping);
	}

	static findExtractor(document: Document, url: string, schemaOrgData?: any, options?: ExtractorOptions): BaseExtractor | null {
		return this.findByPredicate(document, url, schemaOrgData, e => e.canExtract(), options);
	}

	static findAsyncExtractor(document: Document, url: string, schemaOrgData?: any, options?: ExtractorOptions): BaseExtractor | null {
		return this.findByPredicate(document, url, schemaOrgData, e => e.canExtractAsync(), options);
	}

	static findPreferredAsyncExtractor(document: Document, url: string, schemaOrgData?: any, options?: ExtractorOptions): BaseExtractor | null {
		return this.findByPredicate(document, url, schemaOrgData, e => e.canExtractAsync() && e.prefersAsync(), options);
	}

	private static findByPredicate(
		document: Document, url: string, schemaOrgData: any | undefined,
		predicate: (instance: BaseExtractor) => boolean,
		options?: ExtractorOptions
	): BaseExtractor | null {
		try {
			const domain = new URL(url).hostname;

			for (const { patterns, extractor } of this.mappings) {
				const matches = patterns.some(pattern => {
					if (pattern instanceof RegExp) {
						return pattern.test(url);
					}
					return domain.includes(pattern);
				});

				if (matches) {
					const instance = new extractor(document, url, schemaOrgData, options);
					if (predicate(instance)) {
						return instance;
					}
				}
			}

			return null;

		} catch (error) {
			console.error('Error finding extractor:', error);
			return null;
		}
	}
}

// Initialize extractors
ExtractorRegistry.initialize();
