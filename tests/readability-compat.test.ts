import { describe, test, expect } from 'vitest';
import { existsSync, readFileSync, readdirSync } from 'fs';
import { join } from 'path';
import { Defuddle } from '../src/node';
import type { DefuddleMetadata } from '../src/types';
import { createMarkdownContent } from '../src/markdown';
import { standardizeContent } from '../src/standardize';
import { standardizeCallouts } from '../src/elements/callouts';
import { standardizeFootnotes } from '../src/elements/footnotes';
import { parseHTML } from '../src/utils/dom';
import { parseDocument } from './helpers';
import { READABILITY_PORT_ANNOTATIONS, type ContentExpectationMode } from './readability-port-annotations';

type ReadabilityMetadata = {
	title?: string | null;
	byline?: string | null;
	lang?: string | null;
	excerpt?: string | null;
	siteName?: string | null;
	publishedTime?: string | null;
	readerable?: boolean;
};

type ReadabilityFixture = {
	name: string;
	sourceHtml: string;
	expectedHtml: string;
	expectedMetadata: ReadabilityMetadata;
	baseUrl: string;
};

const BASE_URL = 'http://fakehost/test/page.html';
const READABILITY_FIXTURES_DIR =
	process.env.READABILITY_FIXTURES_DIR || join(__dirname, 'fixtures', 'readability-test-pages');
const runSuite = process.env.READABILITY_PORT === '1';
const describeReadability = runSuite ? describe : describe.skip;

function loadFixtures(rootDir: string): ReadabilityFixture[] {
	return readdirSync(rootDir)
		.sort()
		.map(name => {
			const dir = join(rootDir, name);
			const sourceHtml = readFileSync(join(dir, 'source.html'), 'utf-8');
			return {
				name,
				sourceHtml,
				expectedHtml: readFileSync(join(dir, 'expected.html'), 'utf-8'),
				expectedMetadata: JSON.parse(readFileSync(join(dir, 'expected-metadata.json'), 'utf-8')),
				baseUrl: inferFixtureUrl(sourceHtml)
			};
		});
}

function inferFixtureUrl(sourceHtml: string): string {
	const doc = parseDocument(sourceHtml, BASE_URL);
	return (
		doc.querySelector('link[rel="canonical"]')?.getAttribute('href') ||
		doc.querySelector('meta[property="og:url"]')?.getAttribute('content') ||
		doc.querySelector('meta[property="al:web:url"]')?.getAttribute('content') ||
		BASE_URL
	);
}

function makeMetadata(title: string): DefuddleMetadata {
	return {
		title,
		description: '',
		domain: '',
		favicon: '',
		image: '',
		language: '',
		parseTime: 0,
		published: '',
		author: '',
		site: '',
		schemaOrgData: null,
		wordCount: 0
	};
}

function normalizeText(value: string | null | undefined): string {
	return (value || '').replace(/\s+/g, ' ').trim();
}

function normalizeMarkdown(markdown: string): string {
	return markdown
		.replace(/\r\n/g, '\n')
		.replace(/[ \t]+\n/g, '\n')
		.replace(/\n{3,}/g, '\n\n')
		.trim();
}

