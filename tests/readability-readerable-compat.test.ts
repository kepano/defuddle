import { describe, test, expect } from 'vitest';
import { existsSync, readFileSync, readdirSync } from 'fs';
import { join } from 'path';
import { Defuddle } from '../src/node';
import { parseDocument } from './helpers';

type ReadabilityMetadata = {
	readerable?: boolean;
};

type Fixture = {
	name: string;
	sourceHtml: string;
	readerable: boolean;
};

const BASE_URL = 'http://fakehost/test/page.html';
const READABILITY_FIXTURES_DIR =
	process.env.READABILITY_FIXTURES_DIR || join(__dirname, 'fixtures', 'readability-test-pages');
const runSuite = process.env.READABILITY_PORT === '1';
const describeReadability = runSuite ? describe : describe.skip;

function loadFixtures(rootDir: string): Fixture[] {
	return readdirSync(rootDir)
		.sort()
		.map(name => {
			const dir = join(rootDir, name);
			const metadata = JSON.parse(
				readFileSync(join(dir, 'expected-metadata.json'), 'utf-8')
			) as ReadabilityMetadata;
			return {
				name,
				sourceHtml: readFileSync(join(dir, 'source.html'), 'utf-8'),
				readerable: Boolean(metadata.readerable)
			};
		});
}

describeReadability('Mozilla Readability Readerable Compatibility', () => {
	test('fixture root is available', () => {
		expect(
			existsSync(READABILITY_FIXTURES_DIR),
			`Mozilla Readability fixtures not found at ${READABILITY_FIXTURES_DIR}`
		).toBe(true);
	});

	if (!existsSync(READABILITY_FIXTURES_DIR)) {
		return;
	}

	const fixtures = loadFixtures(READABILITY_FIXTURES_DIR).filter(fixture => fixture.readerable);

	test('loads readerable Mozilla fixtures', () => {
		expect(fixtures.length).toBeGreaterThan(0);
	});

	test.each(fixtures)('$name should yield substantive extracted content', async fixture => {
		const doc = parseDocument(fixture.sourceHtml, BASE_URL);
		const response = await Defuddle(doc, BASE_URL, {
			separateMarkdown: true,
			useAsync: false
		});

		expect.soft(response.wordCount).toBeGreaterThan(40);
		expect.soft((response.contentMarkdown || '').trim().length).toBeGreaterThan(120);
	}, 30000);
});
