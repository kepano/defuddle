import { describe, test, expect } from 'vitest';
import { MetadataExtractor } from '../src/metadata';

/**
 * Unit tests for MetadataExtractor.parseDateText — the helper that
 * normalizes free-text dates into ISO 8601 strings.
 */
describe('parseDateText', () => {
	test('parses "February 26, 2025" (full month name)', () => {
		expect(MetadataExtractor.parseDateText('February 26, 2025')).toBe('2025-02-26T00:00:00+00:00');
	});

	test('parses "26 February 2025" (day-first, full month name)', () => {
		expect(MetadataExtractor.parseDateText('26 February 2025')).toBe('2025-02-26T00:00:00+00:00');
	});

	test('parses "Oct 20, 2025" (abbreviated month)', () => {
		expect(MetadataExtractor.parseDateText('Oct 20, 2025')).toBe('2025-10-20T00:00:00+00:00');
	});

	test('parses "Jan 1, 2024" (abbreviated month)', () => {
		expect(MetadataExtractor.parseDateText('Jan 1, 2024')).toBe('2024-01-01T00:00:00+00:00');
	});

	test('parses "20 Oct 2025" (day-first, abbreviated month)', () => {
		expect(MetadataExtractor.parseDateText('20 Oct 2025')).toBe('2025-10-20T00:00:00+00:00');
	});

	test('parses "Sept 5, 2025" (4-letter September abbrev)', () => {
		expect(MetadataExtractor.parseDateText('Sept 5, 2025')).toBe('2025-09-05T00:00:00+00:00');
	});

	test('parses "Sep 5, 2025" (3-letter September abbrev)', () => {
		expect(MetadataExtractor.parseDateText('Sep 5, 2025')).toBe('2025-09-05T00:00:00+00:00');
	});

	test('parses "May 1, 2025" (month with no abbreviation)', () => {
		expect(MetadataExtractor.parseDateText('May 1, 2025')).toBe('2025-05-01T00:00:00+00:00');
	});

	test('parses "Wednesday, 26 February 2025" (day-of-week prefix)', () => {
		expect(MetadataExtractor.parseDateText('Wednesday, 26 February 2025')).toBe('2025-02-26T00:00:00+00:00');
	});

	test('returns empty string for unrecognized formats', () => {
		expect(MetadataExtractor.parseDateText('some unknown format')).toBe('');
		expect(MetadataExtractor.parseDateText('')).toBe('');
	});

	test('returns empty string for ISO strings (caller should fall back)', () => {
		// parseDateText only matches natural-language dates; ISO strings fall through.
		expect(MetadataExtractor.parseDateText('2025-10-20')).toBe('');
		expect(MetadataExtractor.parseDateText('2025-10-20T14:00:00Z')).toBe('');
	});
});
