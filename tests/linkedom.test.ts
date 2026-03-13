import { describe, test, expect } from 'vitest';
import { readFileSync, existsSync } from 'fs';
import { join, basename } from 'path';
import { parseHTML } from 'linkedom';
import { Defuddle } from '../src/node';
import type { DefuddleResponse } from '../src/types';
import { getFixtures } from './helpers';

/**
 * Tests for passing a linkedom Document to defuddle/node.
 *
 * Verifies that defuddle works correctly with non-JSDOM Document
 * implementations by parsing HTML with linkedom and passing the
 * Document directly to Defuddle().
 */

function parseWithLinkedom(html: string, url?: string): Document {
	const { document } = parseHTML(html);
	const doc = document as any;
	if (!doc.styleSheets) doc.styleSheets = [];
	if (doc.defaultView && !doc.defaultView.getComputedStyle) {
		doc.defaultView.getComputedStyle = () => ({ display: '' });
	}
	if (url) doc.URL = url;
	return document as unknown as Document;
}

const fixturePath = join(__dirname, 'fixtures', 'general--stephango.com-buy-wisely.html');
const fixtureHtml = readFileSync(fixturePath, 'utf-8');
const fixtureUrl = 'https://stephango.com/buy-wisely';

function getExpectedMarkdownPath(fixtureName: string): string {
	return join(__dirname, 'expected', `${fixtureName}.md`);
}

function loadExpectedResult(fixtureName: string): string | null {
	const expectedPath = getExpectedMarkdownPath(fixtureName);
	if (!existsSync(expectedPath)) {
		return null;
	}
	return readFileSync(expectedPath, 'utf-8');
}

function createComparableResult(response: DefuddleResponse): string {
	const metadataOnly = {
		title: response.title,
		author: response.author,
		site: response.site,
		published: response.published,
	};
	const jsonPreamble = '```json\n' + JSON.stringify(metadataOnly, null, 2) + '\n```\n\n';
	return jsonPreamble + response.contentMarkdown;
}

// ---------------------------------------------------------------------------
// Fixture suite
// ---------------------------------------------------------------------------

describe('linkedom — fixtures', () => {
	const fixtures = getFixtures();

	test('should have fixtures to test', () => {
		expect(fixtures.length).toBeGreaterThan(0);
	});

	test.each(fixtures)('should process fixture: $name', async ({ name, path }) => {
		const html = readFileSync(path, 'utf-8');
		const frontmatterMatch = html.match(/<!--\s*(\{"url":.*?\})\s*-->/);
		const frontmatter = frontmatterMatch ? JSON.parse(frontmatterMatch[1]) : {};
		const urlName = basename(path, '.html').replace(/^[a-z]+--/, '');
		const url = frontmatter.url || `https://${urlName}`;
		const doc = parseWithLinkedom(html, url);
		const response = await Defuddle(doc, url, { separateMarkdown: true });

		expect(response.content.length).toBeGreaterThan(0);
		expect(response.contentMarkdown?.length).toBeGreaterThan(0);

		const expected = loadExpectedResult(name);
		if (expected) {
			const result = createComparableResult(response);
			expect(result.trim()).toEqual(expected.trim());
		}
	});
});

// ---------------------------------------------------------------------------
// Debug options
// ---------------------------------------------------------------------------

describe('linkedom — debug options', () => {
	test('debug: true returns debug info with contentSelector and removals', async () => {
		const doc = parseWithLinkedom(fixtureHtml, fixtureUrl);
		const result = await Defuddle(doc, fixtureUrl, { debug: true });

		expect(result.debug).toBeDefined();
		expect(result.debug!.contentSelector).toBeTruthy();
		expect(Array.isArray(result.debug!.removals)).toBe(true);
	});

	test('debug: false does not include debug field', async () => {
		const doc = parseWithLinkedom(fixtureHtml, fixtureUrl);
		const result = await Defuddle(doc, fixtureUrl);

		expect(result.debug).toBeUndefined();
	});

	test('debug removals include step and text for each entry', async () => {
		const doc = parseWithLinkedom(fixtureHtml, fixtureUrl);
		const result = await Defuddle(doc, fixtureUrl, { debug: true });
		const removals = result.debug!.removals;

		if (removals.length > 0) {
			for (const removal of removals) {
				expect(removal.step).toBeTruthy();
				expect(typeof removal.text).toBe('string');
				expect(removal.text.length).toBeLessThanOrEqual(200);
			}
		}
	});

	test('debug removals include expected step names', async () => {
		const doc = parseWithLinkedom(fixtureHtml, fixtureUrl);
		const result = await Defuddle(doc, fixtureUrl, { debug: true });
		const steps = new Set(result.debug!.removals.map(r => r.step));
		const validSteps = ['scoreAndRemove', 'removeBySelector', 'removeHiddenElements'];

		for (const step of steps) {
			expect(validSteps).toContain(step);
		}
	});
});

