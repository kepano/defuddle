// This file serves as an entry point for math functionality.
// Webpack's alias configuration overrides this for the browser core bundle (→ math.core)
// and full bundle (→ math.full). In the Node.js tsc build, this file is used directly,
// so it exports from math.full to enable MathML→LaTeX conversion.
export type { MathData } from './math.base';
export { mathRules, createCleanMathEl } from './math.full';