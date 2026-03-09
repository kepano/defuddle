/**
 * Standardized transcript HTML and text construction.
 *
 * Used by YouTube (and potentially other video/audio extractors)
 * to produce consistent transcript markup.
 */

import { escapeHtml } from './dom';

export interface TranscriptSegment {
	/** Start time in seconds */
	start: number;
	/** Segment text (plain, not HTML-escaped) */
	text: string;
	/** Whether this segment starts a new speaker turn */
	speakerChange: boolean;
	/** Speaker index (0, 1, ...) for CSS classes */
	speaker?: number;
}

export interface TranscriptChapter {
	title: string;
	/** Start time in seconds */
	start: number;
}

export interface TranscriptResult {
	html: string;
	text: string;
}

/**
 * Format seconds as a human-readable timestamp (M:SS or H:MM:SS).
 */
export function formatTimestamp(seconds: number): string {
	const h = Math.floor(seconds / 3600);
	const m = Math.floor((seconds % 3600) / 60);
	const s = Math.floor(seconds % 60);

	if (h > 0) {
		return `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
	}
	return `${m}:${String(s).padStart(2, '0')}`;
}

/**
 * Build transcript HTML and text from segments and optional chapters.
 *
 * @param site - Site identifier for wrapper class (e.g. "youtube")
 * @param segments - Grouped transcript segments with timestamps and speaker info
 * @param chapters - Optional chapter headings with start times
 */
export function buildTranscript(
	site: string,
	segments: TranscriptSegment[],
	chapters: TranscriptChapter[] = [],
): TranscriptResult {
	const sortedChapters = [...chapters].sort((a, b) => a.start - b.start);
	let chapterIdx = 0;

	const htmlParts: string[] = [];
	const textParts: string[] = [];

	for (const segment of segments) {
		// Insert chapter headings before this segment
		while (chapterIdx < sortedChapters.length && sortedChapters[chapterIdx].start <= segment.start) {
			const title = sortedChapters[chapterIdx].title;
			htmlParts.push(`<h3>${escapeHtml(title)}</h3>`);
			if (textParts.length > 0) textParts.push('');
			textParts.push(`### ${title}`);
			textParts.push('');
			chapterIdx++;
		}

		const timestamp = formatTimestamp(segment.start);
		const speakerClass = segment.speaker !== undefined ? ` speaker-${segment.speaker}` : '';
		const tsHtml = `<strong><span class="timestamp" data-timestamp="${segment.start}">${timestamp}</span></strong>`;
		htmlParts.push(`<p class="transcript-segment${speakerClass}">${tsHtml} · ${escapeHtml(segment.text)}</p>`);

		if (segment.speakerChange && textParts.length > 0) {
			textParts.push('');
		}
		textParts.push(`**${timestamp}** · ${segment.text}`);
	}

	return {
		html: `<div class="${site} transcript">\n<h2>Transcript</h2>\n${htmlParts.join('\n')}\n</div>`,
		text: textParts.join('\n'),
	};
}
