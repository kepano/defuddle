import { describe, expect, test } from 'vitest';
import { generateKeywordTags } from '../src/keyword-tags';
import { buildFrontmatter } from '../src/frontmatter';
import type { DefuddleResponse } from '../src/types';

function makeResult(partial: Partial<DefuddleResponse>): DefuddleResponse {
	return {
		content: '<article><p>TypeScript parser parser extraction tooling.</p></article>',
		title: 'TypeScript Parser for Documentation Extraction',
		description: 'Extract technical docs with parser tooling',
		domain: 'example.com',
		favicon: '',
		image: '',
		language: 'en',
		parseTime: 1,
		published: '',
		author: 'Dev Team',
		site: 'Example Docs',
		schemaOrgData: null,
		wordCount: 8,
		...partial,
	};
}

describe('keyword tags', () => {
	test('generates tags from metadata and body', () => {
		const tags = generateKeywordTags(makeResult({}));

		expect(tags.length).toBeGreaterThan(0);
		expect(tags).toContain('typescript');
		expect(tags).toContain('parser');
	});

	test('prioritizes explicit meta keywords and emits in frontmatter', () => {
		const result = makeResult({
			metaTags: [
				{ name: 'keywords', property: null, content: 'ai agents, keyword scan, obsidian tags' },
			],
		});
		const tags = generateKeywordTags(result);
		const yaml = buildFrontmatter({ ...result, tags }, 'https://example.com/post');

		expect(tags).toContain('ai-agents');
		expect(yaml).toContain('tags:');
		expect(yaml).toContain('  - "ai-agents"');
	});

	test('filters contraction noise tags like youll', () => {
		const result = makeResult({
			title: "You'll build better plugins",
			description: "We've tested parser flow",
			metaTags: [
				{ name: 'keywords', property: null, content: "you'll, we'll, plugin architecture" },
			],
		});

		const tags = generateKeywordTags(result);

		expect(tags).not.toContain('youll');
		expect(tags).not.toContain('well');
		expect(tags).toContain('plugin-architecture');
	});
});
