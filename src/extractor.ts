// Public entry for extractor authors.
//
// Import `BaseExtractor` from here to write a custom site-specific extractor,
// and either load it via the CLI's `--extractor <path>` flag or register it at
// runtime with `ExtractorRegistry.register(...)`.
//
// Example user file (loaded via --extractor):
//
//   import { BaseExtractor } from 'defuddle/extractor';
//
//   class MyExtractor extends BaseExtractor {
//     canExtract() { return false; }
//     canExtractAsync() { return true; }
//     prefersAsync() { return true; }
//     async extractAsync() { /* fetch additional pages, return ExtractorResult */ }
//   }
//
//   export default {
//     patterns: [/^https?:\/\/example\.com\/article\//],
//     extractor: MyExtractor,
//   };

export { BaseExtractor } from './extractors/_base';
export type { ExtractorOptions } from './extractors/_base';
export type { ExtractorResult, ExtractedContent, ExtractorVariables } from './types/extractors';
export { ExtractorRegistry } from './extractor-registry';
export type { ExtractorMapping, ExtractorConstructor } from './extractor-registry';
