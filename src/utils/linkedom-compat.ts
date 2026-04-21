import { parseHTML } from 'linkedom';

const EXPLICITLY_CLOSED_VOID_PLACEHOLDER = 'defuddle-preserve-input';
const URL_ATTRIBUTES = ['href', 'src', 'poster'] as const;

function wrapHtmlFragment(html: string): string {
	if (/<\s*html[\s>]/i.test(html)) {
		return html;
	}

	return `<!DOCTYPE html><html><head></head><body>${html}</body></html>`;
}

function stripNamespacePrefixes(html: string): string {
	return html.replace(/<(\/?)([A-Za-z][\w.-]*):([A-Za-z][\w.-]*)(?=[\s/>])/g, '<$1$3');
}

function preserveExplicitlyClosedInput(html: string): string {
	return html.replace(
		/<input(\b[^>]*)>([\s\S]*?)<\/input>/gi,
		`<${EXPLICITLY_CLOSED_VOID_PLACEHOLDER}$1>$2</${EXPLICITLY_CLOSED_VOID_PLACEHOLDER}>`
	);
}

function decodeHtmlEntities(text: string): string {
	return text.replace(/&(#x?[0-9a-f]+|amp|apos|gt|lt|nbsp|quot);/gi, (entity, value) => {
		const normalized = value.toLowerCase();
		switch (normalized) {
			case 'amp':
				return '&';
			case 'apos':
				return '\'';
			case 'gt':
				return '>';
			case 'lt':
				return '<';
			case 'nbsp':
				return '\u00a0';
			case 'quot':
				return '"';
			default:
				if (!normalized.startsWith('#')) {
					return entity;
				}

				const isHex = normalized.startsWith('#x');
				const codePoint = Number.parseInt(normalized.slice(isHex ? 2 : 1), isHex ? 16 : 10);
				return Number.isFinite(codePoint) ? String.fromCodePoint(codePoint) : entity;
		}
	});
}

function resolveUrl(candidate: string, baseUrl: string): string {
	if (!candidate) return '';

	try {
		return baseUrl ? new URL(candidate, baseUrl).href : new URL(candidate).href;
	} catch {
		return '';
	}
}

function getResolvedBaseUrl(doc: Document, documentUrl?: string): string {
	const fallbackBase = documentUrl || (doc as any).URL || '';
	const baseHref = doc.querySelector('base[href]')?.getAttribute('href')?.trim() || '';
	return resolveUrl(baseHref, fallbackBase) || fallbackBase;
}

function absolutizeAttributeUrls(doc: Document, baseUrl: string): void {
	if (!baseUrl) return;

	for (const element of Array.from(doc.querySelectorAll('*'))) {
		for (const attribute of URL_ATTRIBUTES) {
			const value = element.getAttribute(attribute);
			if (!value) continue;

			const resolved = resolveUrl(value, baseUrl);
			if (resolved) {
				element.setAttribute(attribute, resolved);
			}
		}
	}

	const baseElement = doc.querySelector('base[href]');
	if (baseElement) {
		baseElement.setAttribute('href', baseUrl);
	}
}

function restoreExplicitlyClosedInputs(doc: Document): void {
	for (const placeholder of Array.from(doc.querySelectorAll(EXPLICITLY_CLOSED_VOID_PLACEHOLDER))) {
		const input = doc.createElement('input');
		for (const attribute of Array.from(placeholder.attributes)) {
			input.setAttribute(attribute.name, attribute.value);
		}
		while (placeholder.firstChild) {
			input.appendChild(placeholder.firstChild);
		}
		placeholder.parentNode?.replaceChild(input, placeholder);
	}
}

function decodeScriptText(doc: Document): void {
	for (const script of Array.from(doc.querySelectorAll('script'))) {
		const text = script.textContent || '';
		if (!text.includes('&')) continue;
		const decoded = decodeHtmlEntities(text);
		if (decoded !== text) {
			script.textContent = decoded;
		}
	}
}

/**
 * Parse HTML with linkedom and apply polyfills for missing DOM APIs
 * (styleSheets, getComputedStyle) that defuddle's internals expect.
 */
export function parseLinkedomHTML(html: string, url?: string): Document {
	const preparedHtml = wrapHtmlFragment(stripNamespacePrefixes(preserveExplicitlyClosedInput(html)));
	const { document } = parseHTML(preparedHtml);
	const doc = document as any;

	restoreExplicitlyClosedInputs(document as unknown as Document);
	decodeScriptText(document as unknown as Document);

	if (!doc.styleSheets) doc.styleSheets = [];
	if (doc.defaultView && !doc.defaultView.getComputedStyle) {
		doc.defaultView.getComputedStyle = () => ({ display: '' });
	}

	const resolvedBaseUrl = getResolvedBaseUrl(document as unknown as Document, url);
	if (resolvedBaseUrl) {
		doc.URL = resolvedBaseUrl;
		Object.defineProperty(doc, 'baseURI', {
			configurable: true,
			value: resolvedBaseUrl,
		});
	}

	absolutizeAttributeUrls(document as unknown as Document, resolvedBaseUrl);

	return document as unknown as Document;
}
