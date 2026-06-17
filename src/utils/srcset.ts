export interface SrcsetCandidate {
	url: string;
	descriptor?: string;
	width?: number;
	density?: number;
}

const IMAGE_EXTENSION_RE = '(?:jpg|jpeg|png|webp|gif|avif|svg)';
const CANDIDATE_SEPARATOR_RE = new RegExp(
	`(?:,\\s*(?=(?:https?:)?//|/(?!/)|\\.{1,2}/)|,\\s+(?=[^,\\s]+\\.${IMAGE_EXTENSION_RE}(?:[?#\\s,]|$))|,(?=[^,/\\s]+\\.${IMAGE_EXTENSION_RE}(?:[?#\\s,]|$)))`,
	'i'
);
const WIDTH_DESCRIPTOR_RE = /^(\d+)w$/i;
const DENSITY_DESCRIPTOR_RE = /^(\d+(?:\.\d+)?)x$/i;

function parseDescriptor(value: string): Pick<SrcsetCandidate, 'descriptor' | 'width' | 'density'> {
	const descriptor = value.replace(/,$/, '');
	const widthMatch = descriptor.match(WIDTH_DESCRIPTOR_RE);
	if (widthMatch) {
		return { descriptor, width: parseInt(widthMatch[1], 10) };
	}

	const densityMatch = descriptor.match(DENSITY_DESCRIPTOR_RE);
	if (densityMatch) {
		return { descriptor, density: parseFloat(densityMatch[1]) };
	}

	return {};
}

export function parseSrcset(srcset: string): SrcsetCandidate[] {
	if (!srcset || !srcset.trim()) return [];

	const candidates: SrcsetCandidate[] = [];
	for (const rawCandidate of srcset.trim().split(CANDIDATE_SEPARATOR_RE)) {
		const candidate = rawCandidate.replace(/^,\s*/, '').trim();
		if (!candidate) continue;

		const parts = candidate.split(/\s+/);
		const descriptor = parts.length > 1 ? parseDescriptor(parts[parts.length - 1]) : {};
		const urlParts = descriptor.descriptor ? parts.slice(0, -1) : parts;
		const url = urlParts.join(' ').trim();

		if (url) {
			candidates.push({ url, ...descriptor });
		}
	}

	return candidates;
}

export function getFirstSrcsetUrl(srcset: string, options: { skipSvgDataUrls?: boolean } = {}): string | null {
	for (const candidate of parseSrcset(srcset)) {
		if (options.skipSvgDataUrls && candidate.url.startsWith('data:image/svg+xml')) continue;
		return candidate.url;
	}

	return null;
}

export function getLargestWidthSrcsetUrl(srcset: string): string | null {
	let bestUrl: string | null = null;
	let bestWidth = 0;

	for (const candidate of parseSrcset(srcset)) {
		if (candidate.width && candidate.width > bestWidth) {
			bestWidth = candidate.width;
			bestUrl = candidate.url;
		}
	}

	return bestUrl;
}

export function formatSrcset(candidates: SrcsetCandidate[], resolveUrl: (url: string) => string): string {
	return candidates
		.map(candidate => `${resolveUrl(candidate.url)}${candidate.descriptor ? ` ${candidate.descriptor}` : ''}`)
		.join(', ');
}
