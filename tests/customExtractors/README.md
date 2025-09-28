# Custom Extractors Test Suite

This directory contains comprehensive tests for Defuddle's custom extractors functionality.

## 📋 Overview

Custom extractors allow users to define their own content extraction logic for specific websites, overriding Defuddle's default extraction behavior.

## 📁 Files

- **`customExtractors.test.ts`** - Main test suite with 14 comprehensive test cases
- **`demo.html`** - Realistic blog post HTML fixture for testing
- **`__snapshots__/`** - Snapshot files for regression testing
- **`README.md`** - This documentation file

## 🧪 Test Coverage

### Core Functionality
- ✅ Basic extractor registration and URL pattern matching
- ✅ Regex and string pattern support
- ✅ Multiple pattern arrays
- ✅ Priority system (first-match-wins)
- ✅ Override built-in extractors

### Error Handling
- ✅ Graceful fallback when extractors fail
- ✅ Empty extractors array handling
- ✅ URL pattern mismatches

### Consistency
- ✅ Snapshot testing for regression detection
- ✅ Cross-URL consistency validation
- ✅ Fallback behavior consistency

## 🚀 Running Tests

```bash
# Run all custom extractor tests
npm test -- tests/customExtractors/customExtractors.test.ts

# Run with watch mode during development
npm test -- tests/customExtractors/customExtractors.test.ts --watch

# Update snapshots after intentional changes
npm test -- tests/customExtractors/customExtractors.test.ts -u
```

## 🔧 Test Structure

The test suite uses a **Given/When/Then** pattern for clarity:

```typescript
test('should use custom extractor when URL pattern matches', async () => {
    // Given: A custom blog post extractor for example.com
    const customExtractor = createExtractor(BlogPostExtractor, demoHtml, url);
    
    // When: Processing content with matching URL pattern
    const response = await Defuddle(html, url, { extractors: [...] });

    // Then: Custom extractor should be used and extract structured content
    expect(response.extractorType).toBe('blogpost');
});
```

## 🎯 Example Usage

The tests demonstrate how to use custom extractors in real applications:

```typescript
import { Defuddle } from 'defuddle/node';
import { BaseExtractor } from 'defuddle/extractors/_base';

class MyCustomExtractor extends BaseExtractor {
    canExtract() {
        return this.document.querySelector('.my-content') !== null;
    }
    
    extract() {
        // Your custom extraction logic here
        return {
            content: '...',
            contentHtml: '...',
            variables: { title: '...', author: '...' }
        };
    }
}

const response = await Defuddle(html, url, {
    extractors: [{
        patterns: ['mysite.com', /mysite\.com\/posts\/\d+/],
        extractor: new MyCustomExtractor(document, url)
    }]
});
```

## 📈 Adding New Tests

1. **New HTML fixtures**: Add to this directory and load in tests
2. **New extractor types**: Create additional test extractor classes
3. **Edge cases**: Add specific test cases for new scenarios
4. **Snapshot updates**: Run with `-u` flag when results intentionally change

## 🤝 Contributing

When modifying these tests:
- Follow the Given/When/Then comment pattern
- Add descriptive test names that explain the scenario
- Update snapshots when extraction results change intentionally
- Ensure all tests pass before submitting PRs
