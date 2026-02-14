import { describe, test, expect } from 'vitest';
import { readFileSync } from 'fs';
import { join } from 'path';
import { Defuddle } from '../../src/node';
import { BaseExtractor } from '../../src/';
import { ExtractorResult } from '../../src';
import { JSDOM } from 'jsdom';

/**
 * BlogPostExtractor - A comprehensive blog post extractor
 * 
 * Extracts structured blog content including:
 * - Post title, author, publication date
 * - Main content with proper HTML structure
 * - Metadata like categories and tags
 * - Custom data attributes
 */
class BlogPostExtractor extends BaseExtractor {
    canExtract(): boolean {
        return this.document.querySelector('.blog-post') !== null;
    }

    extract(): ExtractorResult {
        // Extract main elements
        const postElement = this.document.querySelector('.blog-post');
        const titleElement = this.document.querySelector('.post-title');
        const contentElement = this.document.querySelector('.post-content');
        const authorElement = this.document.querySelector('.post-meta .author strong');
        const publishedElement = this.document.querySelector('.post-meta time');
        const categoryElement = this.document.querySelector('.post-meta .category');
        const tagsElements = this.document.querySelectorAll('.post-tags .tag');

        // Extract text content
        const title = titleElement?.textContent?.trim() || '';
        const content = contentElement?.innerHTML || '';
        const author = authorElement?.textContent?.trim() || '';
        const published = publishedElement?.getAttribute('datetime') || '';
        const category = categoryElement?.textContent?.trim() || '';
        const tags = Array.from(tagsElements).map(tag => tag.textContent?.trim()).filter(Boolean);

        // Extract custom data attributes
        const postId = postElement?.getAttribute('data-post-id') || '';
        const postCategory = postElement?.getAttribute('data-category') || '';

        return {
            content: content,
            contentHtml: content,
            extractedContent: {
                postId: postId,
                category: postCategory,
                tags: tags.join(', ')
            },
            variables: {
                title: title,
                author: author,
                published: published,
                site: 'Custom Blog',
                description: `Blog post about ${category.toLowerCase()}`,
                wordCount: this.countWords(content).toString(),
                category: category
            }
        };
    }

    private countWords(html: string): number {
        const text = html.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
        return text ? text.split(' ').length : 0;
    }
}

/**
 * AlternativeBlogExtractor - Simple alternative extractor for priority testing
 * 
 * Used to test that the first matching extractor takes precedence
 * when multiple extractors match the same content.
 */
class AlternativeBlogExtractor extends BaseExtractor {
    canExtract(): boolean {
        return this.document.querySelector('.blog-post') !== null;
    }

    extract(): ExtractorResult {
        return {
            content: '<p>Alternative extractor was used</p>',
            contentHtml: '<p>Alternative extractor was used</p>',
            variables: {
                title: 'Alternative Title',
                site: 'Alternative Blog',
                description: 'Content from alternative extractor'
            }
        };
    }
}

/**
 * SpecificUrlExtractor - URL-conditional extractor
 * 
 * Only activates for URLs containing 'specific-test', demonstrating
 * how extractors can combine DOM structure and URL pattern matching.
 */
class SpecificUrlExtractor extends BaseExtractor {
    canExtract(): boolean {
        return this.document.querySelector('.blog-post') !== null && 
               this.url.includes('specific-test');
    }

    extract(): ExtractorResult {
        return {
            content: '<p>Specific URL extractor was used</p>',
            contentHtml: '<p>Specific URL extractor was used</p>',
            variables: {
                title: 'Specific URL Content',
                site: 'Specific Site',
                description: 'Content extracted by specific URL extractor'
            }
        };
    }
}

// =============================================================================
// Main Test Suite
// =============================================================================

