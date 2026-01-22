import { BaseExtractor } from './extractors/_base';

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

type ExtractorConstructor = new (document: Document, url: string, schemaOrgData?: any) => BaseExtractor;

interface ExtractorMapping {
	patterns: (string | RegExp)[];
	extractor: ExtractorConstructor;
}

export class ExtractorRegistry {
	private static mappings: ExtractorMapping[] = [];
	private static domainCache: Map<string, ExtractorConstructor | null> = new Map();

	static initialize() {
		// Register all extractors with their URL patterns
		// X Article extractor must be registered BEFORE Twitter to take priority
		// DOM-based canExtract() determines if page has article content
		this.register({
			patterns: [
				/x\.com.*article/,  // matches real URLs and test fixture names
				/x\.com\/[^/]+\/status\/\d+/,  // matches /status/ URLs
				/twitter\.com.*article/,
				/twitter\.com\/[^/]+\/status\/\d+/,
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
	}

	static register(mapping: ExtractorMapping) {
		this.mappings.push(mapping);
	}

	static findExtractor(document: Document, url: string, schemaOrgData?: any): BaseExtractor | null {
		try {
			const domain = new URL(url).hostname;

			// Check cache first - but verify the cached extractor can handle this content
			if (this.domainCache.has(domain)) {
				const cachedExtractor = this.domainCache.get(domain);
				if (cachedExtractor) {
					const instance = new cachedExtractor(document, url, schemaOrgData);
					if (instance.canExtract()) {
						return instance;
					}
					// cached extractor can't handle this page - clear cache and search
					this.domainCache.delete(domain);
				} else {
					return null;
				}
			}

			// Find matching extractor that can actually extract this content
			for (const { patterns, extractor } of this.mappings) {
				const matches = patterns.some(pattern => {
					if (pattern instanceof RegExp) {
						return pattern.test(url);
					}
					return domain.includes(pattern);
				});

				if (matches) {
					const instance = new extractor(document, url, schemaOrgData);
					// only use if extractor can handle this specific content
					if (instance.canExtract()) {
						this.domainCache.set(domain, extractor);
						return instance;
					}
					// URL matched but content doesn't - try next extractor
				}
			}

			// no extractor found - don't cache null since other page types may have extractors
			return null;

		} catch (error) {
			console.error('Error in findExtractor:', error);
			return null;
		}
	}

	static clearCache() {
		this.domainCache.clear();
	}
}

// Initialize extractors
ExtractorRegistry.initialize();
