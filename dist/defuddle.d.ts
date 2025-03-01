import { DefuddleOptions, DefuddleResponse } from './types';
export declare class Defuddle {
    private doc;
    private options;
    private debug;
    /**
     * Create a new Defuddle instance
     * @param doc - The document to parse
     * @param options - Options for parsing
     */
    constructor(doc: Document, options?: DefuddleOptions);
    /**
     * Parse the document and extract its main content
     */
    parse(): DefuddleResponse;
    private _log;
    private _evaluateMediaQueries;
    private applyMobileStyles;
    private removeHiddenElements;
    private removeClutter;
    private cleanContent;
    private handleHeadings;
    private removeHtmlComments;
    private stripUnwantedAttributes;
    private removeEmptyElements;
    private findSmallImages;
    private removeSmallImages;
    private getElementIdentifier;
    private findMainContent;
    private findContentByScoring;
    private getElementSelector;
    private scoreElements;
    private scoreElement;
}
