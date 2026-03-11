import { describe, test, expect } from 'vitest';
import { readFileSync } from 'fs';
import { join } from 'path';
import { Defuddle } from '../src/linkedom';
import { getFixtures } from './helpers';

/**
 * Tests for the linkedom binding (defuddle/linkedom).
 *
 * Mirrors the fixture and debug tests that run against the JSDOM binding
 * (defuddle/node) to verify linkedom produces equivalent results.
 */

const fixturePath = join(__dirname, 'fixtures', 'general--stephango.com-buy-wisely.html');
const fixtureHtml = readFileSync(fixturePath, 'utf-8');
const fixtureUrl = 'https://stephango.com/buy-wisely';

// ---------------------------------------------------------------------------
// Fixture suite
// ---------------------------------------------------------------------------

describe('linkedom — fixtures', () => {
	const fixtures = getFixtures();

	test('should have fixtures to test', () => {
		expect(fixtures.length).toBeGreaterThan(0);
	});

	test.each(fixtures)('should process fixture: $name', async ({ path }) => {
		const html = readFileSync(path, 'utf-8');
		const response = await Defuddle(html);

		expect(response.content.length).toBeGreaterThan(0);
		expect(response.wordCount).toBeGreaterThan(0);
	});
});

// ---------------------------------------------------------------------------
// Debug options
// ---------------------------------------------------------------------------

describe('linkedom — debug options', () => {
	test('debug: true returns debug info with contentSelector and removals', async () => {
		const result = await Defuddle(fixtureHtml, fixtureUrl, { debug: true });

		expect(result.debug).toBeDefined();
		expect(result.debug!.contentSelector).toBeTruthy();
		expect(Array.isArray(result.debug!.removals)).toBe(true);
	});

	test('debug: false does not include debug field', async () => {
		const result = await Defuddle(fixtureHtml, fixtureUrl);

		expect(result.debug).toBeUndefined();
	});

	test('debug removals include step and text for each entry', async () => {
		const result = await Defuddle(fixtureHtml, fixtureUrl, { debug: true });
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
		const result = await Defuddle(fixtureHtml, fixtureUrl, { debug: true });
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
		const withScoring = await Defuddle(fixtureHtml, fixtureUrl, { debug: true });
		const withoutScoring = await Defuddle(fixtureHtml, fixtureUrl, {
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
		const withoutHidden = await Defuddle(fixtureHtml, fixtureUrl, {
			debug: true,
			removeHiddenElements: false,
		});

		const hiddenRemovals = withoutHidden.debug!.removals.filter(
			r => r.step === 'removeHiddenElements'
		);

		expect(hiddenRemovals.length).toBe(0);
	});

	test('removeSmallImages: false preserves small images', async () => {
		const withRemoval = await Defuddle(fixtureHtml, fixtureUrl);
		const withoutRemoval = await Defuddle(fixtureHtml, fixtureUrl, {
			removeSmallImages: false,
		});

		expect(withoutRemoval.content.length).toBeGreaterThanOrEqual(
			withRemoval.content.length
		);
	});

	test('all toggles off produces more or equal content', async () => {
		const defaults = await Defuddle(fixtureHtml, fixtureUrl);
		const allOff = await Defuddle(fixtureHtml, fixtureUrl, {
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
		const result = await Defuddle(fixtureHtml, fixtureUrl, {
			debug: true,
			contentSelector: 'body',
		});

		expect(result.debug!.contentSelector).toContain('body');
		expect(result.content.length).toBeGreaterThan(0);
	});

	test('contentSelector falls back to auto-detection on no match', async () => {
		const autoResult = await Defuddle(fixtureHtml, fixtureUrl, { debug: true });
		const fallbackResult = await Defuddle(fixtureHtml, fixtureUrl, {
			debug: true,
			contentSelector: '.nonexistent-class-xyz',
		});

		expect(fallbackResult.content.length).toBeGreaterThan(0);
		expect(fallbackResult.debug!.contentSelector).toBe(
			autoResult.debug!.contentSelector
		);
	});

	test('contentSelector with specific element narrows content', async () => {
		const autoResult = await Defuddle(fixtureHtml, fixtureUrl);
		const narrowResult = await Defuddle(fixtureHtml, fixtureUrl, {
			contentSelector: 'p',
		});

		expect(narrowResult.wordCount).toBeLessThan(autoResult.wordCount);
	});
});