// ---------------------------------------------------------------------------
// Pipeline toggles
// ---------------------------------------------------------------------------

describe('linkedom — pipeline toggles', () => {
	test('scoreAndRemove: false skips content scoring', async () => {
		const withScoring = await Defuddle(parseWithLinkedom(fixtureHtml, fixtureUrl), fixtureUrl, { debug: true });
		const withoutScoring = await Defuddle(parseWithLinkedom(fixtureHtml, fixtureUrl), fixtureUrl, {
			debug: true,
			removeLowScoring: false,
		});

		const noScoringRemovals = withoutScoring.debug!.removals.filter(
			r => r.step === 'scoreAndRemove'
		);

		expect(noScoringRemovals.length).toBe(0);
		expect(withoutScoring.wordCount).toBeGreaterThanOrEqual(withScoring.wordCount);
	});

	test('removeHiddenElements: false skips hidden element removal', async () => {
		const withoutHidden = await Defuddle(parseWithLinkedom(fixtureHtml, fixtureUrl), fixtureUrl, {
			debug: true,
			removeHiddenElements: false,
		});

		const hiddenRemovals = withoutHidden.debug!.removals.filter(
			r => r.step === 'removeHiddenElements'
		);

		expect(hiddenRemovals.length).toBe(0);
	});

	test('removeSmallImages: false preserves small images', async () => {
		const withRemoval = await Defuddle(parseWithLinkedom(fixtureHtml, fixtureUrl), fixtureUrl);
		const withoutRemoval = await Defuddle(parseWithLinkedom(fixtureHtml, fixtureUrl), fixtureUrl, {
			removeSmallImages: false,
		});

		expect(withoutRemoval.content.length).toBeGreaterThanOrEqual(
			withRemoval.content.length
		);
	});

	test('all toggles off produces more or equal content', async () => {
		const defaults = await Defuddle(parseWithLinkedom(fixtureHtml, fixtureUrl), fixtureUrl);
		const allOff = await Defuddle(parseWithLinkedom(fixtureHtml, fixtureUrl), fixtureUrl, {
			removeLowScoring: false,
			removeHiddenElements: false,
			removeSmallImages: false,
			removeExactSelectors: false,
			removePartialSelectors: false,
		});

		expect(allOff.wordCount).toBeGreaterThanOrEqual(defaults.wordCount);
	});
});

// ---------------------------------------------------------------------------
// contentSelector
// ---------------------------------------------------------------------------

describe('linkedom — contentSelector', () => {
	test('contentSelector selects the specified element', async () => {
		const result = await Defuddle(parseWithLinkedom(fixtureHtml, fixtureUrl), fixtureUrl, {
			debug: true,
			contentSelector: 'body',
		});

		expect(result.debug!.contentSelector).toContain('body');
		expect(result.content.length).toBeGreaterThan(0);
	});

	test('contentSelector falls back to auto-detection on no match', async () => {
		const autoResult = await Defuddle(parseWithLinkedom(fixtureHtml, fixtureUrl), fixtureUrl, { debug: true });
		const fallbackResult = await Defuddle(parseWithLinkedom(fixtureHtml, fixtureUrl), fixtureUrl, {
			debug: true,
			contentSelector: '.nonexistent-class-xyz',
		});

		expect(fallbackResult.content.length).toBeGreaterThan(0);
		expect(fallbackResult.debug!.contentSelector).toBe(
			autoResult.debug!.contentSelector
		);
	});

	test('contentSelector with specific element narrows content', async () => {
		const autoResult = await Defuddle(parseWithLinkedom(fixtureHtml, fixtureUrl), fixtureUrl);
		const narrowResult = await Defuddle(parseWithLinkedom(fixtureHtml, fixtureUrl), fixtureUrl, {
			contentSelector: 'p',
		});

		expect(narrowResult.wordCount).toBeLessThan(autoResult.wordCount);
	});
});
