import { BaseExtractor } from './_base';
import { ExtractorResult } from '../types/extractors';
import { parseHTML, serializeHTML, escapeHtml } from '../utils/dom';

interface OembedResponse {
	html: string;
	author_name: string;
	author_url: string;
	provider_name: string;
}

interface FxTwitterMediaItem {
	type: string;
	id: string;
	url: string;
	width: number;
	height: number;
}

interface FxTwitterFacet {
	type: string;
	indices: [number, number];
	id?: string;
	display?: string;
	original?: string;
	replacement?: string;
	text?: string;
}

interface FxTwitterResponse {
	code: number;
	tweet: {
		text: string;
		raw_text?: {
			text: string;
			facets: FxTwitterFacet[];
		};
		author: {
			name: string;
			screen_name: string;
		};
		created_at?: string;
		media?: {
			all?: FxTwitterMediaItem[];
			photos?: FxTwitterMediaItem[];
		};
		article?: {
			title: string;
			preview_text: string;
			created_at?: string;
			cover_media?: {
				media_info?: {
					original_img_url?: string;
				};
			};
			content: {
				blocks: DraftBlock[];
				entityMap: DraftEntityMapEntry[];
			};
			media_entities?: FxTwitterArticleMediaEntity[];
		};
	};
}

interface FxTwitterArticleMediaEntity {
	media_id: string;
	media_info: {
		__typename: string;
		original_img_url?: string;
		original_img_width?: number;
		original_img_height?: number;
		preview_image?: {
			original_img_url?: string;
		};
		variants?: {
			bit_rate?: number;
			content_type: string;
			url: string;
		}[];
	};
}

interface DraftBlock {
	key: string;
	text: string;
	type: string;
	inlineStyleRanges: { offset: number; length: number; style: string }[];
	entityRanges: { key: number; offset: number; length: number }[];
	data: {
		mentions?: { fromIndex: number; toIndex: number; text: string }[];
		urls?: { fromIndex: number; toIndex: number; text: string }[];
	};
}

interface DraftEntityMapEntry {
	key: string;
	value: {
		type: string;
		mutability: string;
		data: {
			url?: string;
			caption?: string;
			markdown?: string;
			mediaItems?: { mediaId: string }[];
		};
	};
}

interface Marker {
	offset: number;
	type: 'open' | 'close';
	tag: string;
}

export class XOembedExtractor extends BaseExtractor {
	canExtract(): boolean {
		return false;
	}

	extract(): ExtractorResult {
		return {
			content: '',
			contentHtml: '',
		};
	}

	canExtractAsync(): boolean {
		return /\/(status|article)\/\d+/.test(this.url);
	}

	async extractAsync(): Promise<ExtractorResult> {
		// Try FxTwitter first — it has full tweet text and media
		const fxResult = await this.tryExtractFxTwitter();
		if (fxResult) {
			return fxResult;
		}

		// Fall back to oEmbed (truncates long tweets but always available)
		return this.extractOembed();
	}

	private async extractOembed(): Promise<ExtractorResult> {
		const oembedUrl = `https://publish.twitter.com/oembed?url=${encodeURIComponent(this.url)}&omit_script=true`;
		const response = await this.fetch(oembedUrl);

		if (!response.ok) {
			throw new Error(`oEmbed request failed: ${response.status}`);
		}

		const data: OembedResponse = await response.json();

		// Parse the oEmbed HTML to extract tweet text
		const div = this.document.createElement('div');
		div.appendChild(parseHTML(this.document, data.html));

		// The oEmbed HTML contains a <blockquote> with <p> tags for text
		// and an <a> tag for the date
		const blockquote = div.querySelector('blockquote');
		const paragraphs = blockquote?.querySelectorAll('p') || [];
		const tweetText = Array.from(paragraphs)
			.map(p => `<p>${serializeHTML(p)}</p>`)
			.join('\n');

		const handle = data.author_url
			? `@${data.author_url.split('/').pop()}`
			: '';

		const dateLink = blockquote?.querySelector('a:last-child');
		const dateText = dateLink?.textContent?.trim() || '';
		const permalink = dateLink?.getAttribute('href') || this.url;

		const escapedAuthorName = escapeHtml(data.author_name);
		const escapedHandle = escapeHtml(handle);
		const escapedDateText = escapeHtml(dateText);
		const escapedPermalink = escapeHtml(permalink);

		const contentHtml = `
			<div class="tweet-thread">
				<div class="main-tweet">
					<div class="tweet">
						<div class="tweet-header">
							<span class="tweet-author"><strong>${escapedAuthorName}</strong> <span class="tweet-handle">${escapedHandle}</span></span>
							${dateText ? `<a href="${escapedPermalink}" class="tweet-date">${escapedDateText}</a>` : ''}
						</div>
						${tweetText ? `<div class="tweet-text">${tweetText}</div>` : ''}
					</div>
				</div>
			</div>
		`.trim();

		return {
			content: contentHtml,
			contentHtml: contentHtml,
			variables: {
				title: `Post by ${handle || data.author_name}`,
				author: handle || data.author_name,
				site: 'X (Twitter)',
			}
		};
	}

