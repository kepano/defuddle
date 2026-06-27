import type { DefuddleResponse, MetaTagItem } from './types';

const MAX_TAGS = 10;
const MAX_BODY_TOKENS = 3000;

const META_TAG_KEYS = new Set([
	'keywords',
	'news_keywords',
	'article:tag',
	'article:section',
	'parsely-tags',
	'topic',
	'topics',
]);

const STOPWORDS = new Set([
	'a', 'an', 'the', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by', 'from',
	'is', 'are', 'was', 'were', 'be', 'been', 'being', 'have', 'has', 'had', 'do', 'does', 'did',
	'will', 'would', 'should', 'could', 'can', 'may', 'might', 'must', 'this', 'that', 'these', 'those',
	'it', 'its', 'they', 'them', 'their', 'as', 'if', 'into', 'about', 'over', 'under', 'than', 'too',
	'very', 'just', 'you', 'your', 'we', 'our', 'i', 'me', 'my',
	'le', 'la', 'les', 'un', 'une', 'des', 'du', 'de', 'au', 'aux', 'à', 'en', 'par', 'pour', 'sur',
	'dans', 'avec', 'sans', 'ce', 'cet', 'cette', 'ces', 'qui', 'que', 'quoi', 'dont', 'où', 'et', 'ou',
	'mais', 'donc', 'car', 'ne', 'pas', 'plus', 'moins', 'très', 'bien', 'mal', 'aussi', 'encore',
	'tout', 'tous', 'toute', 'toutes', 'être', 'avoir', 'fait', 'faire', 'est', 'sont', 'été',
]);

function stripHtml(html: string): string {
	return html
		.replace(/<[^>]*>/g, ' ')
		.replace(/&nbsp;/gi, ' ')
		.replace(/&amp;/gi, '&')
		.replace(/&lt;/gi, '<')
		.replace(/&gt;/gi, '>')
		.replace(/&quot;/gi, '"')
		.replace(/&#\d+;/g, ' ')
		.replace(/&\w+;/g, ' ');
}

function tokenize(text: string): string[] {
	if (!text) return [];
	const tokens = text.toLowerCase().match(/[\p{L}\p{N}][\p{L}\p{N}'’_-]{1,40}/gu) || [];
	return tokens
		.map(token => token.replace(/^[^\p{L}\p{N}]+|[^\p{L}\p{N}]+$/gu, ''))
		.filter(token => token.length >= 3)
		.filter(token => !/^\d+$/.test(token))
		.filter(token => !STOPWORDS.has(token));
}

function slugifyTag(input: string): string {
	return input
		.toLowerCase()
		.replace(/['’]/g, '')
		.replace(/[^\p{L}\p{N}]+/gu, '-')
		.replace(/^-+|-+$/g, '');
}

function addWeightedTokens(scores: Map<string, number>, text: string, weight: number, cap?: number): void {
	const tokens = tokenize(text);
	const limited = cap ? tokens.slice(0, cap) : tokens;
	for (const token of limited) {
		scores.set(token, (scores.get(token) || 0) + weight);
	}
}

function splitMetaKeywords(content: string): string[] {
	return content
		.split(/[;,|]/)
		.map(item => item.trim())
		.filter(Boolean)
		.filter(item => item.length <= 80);
}

function scoreMetaTags(scores: Map<string, number>, metaTags?: MetaTagItem[]): void {
	if (!metaTags || metaTags.length === 0) return;

	for (const tag of metaTags) {
		const key = (tag.property || tag.name || '').toLowerCase();
		const content = (tag.content || '').trim();
		if (!key || !content) continue;

		if (META_TAG_KEYS.has(key)) {
			const entries = splitMetaKeywords(content);
			for (const entry of entries) {
				const slug = slugifyTag(entry);
				if (!slug || slug.length < 3) continue;
				scores.set(slug, (scores.get(slug) || 0) + 40);
			}
		}
	}
}

function boostCompositeTags(scores: Map<string, number>, value: string, weight: number): void {
	if (!value) return;
	const parts = value
		.split(/[-|/:]/)
		.map(part => part.trim())
		.filter(part => part.length >= 3 && part.length <= 80);

	for (const part of parts) {
		const slug = slugifyTag(part);
		if (!slug || slug.length < 3) continue;
		scores.set(slug, (scores.get(slug) || 0) + weight);
	}
}

export function generateKeywordTags(result: DefuddleResponse): string[] {
	const scores = new Map<string, number>();

	addWeightedTokens(scores, result.title || '', 10);
	addWeightedTokens(scores, result.description || '', 4);
	addWeightedTokens(scores, result.site || '', 5);
	addWeightedTokens(scores, result.author || '', 3);
	addWeightedTokens(scores, stripHtml(result.content || ''), 1, MAX_BODY_TOKENS);

	boostCompositeTags(scores, result.title || '', 12);
	boostCompositeTags(scores, result.site || '', 8);

	scoreMetaTags(scores, result.metaTags);

	return Array.from(scores.entries())
		.filter(([tag, score]) => tag.length >= 3 && score > 0)
		.sort((a, b) => b[1] - a[1])
		.slice(0, MAX_TAGS)
		.map(([tag]) => tag);
}

