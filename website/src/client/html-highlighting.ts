import { tagHighlighter, tags } from '@lezer/highlight';

// Flexoki mappings: https://stephango.com/flexoki#mappings
export const htmlHighlightStyle = tagHighlighter([
	{ tag: tags.tagName, class: 'syn-tag' },
	{ tag: [tags.attributeName, tags.propertyName, tags.variableName], class: 'syn-variable' },
	{ tag: [tags.string, tags.attributeValue, tags.regexp], class: 'syn-string' },
	{ tag: [tags.number, tags.unit], class: 'syn-number' },
	{ tag: [tags.bool, tags.null, tags.atom, tags.color, tags.character, tags.constant(tags.variableName)], class: 'syn-constant' },
	{ tag: tags.keyword, class: 'syn-keyword' },
	{ tag: tags.moduleKeyword, class: 'syn-import' },
	{ tag: [tags.punctuation, tags.operator], class: 'syn-punctuation' },
	{ tag: tags.comment, class: 'syn-comment' },
	{ tag: [tags.meta, tags.typeName, tags.className], class: 'syn-language' },
	{ tag: [tags.function(tags.variableName), tags.function(tags.propertyName)], class: 'syn-function' },
	{ tag: tags.invalid, class: 'syn-invalid' },
]);
