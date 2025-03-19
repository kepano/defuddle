// This file serves as an entry point for math functionality
// Webpack's alias configuration will determine whether this imports from math.core or math.full
export type { MathData } from './math.base';
export { mathStandardizationRules, createCleanMathEl } from './math.core'; 