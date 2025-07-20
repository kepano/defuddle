import { describe, test, expect } from 'vitest';
import { readFileSync, writeFileSync, existsSync, readdirSync } from 'fs';
import { join, basename, extname } from 'path';
import { Defuddle, DefuddleResponse } from '../src/node';

/**
 * Fixtures-based testing for Defuddle extractors
 * 
 * This test suite automatically discovers HTML fixtures in the tests/fixtures directory
 * and runs comprehensive tests against them. It saves expected results as JSON files
 * in tests/expected/ for easy comparison and review. It also saves the markdown content
 * as separate .md files for easier viewing.
 * 
 * How it works:
 * 1. Processes all .html files in tests/fixtures/ with Defuddle
 * 2. Compares against saved expected results in tests/expected/
 * 3. If no expected result exists, creates a baseline
 * 4. If results differ, fails the test
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
function getExpectedResultPath(fixtureName: string): string {
  return join(__dirname, 'expected', `${fixtureName}.json`);
}

function getExpectedMarkdownPath(fixtureName: string): string {
  return join(__dirname, 'expected', `${fixtureName}.md`);
}

function saveExpectedResult(fixtureName: string, result: any, markdown?: string): void {
  const expectedDir = join(__dirname, 'expected');
  if (!existsSync(expectedDir)) {
    require('fs').mkdirSync(expectedDir, { recursive: true });
  }
  
  const expectedPath = getExpectedResultPath(fixtureName);
  writeFileSync(expectedPath, JSON.stringify(result, null, 2), 'utf-8');
  
  // Also save the markdown content as a separate .md file for easier viewing
  if (markdown) {
    const markdownPath = getExpectedMarkdownPath(fixtureName);
    writeFileSync(markdownPath, markdown, 'utf-8');
  }
}

function loadExpectedResult(fixtureName: string): any | null {
  const expectedPath = getExpectedResultPath(fixtureName);
  if (!existsSync(expectedPath)) {
    return null;
  }
  
  try {
    return JSON.parse(readFileSync(expectedPath, 'utf-8'));
  } catch (error) {
    console.warn(`Failed to load expected result for ${fixtureName}:`, error);
    return null;
  }
}

function createComparableResult(response: DefuddleResponse) {
  return {
    metadata: {
      title: response.title,
      author: response.author,
      site: response.site,
      published: response.published,
    },
    content: {
      html: response.content,
      markdown: response.contentMarkdown,
    },
  };
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
    const response = await Defuddle(html, undefined, { separateMarkdown: true });
    const result = createComparableResult(response);
    const expected = loadExpectedResult(name);
    
    // Basic validation to ensure the extraction worked
    expect(response.content.length).toBeGreaterThan(0);
    expect(response.contentMarkdown?.length).toBeGreaterThan(0);

    if (!expected) {
      // No expected result exists, save this as the baseline
      console.log(`Creating baseline expected result for ${name}`);
      saveExpectedResult(name, result, response.contentMarkdown);
    }

    if (expected) {
      try {
        expect(result).toEqual(expected);
      } catch (error) {
        // If the test fails, update the expected result and markdown file
        console.log(`Updating expected result for ${name} due to changes`);
        saveExpectedResult(name, result, response.contentMarkdown);
        throw error;
      }
    }
    
    // Always save/update the markdown file for easier viewing, even if JSON matches
    if (expected && response.contentMarkdown) {
      const markdownPath = getExpectedMarkdownPath(name);
      writeFileSync(markdownPath, response.contentMarkdown, 'utf-8');
    }
  });
});
