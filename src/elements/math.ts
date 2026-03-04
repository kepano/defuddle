// This file serves as an entry point for math functionality
// Defaults to math.core (no heavy dependencies).
// Webpack's alias configuration overrides this for the full bundle.
// The Node.js entry point imports math.full directly.
export type { MathData } from './math.base';
export { mathRules, createCleanMathEl } from './math.core';