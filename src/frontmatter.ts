import { countWords } from './utils';
import type { DefuddleResponse } from './types';

// Count words, treating each CJK character as one word (mirrors countWords),
// and truncate the text once maxWords is exceeded.
function truncateWords(text: string, maxWords: number): string {
	let words = 0;
	let inWord = false;

	for (let i = 0; i < text.length; i++) {
		const code = text.charCodeAt(i);
		const isCJK = (
			(code >= 0x3040 && code <= 0x309f) ||
			(code >= 0x30a0 && code <= 0x30ff) ||
			(code >= 0x3400 && code <= 0x4dbf) ||
			(code >= 0x4e00 && code <= 0x9fff) ||
			(code >= 0xf900 && code <= 0xfaff) ||
			(code >= 0xac00 && code <= 0xd7af)
		);

		if (isCJK) {
			words++;
			inWord = false;
		} else if (code <= 32) {
			inWord = false;
		} else if (!inWord) {
			words++;
			inWord = true;
		}

		if (words > maxWords) {
			return text.slice(0, i).trimEnd() + '…';
		}
	}
	return text;
}

/**
 * Build a YAML frontmatter block ("---\n…\n---\n\n") from extracted metadata.
 * Shared by the CLI (`--frontmatter`) and the defuddle.md worker so both emit
 * identical output. `source:` is only emitted when a sourceUrl is provided
 * (CLI stdin/file input has no URL).
 */
export function buildFrontmatter(result: DefuddleResponse, sourceUrl?: string): string {
	const lines: string[] = ['---'];

	// Escape a string for use as a YAML double-quoted value
	const esc = (s: string) => s.replace(/"/g, '\\"').replace(/\n/g, ' ');

	if (result.title) lines.push(`title: "${esc(result.title)}"`);
	if (result.author) lines.push(`author: "${esc(result.author)}"`);
	if (result.site) lines.push(`site: "${esc(result.site)}"`);
	if (result.published) lines.push(`published: ${result.published}`);
	if (sourceUrl) lines.push(`source: "${sourceUrl}"`);
	if (result.domain) lines.push(`domain: "${result.domain}"`);
	if (result.language) lines.push(`language: "${result.language}"`);
	if (result.description) {
		const desc = countWords(result.description) > 300
			? truncateWords(result.description, 300)
			: result.description;
		lines.push(`description: "${esc(desc)}"`);
	}
	if (result.wordCount) lines.push(`word_count: ${result.wordCount}`);

	lines.push('---');
	return lines.join('\n') + '\n\n';
}
