import { describe, expect, test } from 'vitest';
import {
	PARTIAL_SELECTORS,
	PARTIAL_SELECTORS_REGEX,
	PARTIAL_SELECTORS_ANCHORED_REGEX,
} from '../src/constants';

// The partial-selector testers split lookbehind patterns into a regex of their
// own (for JavaScriptCore's regex JIT). They must match exactly what the single
// combined alternation matches.
describe('Partial selector regexes', () => {
	const combined = new RegExp(PARTIAL_SELECTORS.join('|'), 'i');
	const anchored = new RegExp('^(?:' + PARTIAL_SELECTORS.join('|') + ')$', 'i');

	const samples = [
		'',
		'article-body',
		'main-access-wall',
		'paywall access-wall',
		'site-logo',
		'logo',
		'logos-list',
		'h2-related',
		'related-posts',
		'Related',
		'hero_image',
		'theroleofthings',
		'comments-section',
		'cookie-law-banner',
		'nocontent',
		'prose lg:prose-xl',
		...PARTIAL_SELECTORS.filter(p => /^[\w-]+$/.test(p)).map(p => `x ${p.toUpperCase()} y`),
	];

	test.each(samples)('substring match agrees for %j', value => {
		expect(PARTIAL_SELECTORS_REGEX.test(value)).toBe(combined.test(value));
	});

	test.each(samples)('anchored match agrees for %j', value => {
		expect(PARTIAL_SELECTORS_ANCHORED_REGEX.test(value)).toBe(anchored.test(value));
	});

	test('every selector token matches itself when anchored', () => {
		for (const token of PARTIAL_SELECTORS.filter(p => /^[\w-]+$/.test(p))) {
			expect(PARTIAL_SELECTORS_ANCHORED_REGEX.test(token.toLowerCase())).toBe(true);
		}
	});
});
