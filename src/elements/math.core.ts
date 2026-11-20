import {
	MathData,
	getBasicLatexFromElement,
	createMathElement,
	createMathRules
} from './math.base';

// Core build: no conversion libraries. LaTeX-only math is kept as text.
export const createCleanMathEl = (mathData: MathData | null, latex: string | null, isBlock: boolean, doc: Document): Element =>
	createMathElement(mathData, latex, isBlock, doc);

export const mathRules = createMathRules(getBasicLatexFromElement);
