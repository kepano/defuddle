/** Matches dates: "March 24, 2026", "24 March 2026", or "2026-04-07" */
const DATE_RE = /\b(?:(?:Jan(?:uary)?|Feb(?:ruary)?|Mar(?:ch)?|Apr(?:il)?|May|Jun(?:e)?|Jul(?:y)?|Aug(?:ust)?|Sep(?:t(?:ember)?)?|Oct(?:ober)?|Nov(?:ember)?|Dec(?:ember)?)\s+\d{1,2}[\s,]+\d{4}|\d{1,2}(?:st|nd|rd|th)?\s+(?:Jan(?:uary)?|Feb(?:ruary)?|Mar(?:ch)?|Apr(?:il)?|May|Jun(?:e)?|Jul(?:y)?|Aug(?:ust)?|Sep(?:t(?:ember)?)?|Oct(?:ober)?|Nov(?:ember)?|Dec(?:ember)?)\s+\d{4}|\d{4}[-/]\d{1,2}[-/]\d{1,2})\b/i;

/**
 * Removes a date-containing block that is a direct sibling of the h1.
 * Complements removeHeroHeader (which targets containers wrapping h1+time together)
 * and the inline metadata-div removal in removeByContentPattern (position-based).
 * Only called when metadata extraction already confirmed the sibling is a byline
 * (metadata.published || metadata.author), to avoid removing legitimate content.
 */
export function removeMetadataBlock(mainContent: Element): void {
	const contentH1 = mainContent.querySelector('h1');
	if (!contentH1) return;

	let sibling = contentH1.nextElementSibling;
	for (let i = 0; i < 3 && sibling; i++) {
		const next = sibling.nextElementSibling;
		const text = sibling.textContent?.trim() || '';
		// Short element adjacent to h1 containing a date — it's a metadata block
		if (text.length > 0 && text.length < 300) {
			let hasDate = DATE_RE.test(text);
			if (!hasDate) {
				for (const el of sibling.querySelectorAll('p, time')) {
					if (DATE_RE.test(el.textContent?.trim() || '')) { hasDate = true; break; }
				}
			}
			if (hasDate) {
				sibling.remove();
				break;
			}
		}
		sibling = next;
	}
}
