import { Defuddle } from './defuddle';
export type { DefuddleOptions, DefuddleResponse, DefuddleMetadata } from './types';

// extractor types
export { ExtractorResult, ExtractorVariables, ExtractedContent } from './types/extractors'
export { BaseExtractor } from './extractors/_base'

// Export Defuddle as default
export default Defuddle; 