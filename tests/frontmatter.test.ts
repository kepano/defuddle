import { describe, expect, test } from 'vitest';
import { buildFrontmatter } from '../src/frontmatter';
import type { DefuddleResponse } from '../src/types';

const result: DefuddleResponse = {
	content: '<p>Synthetic article.</p>',
	title: 'Synthetic title',
	author: 'Synthetic Author',
	site: 'Synthetic Journal',
	description: 'Synthetic description',
	domain: 'example.com',
	favicon: '',
	image: '',
	language: 'en',
	published: '2026-10-01',
	schemaOrgData: {},
	wordCount: 2,
	parseTime: 0,
};

describe('frontmatter escaping', () => {
	test.each(['title', 'author', 'site', 'description'] as const)(
		'preserves backslashes and quotes in %s',
		field => {
			// YAML double-quoted scalars interpret backslash escapes. A path can
			// become invalid YAML (\U) or silently change its value (\t).
			const value = 'Path C:\\Users\\test\\notes "quoted"';
			const frontmatter = buildFrontmatter({ ...result, [field]: value });
			expect(frontmatter).toContain(`${field}: ${JSON.stringify(value)}\n`);
		},
	);

	test('keeps newline normalization and ordinary metadata unchanged', () => {
		const frontmatter = buildFrontmatter({ ...result, title: 'A "quoted"\ntitle' });
		expect(frontmatter).toContain('title: "A \\"quoted\\" title"\n');
		expect(frontmatter).toContain('published: 2026-10-01\n');
		expect(frontmatter).toContain('author: "Synthetic Author"\n');
	});
});
