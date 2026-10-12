import { MathMLToLaTeX } from 'mathml-to-latex';
import {
	MathData,
	LatexToMathML,
	getMathMLFromElement,
	getBasicLatexFromElement,
	createMathElement,
	createMathRules
} from './math.base';
import { parseHTML } from '../utils/dom';
import { serializeMathMLForConversion } from '../utils/mathml';

export const getLatexFromElement = (el: Element): string | null => {
	// First try basic LaTeX extraction
	const basicLatex = getBasicLatexFromElement(el);
	if (basicLatex) {
		return basicLatex;
	}

	// If no LaTeX found but we have MathML, convert it
	const mathData = getMathMLFromElement(el);
	if (mathData?.mathml) {
		try {
			return MathMLToLaTeX.convert(serializeMathMLForConversion(mathData.mathml, el.ownerDocument));
		} catch (e) {
			console.warn('Failed to convert MathML to LaTeX:', e);
		}
	}

	return null;
};

const latexToMathML: LatexToMathML = (latex, isBlock, doc) => {
	try {
		const temml = require('temml');
		const mathml = temml.renderToString(latex, {
			displayMode: isBlock,
			throwOnError: false
		});
		return parseHTML(doc, mathml).querySelector('math');
	} catch (e) {
		console.warn('Failed to convert LaTeX to MathML:', e);
		return null;
	}
};

export const createCleanMathEl = (mathData: MathData | null, latex: string | null, isBlock: boolean, doc: Document): Element =>
	createMathElement(mathData, latex, isBlock, doc, latexToMathML);

export const mathRules = createMathRules(getLatexFromElement, latexToMathML);
