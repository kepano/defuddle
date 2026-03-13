import { describe, test, expect } from 'vitest';
import { readFileSync } from 'fs';
import { join } from 'path';
import { Defuddle } from '../src/node';
import { parseDocument } from './helpers';

/**
 * Tests for debug options: debug info in response, pipeline toggles,
 * and contentSelector.
 */

// Use a real fixture to test against realistic HTML
const fixturePath = join(__dirname, 'fixtures', 'general--stephango.com-buy-wisely.html');
const fixtureHtml = readFileSync(fixturePath, 'utf-8');
const fixtureUrl = 'https://stephango.com/buy-wisely';

describe('Debug options', () => {
	test('debug: true returns debug info with contentSelector and removals', async () => {
		const result = await Defuddle(parseDocument(fixtureHtml, fixtureUrl), fixtureUrl, { debug: true });

		expect(result.debug).toBeDefined();
		expect(result.debug!.contentSelector).toBeTruthy();
		expect(Array.isArray(result.debug!.removals)).toBe(true);
	});

	test('debug: false does not include debug field', async () => {
		const result = await Defuddle(parseDocument(fixtureHtml, fixtureUrl), fixtureUrl);

		expect(result.debug).toBeUndefined();
	});

	test('debug removals include step and text for each entry', async () => {
		const result = await Defuddle(parseDocument(fixtureHtml, fixtureUrl), fixtureUrl, { debug: true });
		const removals = result.debug!.removals;

		// There should be at least some removals on a real page
		if (removals.length > 0) {
			for (const removal of removals) {
				expect(removal.step).toBeTruthy();
				expect(typeof removal.text).toBe('string');
				expect(removal.text.length).toBeLessThanOrEqual(200);
			}
		}
	});

	test('debug removals include expected step names', async () => {
		const result = await Defuddle(parseDocument(fixtureHtml, fixtureUrl), fixtureUrl, { debug: true });
		const steps = new Set(result.debug!.removals.map(r => r.step));
		const validSteps = ['scoreAndRemove', 'removeBySelector', 'removeHiddenElements'];

		for (const step of steps) {
			expect(validSteps).toContain(step);
		}
	});
});

describe('Pipeline toggles', () => {
	test('scoreAndRemove: false skips content scoring', async () => {
		const withScoring = await Defuddle(parseDocument(fixtureHtml, fixtureUrl), fixtureUrl, { debug: true });
		const withoutScoring = await Defuddle(parseDocument(fixtureHtml, fixtureUrl), fixtureUrl, {
			debug: true,
			removeLowScoring: false,
		});

		const scoringRemovals = withScoring.debug!.removals.filter(
			r => r.step === 'scoreAndRemove'
		);
		const noScoringRemovals = withoutScoring.debug!.removals.filter(
			r => r.step === 'scoreAndRemove'
		);

		expect(noScoringRemovals.length).toBe(0);
		// Content should be at least as long without scoring (nothing extra removed)
		expect(withoutScoring.wordCount).toBeGreaterThanOrEqual(withScoring.wordCount);
	});

	test('removeHiddenElements: false skips hidden element removal', async () => {
		const withHidden = await Defuddle(parseDocument(fixtureHtml, fixtureUrl), fixtureUrl, { debug: true });
		const withoutHidden = await Defuddle(parseDocument(fixtureHtml, fixtureUrl), fixtureUrl, {
			debug: true,
			removeHiddenElements: false,
		});

		const hiddenRemovals = withoutHidden.debug!.removals.filter(
			r => r.step === 'removeHiddenElements'
		);
		expect(hiddenRemovals.length).toBe(0);
	});

	test('removeSmallImages: false preserves small images', async () => {
		const withRemoval = await Defuddle(parseDocument(fixtureHtml, fixtureUrl), fixtureUrl);
		const withoutRemoval = await Defuddle(parseDocument(fixtureHtml, fixtureUrl), fixtureUrl, {
			removeSmallImages: false,
		});

		// Content with small images kept should be >= content without
		expect(withoutRemoval.content.length).toBeGreaterThanOrEqual(
			withRemoval.content.length
		);
	});

	test('all toggles off produces more or equal content', async () => {
		const defaults = await Defuddle(parseDocument(fixtureHtml, fixtureUrl), fixtureUrl);
		const allOff = await Defuddle(parseDocument(fixtureHtml, fixtureUrl), fixtureUrl, {
			removeLowScoring: false,
			removeHiddenElements: false,
			removeSmallImages: false,
			removeExactSelectors: false,
			removePartialSelectors: false,
		});

		expect(allOff.wordCount).toBeGreaterThanOrEqual(defaults.wordCount);
	});
});

describe('contentSelector', () => {
	test('contentSelector selects the specified element', async () => {
		// Use a broad selector that should exist in any HTML page
		const result = await Defuddle(parseDocument(fixtureHtml, fixtureUrl), fixtureUrl, {
			debug: true,
			contentSelector: 'body',
		});

		expect(result.debug!.contentSelector).toContain('body');
		expect(result.content.length).toBeGreaterThan(0);
	});

	test('contentSelector falls back to auto-detection on no match', async () => {
		const autoResult = await Defuddle(parseDocument(fixtureHtml, fixtureUrl), fixtureUrl, { debug: true });
		const fallbackResult = await Defuddle(parseDocument(fixtureHtml, fixtureUrl), fixtureUrl, {
			debug: true,
			contentSelector: '.nonexistent-class-xyz',
		});

		// Both should produce content since fallback kicks in
		expect(fallbackResult.content.length).toBeGreaterThan(0);
		// The content selector path should match auto-detection
		expect(fallbackResult.debug!.contentSelector).toBe(
			autoResult.debug!.contentSelector
		);
	});

	test('contentSelector with specific element narrows content', async () => {
		const autoResult = await Defuddle(parseDocument(fixtureHtml, fixtureUrl), fixtureUrl);

		// Try to find an element that's a subset of the auto-detected content
		const narrowResult = await Defuddle(parseDocument(fixtureHtml, fixtureUrl), fixtureUrl, {
			contentSelector: 'p',
		});

		// A single <p> should have less content than the full article
		expect(narrowResult.wordCount).toBeLessThan(autoResult.wordCount);
	});
});
