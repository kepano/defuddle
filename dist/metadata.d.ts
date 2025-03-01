import { DefuddleMetadata } from './types';
export declare class MetadataExtractor {
    static extract(doc: Document, schemaOrgData: any): DefuddleMetadata;
    private static getAuthor;
    private static getSite;
    private static getTitle;
    private static getDescription;
    private static getImage;
    private static getFavicon;
    private static getPublished;
    private static getMetaContent;
    private static getTimeElement;
    private static decodeHTMLEntities;
    private static getSchemaProperty;
    static extractSchemaOrgData(doc: Document): any;
}