	private async tryExtractFxTwitter(): Promise<ExtractorResult | null> {
		const match = this.url.match(/\/([a-zA-Z0-9_][a-zA-Z0-9_]{0,14})\/(status|article)\/(\d+)/);
		if (!match) return null;

		try {
			const data = await this.fetchFxTwitter(match[1], match[3]);
			// If it's an article, use the rich article renderer
			if (data.tweet?.article) {
				return this.buildArticleResult(data);
			}
			// Otherwise use the full tweet text from FxTwitter
			if (data.tweet?.text) {
				return this.buildTweetResult(data);
			}
			return null;
		} catch {
			return null;
		}
	}

	private async fetchFxTwitter(username: string, id: string): Promise<FxTwitterResponse> {
		const apiUrl = `https://api.fxtwitter.com/${username}/status/${id}`;
		const response = await this.fetch(apiUrl, {
			headers: {
				'User-Agent': 'Mozilla/5.0 (compatible; Defuddle/1.0; +https://defuddle.md)',
			},
		});

		if (!response.ok) {
			throw new Error(`FxTwitter API request failed: ${response.status}`);
		}

		return response.json();
	}

	private toDateString(dateStr?: string): string | undefined {
		if (!dateStr) return undefined;
		try {
			return new Date(dateStr).toISOString().split('T')[0];
		} catch {
			return undefined;
		}
	}

	private buildArticleResult(data: FxTwitterResponse): ExtractorResult {
		const article = data.tweet.article!;
		const { blocks, entityMap } = article.content;
		const mediaEntities = article.media_entities || [];
		const contentHtml = this.renderArticle(blocks, entityMap, article.cover_media, mediaEntities);
		const handle = `@${data.tweet.author.screen_name}`;
		const published = this.toDateString(article.created_at) ?? this.toDateString(data.tweet.created_at);

		return {
			content: contentHtml,
			contentHtml,
			variables: {
				title: article.title,
				author: handle,
				site: 'X (Twitter)',
				description: article.preview_text,
				...(published && { published }),
			}
		};
	}

	private buildTweetResult(data: FxTwitterResponse): ExtractorResult {
		const tweet = data.tweet;
		const handle = `@${tweet.author.screen_name}`;
		const contentHtml = this.renderTweet(tweet);
		const published = this.toDateString(tweet.created_at);

		return {
			content: contentHtml,
			contentHtml,
			variables: {
				title: `Post by ${handle}`,
				author: handle,
				site: 'X (Twitter)',
				...(published && { published }),
			}
		};
	}

	private renderTweet(tweet: FxTwitterResponse['tweet']): string {
		const text = tweet.raw_text?.text || tweet.text;
		// Filter out media facets — FxTwitter already strips pic.twitter.com
		// links from the text, so media facet indices are stale
		const facets = (tweet.raw_text?.facets || []).filter(f => f.type !== 'media');

		// Split text into paragraphs on double newlines
		const paragraphs = text.split(/\n\n+/);
		let offset = 0;
		const htmlParts: string[] = [];

		for (const para of paragraphs) {
			const paraStart = text.indexOf(para, offset);
			const paraEnd = paraStart + para.length;
			offset = paraEnd;

			// Check if this paragraph is a blockquote (starts with >)
			const isBlockquote = para.trimStart().startsWith('>');
			let paraText = isBlockquote ? para.trimStart().slice(1).trimStart() : para;
			const paraTextStart = isBlockquote
				? paraStart + (para.length - para.trimStart().length) + 1 + (para.trimStart().slice(1).length - para.trimStart().slice(1).trimStart().length)
				: paraStart;

			// Apply facets within this paragraph
			const rendered = this.applyFacets(paraText, paraTextStart, paraEnd, facets);

			// Handle line breaks within paragraph
			const withBreaks = rendered.replace(/\n/g, '<br>');

			if (isBlockquote) {
				htmlParts.push(`<blockquote><p>${withBreaks}</p></blockquote>`);
			} else if (withBreaks.trim()) {
				htmlParts.push(`<p>${withBreaks}</p>`);
			}
		}

		// Append media images
		if (tweet.media?.photos) {
			for (const photo of tweet.media.photos) {
				htmlParts.push(`<img src="${escapeHtml(photo.url)}" alt="">`);
			}
		}

		const handle = escapeHtml(`@${tweet.author.screen_name}`);
		const authorName = escapeHtml(tweet.author.name);

		return `<div class="tweet-thread"><div class="main-tweet"><div class="tweet">` +
			`<div class="tweet-header"><span class="tweet-author"><strong>${authorName}</strong> <span class="tweet-handle">${handle}</span></span></div>` +
			`<div class="tweet-text">${htmlParts.join('\n')}</div>` +
			`</div></div></div>`;
	}

