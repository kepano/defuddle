import { describe, test, expect } from 'vitest';
import { readFileSync, writeFileSync, existsSync, readdirSync } from 'fs';
import { join, basename, extname } from 'path';
import { Defuddle, DefuddleResponse } from '../src/node';

/**
 * Fixtures-based testing for Defuddle extractors
 * 
 * This test suite automatically discovers HTML fixtures in the tests/fixtures directory
 * and runs comprehensive tests against them. It saves expected results as markdown files
 * in tests/expected/ with JSON metadata as a preamble for easy comparison and review.
 * 
 * How it works:
 * 1. Processes all .html files in tests/fixtures/ with Defuddle
 * 2. Compares against saved expected results in tests/expected/
 * 3. If no expected result exists, creates a baseline
 * 4. If results differ, fails the test
 * 
 * Output format:
 * Each expected result is saved as a single .md file with:
 * - JSON metadata (excluding content) as a code block preamble
 * - Followed by the markdown content
 * 
 * To add new fixtures:
 * 1. Add .html files to tests/fixtures/
 * 2. Run `npm test` - this will create baseline expected results
 * 3. Review the generated files in tests/expected/
 * 
 * To update expected results:
 * 1. Delete the expected result file in tests/expected/
 * 2. Run `npm test`
 * 3. Review the updated files in tests/expected/
 */

// Helper function to get all HTML fixtures
function getFixtures(): Array<{ name: string; path: string }> {
  const fixturesDir = join(__dirname, 'fixtures');
  const files = readdirSync(fixturesDir).filter(file => file.endsWith('.html'));
  
  return files.map(file => {
    const name = basename(file, extname(file));
    const path = join(fixturesDir, file);

    return { name, path };
  });
}

// Helper function to save/load expected results
function getExpectedMarkdownPath(fixtureName: string): string {
  return join(__dirname, 'expected', `${fixtureName}.md`);
}

function saveExpectedResult(fixtureName: string, result: string): void {
  const expectedDir = join(__dirname, 'expected');
  if (!existsSync(expectedDir)) {
    require('fs').mkdirSync(expectedDir, { recursive: true });
  }

  writeFileSync(getExpectedMarkdownPath(fixtureName), result, 'utf-8');
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

describe('Fixtures Tests', () => {
  const fixtures = getFixtures();
  
  test('should have fixtures to test', () => {
    expect(fixtures.length).toBeGreaterThan(0);
  });

  test.each(fixtures)('should process fixture: $name', async ({ name, path }) => {
    // Load the HTML fixture
    const html = readFileSync(path, 'utf-8');
    
    // Process with Defuddle
    const url = `https://${basename(path, '.html').replace(/:/g, '/')}`;
    const response = await Defuddle(html, url, { separateMarkdown: true });
    const result = createComparableResult(response);
    const expected = loadExpectedResult(name);
    
    // Basic validation to ensure the extraction worked
    expect(response.content.length).toBeGreaterThan(0);
    expect(response.contentMarkdown?.length).toBeGreaterThan(0);

    if (!expected) {
      // No expected result exists, save this as the baseline
      console.log(`Creating baseline expected result for ${name}`);
      saveExpectedResult(name, result);
    }

    if (expected) {
      expect(result.trim()).toEqual(expected.trim());
    }
  });
});