describe('Custom Extractors', () => {
    // Load test HTML fixture
    const demoHtmlPath = join(__dirname, 'demo.html');
    const demoHtml = readFileSync(demoHtmlPath, 'utf-8');

    /**
     * Helper function to create extractor instances with proper JSDOM context
     * 
     * This is necessary because extractors need a real DOM to work with,
     * but we're running in a Node.js environment during testing.
     */
    const createExtractor = <T extends BaseExtractor>(
        ExtractorClass: new (document: Document, url: string, schemaOrgData?: any) => T, 
        html: string, 
        url: string
    ) => {
        const dom = new JSDOM(html);
        return new ExtractorClass(dom.window.document, url, {});
    };

    describe('Basic Custom Extractor Functionality', () => {
        test('should use custom extractor when URL pattern matches', async () => {
            // Given: A custom blog post extractor for example.com
            const customExtractor = createExtractor(BlogPostExtractor, demoHtml, 'https://example.com/blog/post');
            
            // When: Processing content with matching URL pattern
            const response = await Defuddle(demoHtml, 'https://example.com/blog/post', {
                extractors: [{
                    patterns: ['example.com'],
                    extractor: customExtractor
                }],
                separateMarkdown: true
            });

            // Then: Custom extractor should be used and extract structured content
            expect(response.extractorType).toBe('blogpost');
            expect(response.title).toBe('Understanding Custom Content Extraction');
            expect(response.author).toBe('Jane Doe');
            expect(response.site).toBe('Custom Blog');
            expect(response.content).toContain('This is a sample blog post');
            expect(response.content).toContain('Custom extractors allow you to leverage');
            expect(response.wordCount).toBeGreaterThan(0);
        });

        test('should match regex URL patterns correctly', async () => {
            // Given: A custom extractor with regex pattern for blog posts
            const customExtractor = createExtractor(BlogPostExtractor, demoHtml, 'https://blog.example.com/posts/123');
            
            // When: Processing content with URL matching regex pattern
            const response = await Defuddle(demoHtml, 'https://blog.example.com/posts/123', {
                extractors: [{
                    patterns: [/blog\.example\.com\/posts\/\d+/],
                    extractor: customExtractor
                }],
                separateMarkdown: true
            });

            // Then: Should successfully extract using regex pattern match
            expect(response.extractorType).toBe('blogpost');
            expect(response.title).toBe('Understanding Custom Content Extraction');
        });

        test('should fall back to default extraction when pattern does not match', async () => {
            // Given: A custom extractor configured for example.com
            const customExtractor = createExtractor(BlogPostExtractor, demoHtml, 'https://different-site.com/article');
            
            // When: Processing content from a non-matching domain
            const response = await Defuddle(demoHtml, 'https://different-site.com/article', {
                extractors: [{
                    patterns: ['example.com'],
                    extractor: customExtractor
                }],
                separateMarkdown: true
            });

            // Then: Should fall back to default Defuddle extraction
            expect(response.extractorType).toBeUndefined();
            expect(response.title).toBe('Custom Blog Post - Tech Blog'); // From HTML meta tag
        });
    });

    describe('Multiple Custom Extractors', () => {
        test('should use first matching extractor (priority order)', async () => {
            // Given: Two extractors that both match the same URL pattern
            const firstExtractor = createExtractor(BlogPostExtractor, demoHtml, 'https://example.com/blog/post');
            const secondExtractor = createExtractor(AlternativeBlogExtractor, demoHtml, 'https://example.com/blog/post');
            
            // When: Both extractors are registered for the same pattern
            const response = await Defuddle(demoHtml, 'https://example.com/blog/post', {
                extractors: [
                    {
                        patterns: ['example.com'],
                        extractor: firstExtractor  // This should be used (first in array)
                    },
                    {
                        patterns: ['example.com'],
                        extractor: secondExtractor
                    }
                ],
                separateMarkdown: true
            });

            // Then: First extractor should take precedence
            expect(response.extractorType).toBe('blogpost');
            expect(response.title).toBe('Understanding Custom Content Extraction');
            expect(response.site).toBe('Custom Blog');
        });

        test('should respect registration order when multiple patterns match', async () => {
            // Given: Two extractors with different pattern specificity
            const generalExtractor = createExtractor(AlternativeBlogExtractor, demoHtml, 'https://example.com/specific-test');
            const specificExtractor = createExtractor(SpecificUrlExtractor, demoHtml, 'https://example.com/specific-test');
            
            // When: URL matches both a general and specific pattern
            const response = await Defuddle(demoHtml, 'https://example.com/specific-test', {
                extractors: [
                    {
                        patterns: ['example.com'],           // General pattern (registered first)
                        extractor: generalExtractor
                    },
                    {
                        patterns: [/specific-test/],         // More specific pattern
                        extractor: specificExtractor
                    }
                ],
                separateMarkdown: true
            });

            // Then: First registered extractor should be used (order matters, not specificity)
            expect(response.extractorType).toBe('alternativeblog');
            expect(response.title).toBe('Alternative Title');
        });
    });

    describe('URL Pattern Matching', () => {
        test('should match string patterns (domain contains)', async () => {
            // Given: An extractor configured with string pattern matching
            const customExtractor = createExtractor(BlogPostExtractor, demoHtml, 'https://myblog.example.com/post/123');
            
            // When: Processing URL that contains the pattern string
            const response = await Defuddle(demoHtml, 'https://myblog.example.com/post/123', {
                extractors: [{
                    patterns: ['example.com'],  // Should match myblog.example.com
                    extractor: customExtractor
                }]
            });

            // Then: Should successfully match and extract
            expect(response.extractorType).toBe('blogpost');
        });

        test('should match complex regex patterns', async () => {
            // Given: An extractor with a complex regex pattern
            const customExtractor = createExtractor(BlogPostExtractor, demoHtml, 'https://blog.example.com/post/understanding-extraction');
            
            // When: Processing URL that matches the regex pattern
            const response = await Defuddle(demoHtml, 'https://blog.example.com/post/understanding-extraction', {
                extractors: [{
                    patterns: [/^https:\/\/blog\.example\.com\/post\/.+/],  // Regex for specific URL structure
                    extractor: customExtractor
                }]
            });

            // Then: Should successfully match and extract
            expect(response.extractorType).toBe('blogpost');
        });

        test('should match any pattern from multiple pattern array', async () => {
            // Given: An extractor with multiple pattern options (strings and regex)
            const customExtractor = createExtractor(BlogPostExtractor, demoHtml, 'https://blog.example.org/article/test');
            
            // When: Processing URL that matches one of the patterns
            const response = await Defuddle(demoHtml, 'https://blog.example.org/article/test', {
                extractors: [{
                    patterns: [
                        'example.com',              // String pattern 1
                        'example.org',              // String pattern 2 (matches!)
                        /blog\.example\.net/        // Regex pattern 3
                    ],
                    extractor: customExtractor
                }]
            });

            // Then: Should match on example.org and extract successfully
            expect(response.extractorType).toBe('blogpost');
        });
    });

    describe('Extractor Priority System', () => {
        test('should prioritize custom extractors over built-in ones', async () => {
            // Given: A custom extractor for a domain that has a built-in extractor (Twitter)
            const customExtractor = createExtractor(BlogPostExtractor, demoHtml, 'https://twitter.com/user/status/123');
            
            // When: Processing content from twitter.com with custom extractor registered
            const response = await Defuddle(demoHtml, 'https://twitter.com/user/status/123', {
                extractors: [{
                    patterns: ['twitter.com'],
                    extractor: customExtractor
                }]
            });

            // Then: Custom extractor should override the built-in TwitterExtractor
            expect(response.extractorType).toBe('blogpost');
            expect(response.title).toBe('Understanding Custom Content Extraction');
        });
    });

    describe('Error Handling & Edge Cases', () => {
        test('should gracefully handle extractor that cannot extract', async () => {
            // Given: An extractor that always fails canExtract() check
            class FailingExtractor extends BaseExtractor {
                canExtract(): boolean {
                    return false; // Simulates extractor that can't handle this content
                }

                extract(): ExtractorResult {
                    return {
                        content: '',
                        contentHtml: ''
                    };
                }
            }

            const failingExtractor = createExtractor(FailingExtractor, demoHtml, 'https://example.com/test');
            
            // When: Processing with an extractor that can't extract
            const response = await Defuddle(demoHtml, 'https://example.com/test', {
                extractors: [{
                    patterns: ['example.com'],
                    extractor: failingExtractor
                }]
            });

            // Then: Should fall back gracefully to default Defuddle extraction
            expect(response.extractorType).toBeUndefined();
            expect(response.title).toBe('Custom Blog Post - Tech Blog');
        });

        test('should handle empty extractors array gracefully', async () => {
            // Given: No custom extractors configured
            // When: Processing content with empty extractors array
            const response = await Defuddle(demoHtml, 'https://example.com/test', {
                extractors: []
            });

            // Then: Should use default extraction without errors
            expect(response.extractorType).toBeUndefined();
            expect(response.title).toBe('Custom Blog Post - Tech Blog');
        });
    });

    describe('Snapshot Testing for Consistency', () => {
        test('should produce consistent extraction results across runs', async () => {
            // Given: A standard custom extractor setup
            const customExtractor = createExtractor(BlogPostExtractor, demoHtml, 'https://example.com/blog/post');
            
            // When: Processing the demo content
            const response = await Defuddle(demoHtml, 'https://example.com/blog/post', {
                extractors: [{
                    patterns: ['example.com'],
                    extractor: customExtractor
                }],
                separateMarkdown: true
            });

            // Then: Key extraction results should match previous snapshots
            const snapshot = {
                extractorType: response.extractorType,
                title: response.title,
                author: response.author,
                site: response.site,
                published: response.published,
                description: response.description,
                wordCount: response.wordCount,
                contentLength: response.content.length,
                markdownLength: response.contentMarkdown?.length || 0,
                // Include content previews for change detection
                contentPreview: response.content.substring(0, 200),
                markdownPreview: response.contentMarkdown?.substring(0, 200) || ''
            };

            expect(snapshot).toMatchSnapshot();
        });

        test('should produce consistent results across different matching URLs', async () => {
            // Given: Multiple URLs that should all match the same extractor
            const testCases = [
                'https://example.com/blog/post/1',
                'https://blog.example.com/articles/test',
                'https://example.com/posts/understanding-extraction'
            ];

            // When/Then: Each URL should produce consistent extraction results
            for (const url of testCases) {
                const customExtractor = createExtractor(BlogPostExtractor, demoHtml, url);
                
                const response = await Defuddle(demoHtml, url, {
                    extractors: [{
                        patterns: ['example.com'],
                        extractor: customExtractor
                    }]
                });

                const snapshot = {
                    url: url,
                    extractorType: response.extractorType,
                    title: response.title,
                    author: response.author,
                    wordCount: response.wordCount
                };

                expect(snapshot).toMatchSnapshot();
            }
        });

        test('should produce consistent fallback behavior when no extractor matches', async () => {
            // Given: A custom extractor that won't match the URL
            // When: Processing content that falls back to default extraction
            const response = await Defuddle(demoHtml, 'https://unknown-site.com/article', {
                extractors: [{
                    patterns: ['different-site.com'],  // Won't match unknown-site.com
                    extractor: createExtractor(BlogPostExtractor, demoHtml, 'https://unknown-site.com/article')
                }],
                separateMarkdown: true
            });

            // Then: Fallback behavior should be consistent
            const snapshot = {
                extractorType: response.extractorType,
                title: response.title,
                author: response.author,
                site: response.site,
                description: response.description,
                wordCount: response.wordCount,
                contentPreview: response.content.substring(0, 200)
            };

            expect(snapshot).toMatchSnapshot();
        });
    });
});
