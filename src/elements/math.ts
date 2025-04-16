// This file serves as an entry point for math functionality
// Webpack's alias configuration will determine whether this imports from math.core or math.full
export type { MathData } from './math.base';
export { mathRules, createCleanMathEl } from './math.core';
// The actual implementation exports are handled by webpack's alias configuration
// which will point to either math.core.ts or math.full.ts 