	private applyMarkers(text: string, markers: Marker[]): string {
		if (markers.length === 0) {
			return escapeHtml(text);
		}

		markers.sort((a, b) => {
			if (a.offset !== b.offset) return a.offset - b.offset;
			if (a.type === 'close' && b.type === 'open') return -1;
			if (a.type === 'open' && b.type === 'close') return 1;
			return 0;
		});

		let result = '';
		let pos = 0;
		for (const marker of markers) {
			if (marker.offset > pos) {
				result += escapeHtml(text.slice(pos, marker.offset));
			}
			result += marker.tag;
			pos = marker.offset;
		}
		if (pos < text.length) {
			result += escapeHtml(text.slice(pos));
		}
		return result;
	}

	private applyFacets(text: string, textStart: number, textEnd: number, facets: FxTwitterFacet[]): string {
		const markers: Marker[] = [];

		for (const facet of facets) {
			const [fStart, fEnd] = facet.indices;
			if (fEnd <= textStart || fStart >= textEnd) continue;

			const relStart = Math.max(0, fStart - textStart);
			const relEnd = Math.min(text.length, fEnd - textStart);

			if (facet.type === 'italic') {
				markers.push({ offset: relStart, type: 'open', tag: '<em>' });
				markers.push({ offset: relEnd, type: 'close', tag: '</em>' });
			} else if (facet.type === 'mention' && facet.text) {
				const url = `https://x.com/${escapeHtml(facet.text)}`;
				markers.push({ offset: relStart, type: 'open', tag: `<a href="${url}">` });
				markers.push({ offset: relEnd, type: 'close', tag: '</a>' });
			} else if (facet.type === 'url' && facet.original) {
				const url = escapeHtml(facet.original);
				markers.push({ offset: relStart, type: 'open', tag: `<a href="${url}">` });
				markers.push({ offset: relEnd, type: 'close', tag: '</a>' });
			}
		}

		return this.applyMarkers(text, markers);
	}

	private renderArticle(
		blocks: DraftBlock[],
		entityMap: DraftEntityMapEntry[],
		coverMedia?: { media_info?: { original_img_url?: string } },
		mediaEntities?: FxTwitterArticleMediaEntity[]
	): string {
		const parts: string[] = [];

		// Add cover image if available
		if (coverMedia?.media_info?.original_img_url) {
			parts.push(`<img src="${escapeHtml(coverMedia.media_info.original_img_url)}" alt="Cover image">`);
		}

		let i = 0;
		while (i < blocks.length) {
			const block = blocks[i];

			if (block.type === 'unordered-list-item') {
				// Group consecutive list items into a <ul>
				const items: string[] = [];
				while (i < blocks.length && blocks[i].type === 'unordered-list-item') {
					items.push(`<li>${this.renderInlineContent(blocks[i], entityMap)}</li>`);
					i++;
				}
				parts.push(`<ul>${items.join('')}</ul>`);
				continue;
			}

			const html = this.renderBlock(block, entityMap, mediaEntities);
			if (html) {
				parts.push(html);
			}
			i++;
		}

		return `<article class="x-article">${parts.join('\n')}</article>`;
	}

	private renderBlock(block: DraftBlock, entityMap: DraftEntityMapEntry[], mediaEntities?: FxTwitterArticleMediaEntity[]): string {
		switch (block.type) {
			case 'unstyled': {
				if (!block.text.trim()) return '';
				return `<p>${this.renderInlineContent(block, entityMap)}</p>`;
			}
			case 'header-two':
				return `<h2>${this.renderInlineContent(block, entityMap)}</h2>`;
			case 'header-three':
				return `<h3>${this.renderInlineContent(block, entityMap)}</h3>`;
			case 'atomic':
				return this.renderAtomicBlock(block, entityMap, mediaEntities);
			default: {
				if (!block.text.trim()) return '';
				return `<p>${this.renderInlineContent(block, entityMap)}</p>`;
			}
		}
	}