function escapeRegex(value: string): string {
	return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function stripSiteSuffix(title: string, sites: string[]): string {
	let normalized = normalizeText(title);
	for (const site of sites) {
		const siteText = normalizeText(site);
		if (!siteText) continue;
		const suffixRe = new RegExp(`\\s*(?:[|:\\-–—]|•)\\s*${escapeRegex(siteText)}$`, 'i');
		normalized = normalized.replace(suffixRe, '').trim();
	}
	return normalized;
}

function titlesEquivalent(actual: string, expected: string, sites: string[]): boolean {
	const normalizedActual = normalizeText(actual);
	const normalizedExpected = normalizeText(expected);
	if (normalizedActual === normalizedExpected) return true;

	const strippedActual = stripSiteSuffix(normalizedActual, sites);
	const strippedExpected = stripSiteSuffix(normalizedExpected, sites);
	return (
		strippedActual === strippedExpected ||
		strippedActual.includes(strippedExpected) ||
		strippedExpected.includes(strippedActual)
	);
}

function normalizeByline(value: string): string {
	return normalizeText(value)
		.replace(/^(?:by|par|von|por)\s+/i, '')
		.replace(/\s*(?:[|•·]|—|-)\s*$/, '')
		.replace(/\s+(?:updated|last updated|published)\b.*$/i, '')
		.replace(/\s+\d{1,2}:\d{2}.*$/i, '')
		.replace(/\s+(?:jan|feb|mar|apr|may|jun|jul|aug|sep|sept|oct|nov|dec)[a-z]*\b.*$/i, '')
		.trim();
}

function bylinesEquivalent(actual: string, expected: string): boolean {
	const normalizedActual = normalizeByline(actual);
	const normalizedExpected = normalizeByline(expected);
	return (
		normalizedActual === normalizedExpected ||
		normalizedActual.includes(normalizedExpected) ||
		normalizedExpected.includes(normalizedActual)
	);
}

function looselyEquivalent(actual: string, expected: string): boolean {
	const normalizedActual = normalizeText(actual);
	const normalizedExpected = normalizeText(expected);
	return (
		normalizedActual === normalizedExpected ||
		normalizedActual.includes(normalizedExpected) ||
		normalizedExpected.includes(normalizedActual)
	);
}

function stripMarkdownFormatting(markdown: string): string {
	return markdown
		.replace(/```[\s\S]*?```/g, block =>
			block.replace(/```[a-zA-Z0-9_-]*\n?/g, '').replace(/```/g, '')
		)
		.replace(/!\[[^\]]*\]\([^)]*\)/g, ' ')
		.replace(/\[([^\]]+)\]\([^)]*\)/g, '$1')
		.replace(/^#{1,6}\s+/gm, '')
		.replace(/^>\s?/gm, '')
		.replace(/^[-*+]\s+/gm, '')
		.replace(/^\d+\.\s+/gm, '')
		.replace(/^---$/gm, '')
		.replace(/[*_`~]/g, '')
		.replace(/<[^>]+>/g, ' ')
		.replace(/\s+/g, ' ')
		.trim();
}

function normalizeSemanticText(markdown: string): string {
	const stripped = stripMarkdownFormatting(markdown)
		.toLowerCase()
		// Protocol-only URL differences are compatibility noise in these fixtures.
		.replace(/\bhttps?\b/g, ' ');
	const tokens = stripped.match(/[\p{L}\p{N}]+/gu) || [];
	return tokens.join(' ');
}

function isOrderedTokenSubsequence(container: string, candidate: string): boolean {
	const containerTokens = normalizeSemanticText(container).split(' ').filter(Boolean);
	const candidateTokens = normalizeSemanticText(candidate).split(' ').filter(Boolean);
	if (candidateTokens.length === 0) return true;

	let candidateIndex = 0;
	for (const token of containerTokens) {
		if (token === candidateTokens[candidateIndex]) {
			candidateIndex += 1;
			if (candidateIndex === candidateTokens.length) {
				return true;
			}
		}
	}

	return false;
}

function semanticTokenOverlapRatio(a: string, b: string): number {
	const aTokens = normalizeSemanticText(a).split(' ').filter(Boolean);
	const bTokens = normalizeSemanticText(b).split(' ').filter(Boolean);
	if (aTokens.length === 0 || bTokens.length === 0) return 0;

	const counts = new Map<string, number>();
	for (const token of aTokens) {
		counts.set(token, (counts.get(token) || 0) + 1);
	}

	let common = 0;
	for (const token of bTokens) {
		const remaining = counts.get(token) || 0;
		if (remaining <= 0) continue;
		common += 1;
		counts.set(token, remaining - 1);
	}

	return common / Math.min(aTokens.length, bTokens.length);
}

function expectContentMatch(
	actualMarkdown: string,
	expectedMarkdown: string,
	mode: ContentExpectationMode = 'canonical-markdown',
	minimumSemanticOverlap: number = 0.99
): void {
	switch (mode) {
		case 'semantic-text':
			expect.soft(normalizeSemanticText(actualMarkdown)).toBe(
				normalizeSemanticText(expectedMarkdown)
			);
			return;
		case 'semantic-overlap':
			expect
				.soft(semanticTokenOverlapRatio(actualMarkdown, expectedMarkdown))
				.toBeGreaterThanOrEqual(minimumSemanticOverlap);
			return;
		case 'actual-contains-expected-text':
			expect.soft(
				isOrderedTokenSubsequence(actualMarkdown, expectedMarkdown)
			).toBe(true);
			return;
		case 'expected-contains-actual-text':
			expect.soft(
				isOrderedTokenSubsequence(expectedMarkdown, actualMarkdown)
			).toBe(true);
			return;
		default:
			expect.soft(actualMarkdown).toEqual(expectedMarkdown);
	}
}

function unwrapReadabilityPage(container: Element): void {
	const page = Array.from(container.children).find(
		child => child.id === 'readability-page-1' && child.classList.contains('page')
	);
	if (!page) return;

	while (page.firstChild) {
		container.insertBefore(page.firstChild, page);
	}
	page.remove();
}

function removeSelectors(root: Element, selectors: string[] = []): void {
	for (const selector of selectors) {
		root.querySelectorAll(selector).forEach(element => element.remove());
	}
}

function removeTextSnippets(root: Element, snippets: string[] = []): void {
	for (const snippet of snippets) {
		const normalizedSnippet = normalizeText(snippet).toLowerCase();
		if (!normalizedSnippet) continue;

		for (const element of Array.from(root.querySelectorAll('p, div, section, article, li, figure, figcaption'))) {
			const text = normalizeText(element.textContent).toLowerCase();
			if (!text.includes(normalizedSnippet)) continue;
			element.remove();
		}
	}
}

function canonicalizeFragment(
	html: string,
	title: string,
	baseUrl: string,
	selectorsToRemove: string[] = [],
	textSnippetsToRemove: string[] = []
): string {
	const doc = parseDocument(
		'<!DOCTYPE html><html><head><title>fixture</title></head><body><div id="fixture-root"></div></body></html>',
		baseUrl
	);
	const root = doc.getElementById('fixture-root');
	if (!root) {
		throw new Error('Missing fixture root');
	}

	root.appendChild(parseHTML(doc, html));
	removeSelectors(root, selectorsToRemove);
	removeTextSnippets(root, textSnippetsToRemove);
	unwrapReadabilityPage(root);
	standardizeCallouts(root);
	standardizeFootnotes(root);
	standardizeContent(root, makeMetadata(title), doc);
	root.querySelectorAll('a[href^="#"]').forEach(link => {
		const href = link.getAttribute('href');
		if (!href) return;
		link.setAttribute('href', new URL(href, baseUrl).href);
	});

	return root.innerHTML.trim();
}

function toCanonicalMarkdown(
	html: string,
	title: string,
	baseUrl: string,
	selectorsToRemove: string[] = [],
	textSnippetsToRemove: string[] = []
): string {
	return normalizeMarkdown(
		createMarkdownContent(
			canonicalizeFragment(html, title, baseUrl, selectorsToRemove, textSnippetsToRemove),
			baseUrl
		)
	);
}

describeReadability('Mozilla Readability Compatibility', () => {
	test('fixture root is available', () => {
		expect(
			existsSync(READABILITY_FIXTURES_DIR),
			`Mozilla Readability fixtures not found at ${READABILITY_FIXTURES_DIR}`
		).toBe(true);
	});

	if (!existsSync(READABILITY_FIXTURES_DIR)) {
		return;
	}

	const fixtures = loadFixtures(READABILITY_FIXTURES_DIR);

	test('loads Mozilla Readability fixtures', () => {
		expect(fixtures.length).toBeGreaterThan(0);
	});

	test.each(fixtures)('$name', async fixture => {
		const annotation = READABILITY_PORT_ANNOTATIONS[fixture.name];
		const doc = parseDocument(fixture.sourceHtml, fixture.baseUrl);
		const response = await Defuddle(doc, fixture.baseUrl, {
			separateMarkdown: true,
			useAsync: false
		});

		const canonicalTitle = fixture.expectedMetadata.title || response.title || '';
		const actualMarkdown = toCanonicalMarkdown(response.content, canonicalTitle, fixture.baseUrl);
		const expectedMarkdown = toCanonicalMarkdown(
			fixture.expectedHtml,
			canonicalTitle,
			fixture.baseUrl,
			annotation?.expectedSelectorsToRemove,
			annotation?.expectedTextSnippetsToRemove
		);

		expectContentMatch(
			actualMarkdown,
			expectedMarkdown,
			annotation?.content,
			annotation?.minimumSemanticOverlap
		);

		if (fixture.expectedMetadata.title) {
			const expectedTitles = [
				fixture.expectedMetadata.title,
				...(annotation?.titleAlternatives || [])
			];
			expect.soft(
				expectedTitles.some(expectedTitle =>
					titlesEquivalent(response.title, expectedTitle, [
						fixture.expectedMetadata.siteName || '',
						response.site || ''
					])
				)
			).toBe(true);
		}

		if (fixture.expectedMetadata.byline && !annotation?.skipByline) {
			expect.soft(
				bylinesEquivalent(response.author, fixture.expectedMetadata.byline)
			).toBe(true);
			expect.soft(normalizeByline(response.author).length).toBeGreaterThan(0);
		}

		if (fixture.expectedMetadata.siteName && !annotation?.skipSiteName) {
			expect.soft(normalizeText(response.site)).toBe(
				normalizeText(fixture.expectedMetadata.siteName)
			);
		}

		if (fixture.expectedMetadata.publishedTime) {
			expect.soft(
				looselyEquivalent(response.published, fixture.expectedMetadata.publishedTime)
			).toBe(true);
		}

		if (fixture.expectedMetadata.lang) {
			expect.soft(normalizeText(response.language)).toBe(
				normalizeText(fixture.expectedMetadata.lang)
			);
		}
	}, 30000);
});
