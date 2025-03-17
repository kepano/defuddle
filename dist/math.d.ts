export interface MathData {
    mathml: string;
    latex: string | null;
    isBlock: boolean;
}
export declare const getMathMLFromElement: (el: Element) => MathData | null;
export declare const getLatexFromElement: (el: Element) => string | null;
export declare const isInlineOrBlock: (el: Element) => boolean;
export declare const createCleanMathEl: (mathData: MathData | null, latex: string | null, isBlock: boolean) => Element;
export declare const mathStandardizationRules: {
    selector: string;
    element: string;
    transform: (el: Element) => Element;
}[];