	private renderAtomicBlock(block: DraftBlock, entityMap: DraftEntityMapEntry[], mediaEntities?: FxTwitterArticleMediaEntity[]): string {
		if (block.entityRanges.length === 0) return '';

		const entityEntry = entityMap.find(e => e.key === String(block.entityRanges[0].key));
		if (!entityEntry) return '';

		const entity = entityEntry.value;

		switch (entity.type) {
			case 'MEDIA': {
				const mediaItems = entity.data.mediaItems || [];
				const caption = entity.data.caption;
				const images: string[] = [];

				for (const item of mediaItems) {
					const mediaEntity = mediaEntities?.find(e => String(e.media_id) === String(item.mediaId));
					if (!mediaEntity) continue;

					const info = mediaEntity.media_info;
					if (info.__typename === 'ApiImage' && info.original_img_url) {
						images.push(`<img src="${escapeHtml(info.original_img_url)}" alt="${caption ? escapeHtml(caption) : ''}">`);
					} else if (info.__typename === 'ApiVideo' && info.preview_image?.original_img_url) {
						const videoVariants = (info.variants || [])
							.filter(v => v.content_type === 'video/mp4' && v.bit_rate)
							.sort((a, b) => (b.bit_rate || 0) - (a.bit_rate || 0));
						const videoUrl = videoVariants[0]?.url;
						const previewUrl = info.preview_image.original_img_url;
						if (videoUrl) {
							images.push(`<video src="${escapeHtml(videoUrl)}" poster="${escapeHtml(previewUrl)}" controls></video>`);
						} else {
							images.push(`<img src="${escapeHtml(previewUrl)}" alt="${caption ? escapeHtml(caption) : ''}">`);
						}
					}
				}

				if (images.length > 0 && caption) {
					return `<figure>${images.join('\n')}<figcaption>${escapeHtml(caption)}</figcaption></figure>`;
				} else if (images.length > 0) {
					return images.map(img => `<figure>${img}</figure>`).join('\n');
				} else if (caption) {
					return `<figure><figcaption>${escapeHtml(caption)}</figcaption></figure>`;
				}
				return '';
			}
			case 'MARKDOWN': {
				const markdown = entity.data.markdown || '';
				// Strip the wrapping ```...``` fences
				const codeMatch = markdown.match(/^```(\w*)\n([\s\S]*?)\n?```$/);
				if (codeMatch) {
					const lang = codeMatch[1];
					const code = codeMatch[2];
					const langAttr = lang ? ` class="language-${escapeHtml(lang)}" data-lang="${escapeHtml(lang)}"` : '';
					return `<pre><code${langAttr}>${escapeHtml(code)}</code></pre>`;
				}
				return `<pre><code>${escapeHtml(markdown)}</code></pre>`;
			}
			default:
				return '';
		}
	}

	private renderInlineContent(block: DraftBlock, entityMap: DraftEntityMapEntry[]): string {
		const text = block.text;
		if (!text) return '';

		const markers: Marker[] = [];

		for (const range of block.inlineStyleRanges) {
			if (range.style === 'Bold') {
				markers.push({ offset: range.offset, type: 'open', tag: '<strong>' });
				markers.push({ offset: range.offset + range.length, type: 'close', tag: '</strong>' });
			}
		}

		for (const range of block.entityRanges) {
			const entityEntry = entityMap.find(e => e.key === String(range.key));
			if (entityEntry?.value.type === 'LINK' && entityEntry.value.data.url) {
				const url = escapeHtml(entityEntry.value.data.url);
				markers.push({ offset: range.offset, type: 'open', tag: `<a href="${url}">` });
				markers.push({ offset: range.offset + range.length, type: 'close', tag: '</a>' });
			}
		}

		if (block.data?.mentions) {
			for (const mention of block.data.mentions) {
				const url = `https://x.com/${escapeHtml(mention.text)}`;
				markers.push({ offset: mention.fromIndex, type: 'open', tag: `<a href="${url}">` });
				markers.push({ offset: mention.toIndex, type: 'close', tag: '</a>' });
			}
		}

		if (block.data?.urls) {
			for (const urlData of block.data.urls) {
				const url = escapeHtml(urlData.text);
				markers.push({ offset: urlData.fromIndex, type: 'open', tag: `<a href="${url}">` });
				markers.push({ offset: urlData.toIndex, type: 'close', tag: '</a>' });
			}
		}

		return this.applyMarkers(text, markers);
	}

}
