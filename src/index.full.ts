import { Defuddle } from './defuddle';
import { DefuddleOptions, DefuddleResponse } from './types';

// Re-export everything
export { Defuddle, DefuddleOptions, DefuddleResponse };

// This file exists to ensure proper type generation for the full bundle
// The actual math module switching is handled by webpack's alias configuration 