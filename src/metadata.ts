import { DefuddleMetadata, MetaTagItem } from './types';
import { countWords } from './utils';

export class MetadataExtractor {
	static extract(doc: Document, schemaOrgData: any, metaTags: MetaTagItem[]): DefuddleMetadata {
		let domain = '';
		let url = '';

		try {
			// Try to get URL from document location
			url = doc.location?.href || '';
			
			// If no URL from location, try other sources
			if (!url) {
				url = this.getMetaContent(metaTags, "property", "og:url") ||
					this.getMetaContent(metaTags, "property", "twitter:url") ||
					this.getSchemaProperty(schemaOrgData, 'url') ||
					this.getSchemaProperty(schemaOrgData, 'mainEntityOfPage.url') ||
					this.getSchemaProperty(schemaOrgData, 'mainEntity.url') ||
					this.getSchemaProperty(schemaOrgData, 'WebSite.url') ||
					doc.querySelector('link[rel="canonical"]')?.getAttribute('href') || '';
			}

			if (url) {
				try {
					domain = new URL(url).hostname.replace(/^www\./, '');
				} catch (e) {
					console.warn('Failed to parse URL:', e);
				}
			}
		} catch (e) {
			// If URL parsing fails, try to get from base tag
			const baseTag = doc.querySelector('base[href]');
			if (baseTag) {
				try {
					url = baseTag.getAttribute('href') || '';
					domain = new URL(url).hostname.replace(/^www\./, '');
				} catch (e) {
					console.warn('Failed to parse base URL:', e);
				}
			}
		}

		const siteName = this.getSiteName(schemaOrgData, metaTags);
		const { title, detectedSiteName } = this.cleanTitle(this.getBestTitle(doc, schemaOrgData, metaTags, domain, siteName), siteName);
		const author = this.getAuthor(doc, schemaOrgData, metaTags);
		// Only use author as site fallback for short single-entity names (personal blogs);
		// multi-author strings with commas are not suitable as site identifiers.
		const authorAsSite = author && !author.includes(',') ? author : '';
		const site = siteName || detectedSiteName || authorAsSite || domain || '';

		return {
			title,
			description: this.getDescription(doc, schemaOrgData, metaTags),
			domain,
			favicon: this.getFavicon(doc, url, metaTags),
			image: this.getImage(doc, schemaOrgData, metaTags),
			language: this.getLanguage(doc, schemaOrgData, metaTags),
			published: this.getPublished(doc, schemaOrgData, metaTags),
			author,
			site,
			schemaOrgData,
			wordCount: 0,
			parseTime: 0
		};
	}

	// Returns true if the string looks like an unresolved template literal
	// e.g. "#author.fullName}" (missing opening brace), "{{author}}", etc.
	private static isTemplateArtifact(s: string): boolean {
		return /[{}]/.test(s) || /^#[a-zA-Z]/.test(s);
	}

	private static getAuthor(doc: Document, schemaOrgData: any, metaTags: MetaTagItem[]): string {
		let authorsString: string | undefined;

		// Meta tags - typically expect a single string, possibly comma-separated
		authorsString = this.getMetaContent(metaTags, "name", "sailthru.author") ||
			this.getMetaContent(metaTags, "property", "author") ||
			this.getMetaContent(metaTags, "name", "author") ||
			this.getMetaContent(metaTags, "name", "byl") ||
			this.getMetaContent(metaTags, "name", "authorList");
		if (authorsString && !this.isTemplateArtifact(authorsString)) return this.cleanAuthorString(authorsString);

		// Conventions for research paper meta tags
		let authorsStrings: string[] = this.getMetaContents(metaTags, "name", "citation_author").filter(s => !this.isTemplateArtifact(s));
		if (authorsStrings.length === 0) {
			authorsStrings = this.getMetaContents(metaTags, "property", "dc.creator").filter(s => !this.isTemplateArtifact(s));
		}
		if (authorsStrings.length > 0) {
			authorsString = authorsStrings.map(s => {
				if (!s.includes(',')) return s.trim();
				const parts = /(.*),\s(.*)/.exec(s);
				if (parts && parts.length === 3) {
					return `${parts[2]} ${parts[1]}`;
				}
				return s.trim();
			}).join(', ');
			return authorsString;
		}

		// 2. Schema.org data - deduplicate if it's a list
		let schemaAuthors = this.getSchemaProperty(schemaOrgData, 'author.name') ||
			this.getSchemaProperty(schemaOrgData, 'author.[].name');
		
		if (schemaAuthors) {
			const parts = schemaAuthors.split(',')
				.map(part => part.trim().replace(/,$/, '').trim())
				.filter(Boolean);
			if (parts.length > 0) {
				let uniqueSchemaAuthors = [...new Set(parts)];
				if (uniqueSchemaAuthors.length > 10) {
					uniqueSchemaAuthors = uniqueSchemaAuthors.slice(0, 10);
				}
				return uniqueSchemaAuthors.join(', ');
			}
		}

		// 3. DOM elements
		const collectedAuthorsFromDOM: string[] = [];
		const addDomAuthor = (value: string | null | undefined) => {
			if (!value) return;
			value.split(',').forEach(namePart => {
				const cleanedName = namePart.replace(/\s+/g, ' ').trim().replace(/,$/, '').trim();
				const lowerCleanedName = cleanedName.toLowerCase();
				if (cleanedName && lowerCleanedName !== 'author' && lowerCleanedName !== 'authors') {
					collectedAuthorsFromDOM.push(cleanedName);
				}
			});
		};

		// maxMatches: skip ambiguous selectors with too many matches
		// (e.g. testimonials, comments, contributor lists)
		const domAuthorSelectors: { selector: string; maxMatches?: number }[] = [
			{ selector: '[itemprop="author"]' },
			{ selector: '.author', maxMatches: 3 },
			{ selector: '[href*="/author/"]', maxMatches: 3 },
			{ selector: '.authors a', maxMatches: 3 },
		];

		for (const { selector, maxMatches } of domAuthorSelectors) {
			const matches = doc.querySelectorAll(selector);
			if (maxMatches && matches.length > maxMatches) continue;
			matches.forEach(el => addDomAuthor(el.textContent));
		}

		if (collectedAuthorsFromDOM.length > 0) {
			let uniqueAuthors = [...new Set(collectedAuthorsFromDOM.map(name => name.trim()).filter(Boolean))];
			// Remove entries that are superstrings of a shorter entry already present
			if (uniqueAuthors.length > 1) {
				uniqueAuthors = uniqueAuthors.filter(a =>
					!uniqueAuthors.some(b => b !== a && a.includes(b))
				);
			}
			if (uniqueAuthors.length > 0) {
				if (uniqueAuthors.length > 10) {
					uniqueAuthors = uniqueAuthors.slice(0, 10);
				}
				return uniqueAuthors.join(', ');
			}
		}

		// 4. Author near article heading (byline patterns and date-adjacent names)
		const h1 = doc.querySelector('h1');
		if (h1) {
			// Check siblings of h1 for date-adjacent author names
			let sibling = h1.nextElementSibling;
			for (let i = 0; i < 3 && sibling; i++) {
				const siblingText = sibling.textContent?.trim() || '';
				// Check both combined text and individual children — some DOMs (e.g. linkedom)
				// omit whitespace between elements, which breaks word-boundary matching
				const childEls = Array.from(sibling.querySelectorAll('p, time'));
				const hasDateChild = childEls.some(el => !!this.parseDateText(el.textContent?.trim() || ''));
				const hasSiblingDate = !!this.parseDateText(siblingText) || hasDateChild;
				if (hasSiblingDate) {
					const links = sibling.querySelectorAll('a');
					// Only treat the link as an author if there is exactly one —
					// multiple links indicate category/tag lists, not a byline.
					if (links.length === 1) {
						const linkText = (links[0].textContent?.trim() || '').replace(/\u00a0/g, ' ');
						if (linkText.length > 0 && linkText.length < 100 && !this.parseDateText(linkText)) {
							return linkText;
						}
					}
					// Check for plain-text author in a non-date <p> child.
					// Guard: the date must be in a <p>/<time> child (not just anywhere in the
					// combined text), and the sibling must be a short metadata-only block
					// (< 300 chars) to avoid treating article sections as author bylines.
					if (hasDateChild && siblingText.length < 300) {
						for (const p of childEls) {
							if (p.tagName !== 'P') continue;
							const pText = (p.textContent?.trim() || '').replace(/\u00a0/g, ' ');
							if (pText.length > 0 && pText.length < 150 && !this.parseDateText(pText)) {
								return pText;
							}
						}
					}
				}
				sibling = sibling.nextElementSibling;
			}

			// Search for "By ..." bylines near h1: check siblings of h1
			// and siblings of its ancestor containers (up to 3 levels)
			let bylineScope: Element | null = h1;
			for (let depth = 0; depth < 3 && bylineScope; depth++) {
				let bylineCandidate = bylineScope.previousElementSibling;
				// Check a few siblings before
				for (let i = 0; i < 3 && bylineCandidate; i++) {
					const bylineResult = this.extractByline(bylineCandidate);
					if (bylineResult) return bylineResult;
					bylineCandidate = bylineCandidate.previousElementSibling;
				}
				// Check a few siblings after
				bylineCandidate = bylineScope.nextElementSibling;
				for (let i = 0; i < 3 && bylineCandidate; i++) {
					const bylineResult = this.extractByline(bylineCandidate);
					if (bylineResult) return bylineResult;
					bylineCandidate = bylineCandidate.nextElementSibling;
				}
				bylineScope = bylineScope.parentElement;
			}
		}

		return '';
	}

	private static extractByline(el: Element): string | null {
		// Check the element itself and its direct children for "By ..." text
		const candidates = [el, ...el.querySelectorAll('p, span, address')];
		for (const candidate of candidates) {
			const text = (candidate.textContent?.trim() || '').replace(/\u00a0/g, ' ');
			if (text.length > 0 && text.length < 50) {
				const bylineMatch = text.match(/^By\s+([A-Z].+)$/i);
				if (bylineMatch) {
					return bylineMatch[1].trim();
				}
			}
		}
		return null;
	}

	private static cleanAuthorString(s: string): string {
		// Strip "By " prefix
		s = s.replace(/^by\s+/i, '');
		// Remove URLs (including surrounding parentheses if the URL is wrapped in them)
		s = s.replace(/\(?\s*https?:\/\/\S+\s*\)?/gi, '');
		// Normalize " and " to comma separator for consistent formatting
		s = s.replace(/,?\s+and\s+/gi, ', ');
		// Clean up leftover separators and whitespace
		s = s.replace(/\s*[-–—|]\s*$/g, '');
		return s.trim();
	}

	private static getSiteName(schemaOrgData: any, metaTags: MetaTagItem[]): string {
		const candidate = (
			this.getSchemaProperty(schemaOrgData, 'publisher.name') ||
			this.getMetaContent(metaTags, "property", "og:site_name") ||
			this.getMetaContent(metaTags, "name", "og:site_name") ||
			this.getSchemaProperty(schemaOrgData, 'WebSite.name') ||
			this.getSchemaProperty(schemaOrgData, 'sourceOrganization.name') ||
			this.getMetaContent(metaTags, "name", "copyright") ||
			this.getSchemaProperty(schemaOrgData, 'copyrightHolder.name') ||
			this.getSchemaProperty(schemaOrgData, 'isPartOf.name') ||
			this.getMetaContent(metaTags, "name", "application-name") ||
			''
		);

		// Reject candidates that are too long to be a real site name —
		// some pages set og:site_name to the full page title.
		if (candidate && countWords(candidate) > 6) {
			return '';
		}

		return candidate;
	}

	private static getBestTitle(doc: Document, schemaOrgData: any, metaTags: MetaTagItem[], domain: string, siteName: string): string {
		const candidates = [
			this.getMetaContent(metaTags, "property", "og:title"),
			this.getMetaContent(metaTags, "name", "twitter:title"),
			this.getSchemaProperty(schemaOrgData, 'headline'),
			this.getMetaContent(metaTags, "name", "title"),
			this.getMetaContent(metaTags, "name", "sailthru.title"),
			doc.querySelector('title')?.textContent?.trim() || '',
		].filter(Boolean);

		if (candidates.length === 0) return '';

		const authorMeta = this.getMetaContent(metaTags, "property", "author") ||
			this.getMetaContent(metaTags, "name", "author");

		// Pre-normalize identifiers once rather than per candidate
		const authorNorm = authorMeta.trim().toLowerCase();
		const siteNorm = siteName.trim().toLowerCase();
		const domainNorm = domain
			? domain.replace(/\.[^.]+$/, '').toLowerCase().replace(/[^a-z0-9]/g, '')
			: '';

		// Return the first candidate that isn't a site identifier (brand/domain name).
		// Falls back to the first candidate if all are identifiers.
		return candidates.find(c => !this.isSiteIdentifier(c, authorNorm, siteNorm, domainNorm))
			?? candidates[0];
	}

	private static isSiteIdentifier(candidate: string, authorNorm: string, siteNorm: string, domainNorm: string): boolean {
		const norm = candidate.trim().toLowerCase();

		if (authorNorm && norm === authorNorm) return true;
		if (siteNorm && norm === siteNorm) return true;

		if (domainNorm) {
			const candidateNorm = norm.replace(/[^a-z0-9]/g, '');
			if (candidateNorm === domainNorm) return true;
		}

		return false;
	}

	private static cleanTitle(title: string, siteName: string): { title: string; detectedSiteName: string } {
		if (!title) return { title, detectedSiteName: '' };

		const separators = '[|\\-–—/·]';

		// Try site-name-based removal.
		// Skip if the site name equals the title (broken metadata) or is too
		// long to be a real site name (some pages set og:site_name to the title).
		if (siteName && siteName.toLowerCase() !== title.toLowerCase() && countWords(siteName) <= 6) {
			const siteNameLower = siteName.toLowerCase();

			// First try exact match: "Title | Site Name" or "Site Name | Title"
			const siteNameEscaped = siteName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
			const patterns = [
				`\\s*${separators}\\s*${siteNameEscaped}\\s*$`,
				`^\\s*${siteNameEscaped}\\s*${separators}\\s*`,
			];

			for (const pattern of patterns) {
				const regex = new RegExp(pattern, 'i');
				if (regex.test(title)) {
					return { title: title.replace(regex, '').trim(), detectedSiteName: siteName };
				}
			}

			// Fuzzy match: the title may use an abbreviated site name.
			// e.g. og:site_name="MDN Web Docs" but title ends with "| MDN".
			// Split on all separators and strip trailing/leading segments that
			// are substrings of the known site name.
			const allSepPattern = new RegExp(`\\s+${separators}\\s+`, 'g');
			let sepMatch;
			const allPositions: { index: number; length: number }[] = [];
			while ((sepMatch = allSepPattern.exec(title)) !== null) {
				allPositions.push({ index: sepMatch.index, length: sepMatch[0].length });
			}

			if (allPositions.length > 0) {
				// Try suffix: if the last segment matches the site name, also strip
				// adjacent category segments (e.g. "CORS - HTTP | MDN" → "CORS").
				const lastPos = allPositions[allPositions.length - 1];
				const lastSegment = title.substring(lastPos.index + lastPos.length).trim().toLowerCase();
				if (lastSegment && siteNameLower.includes(lastSegment)) {
					// Walk backwards to also strip category breadcrumbs
					// (short segments between the title and the site name)
					let cutIndex = lastPos.index;
					for (let i = allPositions.length - 2; i >= 0; i--) {
						const pos = allPositions[i];
						const segment = title.substring(pos.index + pos.length, cutIndex).trim();
						if (countWords(segment) > 3) break;
						cutIndex = pos.index;
					}
					return { title: title.substring(0, cutIndex).trim(), detectedSiteName: siteName };
				}

				// Try prefix: if the first segment matches the site name, strip it
				const firstPos = allPositions[0];
				const prefixSegment = title.substring(0, firstPos.index).trim().toLowerCase();
				if (prefixSegment && siteNameLower.includes(prefixSegment)) {
					// Walk forward to strip adjacent category breadcrumbs
					let cutIndex = firstPos.index + firstPos.length;
					for (let i = 1; i < allPositions.length; i++) {
						const pos = allPositions[i];
						const segment = title.substring(cutIndex, pos.index).trim();
						if (countWords(segment) > 3) break;
						cutIndex = pos.index + pos.length;
					}
					return { title: title.substring(cutIndex).trim(), detectedSiteName: siteName };
				}
			}
		}

		// Heuristic fallback: if the title contains a separator with a short
		// segment on one end (likely a site name) and a longer segment on
		// the other (the article title), strip the short segment.

		// Strong separators (|, /, ·) — unambiguous, check both suffix and prefix
		const strongResult = this.trySeparatorSplit(title, /\s+([|/·])\s+/g, {
			guard: (tW, sW) => sW <= 3 && tW >= 2 && tW >= sW * 2,
		});
		if (strongResult) return strongResult;

		// Dash separators (-, –, —) — commonly used within titles, so we
		// only strip suffix position with stricter guards
		const dashResult = this.trySeparatorSplit(title, /\s+[-–—]\s+/g, {
			suffixOnly: true,
			guard: (tW, sW) => sW <= 2 && tW >= 2 && tW > sW,
		});
		if (dashResult) return dashResult;

		return { title: title.trim(), detectedSiteName: '' };
	}

	private static trySeparatorSplit(
		title: string,
		pattern: RegExp,
		opts: { suffixOnly?: boolean; guard: (titleWords: number, siteWords: number) => boolean }
	): { title: string; detectedSiteName: string } | null {
		let match;
		const positions: { index: number; length: number }[] = [];
		while ((match = pattern.exec(title)) !== null) {
			positions.push({ index: match.index, length: match[0].length });
		}
		if (positions.length === 0) return null;

		// Try suffix: split at last separator
		const last = positions[positions.length - 1];
		const suffixTitle = title.substring(0, last.index).trim();
		const suffixSite = title.substring(last.index + last.length).trim();
		if (opts.guard(countWords(suffixTitle), countWords(suffixSite))) {
			return { title: suffixTitle, detectedSiteName: suffixSite };
		}

		// Try prefix: split at first separator
		if (!opts.suffixOnly) {
			const first = positions[0];
			const prefixSite = title.substring(0, first.index).trim();
			const prefixTitle = title.substring(first.index + first.length).trim();
			if (opts.guard(countWords(prefixTitle), countWords(prefixSite))) {
				return { title: prefixTitle, detectedSiteName: prefixSite };
			}
		}

		return null;
	}

	private static getDescription(doc: Document, schemaOrgData: any, metaTags: MetaTagItem[]): string {
		return (
			this.getMetaContent(metaTags, "name", "description") ||
			this.getMetaContent(metaTags, "property", "description") ||
			this.getMetaContent(metaTags, "property", "og:description") ||
			this.getSchemaProperty(schemaOrgData, 'description') ||
			this.getMetaContent(metaTags, "name", "twitter:description") ||
			this.getMetaContent(metaTags, "name", "sailthru.description") ||
			''
		);
	}

	private static getImage(doc: Document, schemaOrgData: any, metaTags: MetaTagItem[]): string {
		return (
			this.getMetaContent(metaTags, "property", "og:image") ||
			this.getMetaContent(metaTags, "name", "twitter:image") ||
			this.getSchemaProperty(schemaOrgData, 'image.url') ||
			this.getMetaContent(metaTags, "name", "sailthru.image.full") ||
			''
		);
	}

	private static getLanguage(doc: Document, schemaOrgData: any, metaTags: MetaTagItem[]): string {
		// 1. <html lang="...">
		const htmlLang = doc.documentElement?.getAttribute('lang')?.trim();
		if (htmlLang) return this.normalizeLangCode(htmlLang);

		// 2. Content-Language meta tag
		const contentLang = this.getMetaContent(metaTags, "name", "content-language") ||
			this.getMetaContent(metaTags, "property", "og:locale");
		if (contentLang) return this.normalizeLangCode(contentLang);

		// 3. http-equiv Content-Language (stored as name in our meta tag collection)
		const httpEquivLang = doc.querySelector('meta[http-equiv="Content-Language" i]')?.getAttribute('content')?.trim();
		if (httpEquivLang) return this.normalizeLangCode(httpEquivLang);

		// 4. Schema.org
		const schemaLang = this.getSchemaProperty(schemaOrgData, 'inLanguage');
		if (schemaLang) return this.normalizeLangCode(schemaLang);

		return '';
	}

	/**
	 * Normalize language codes to BCP 47 format (e.g. en_US -> en-US)
	 */
	private static normalizeLangCode(code: string): string {
		// Replace underscores with hyphens (og:locale uses en_US)
		return code.replace(/_/g, '-');
	}

	private static getFavicon(doc: Document, baseUrl: string, metaTags: MetaTagItem[]): string {
		const iconFromMeta = this.getMetaContent(metaTags, "property", "og:image:favicon");
		if (iconFromMeta) return iconFromMeta;

		const iconLink = doc.querySelector("link[rel='icon']")?.getAttribute("href");
		if (iconLink) return iconLink;

		const shortcutLink = doc.querySelector("link[rel='shortcut icon']")?.getAttribute("href");
		if (shortcutLink) return shortcutLink;

		// Only try to construct favicon URL if we have a valid HTTP base URL
		if (baseUrl && /^https?:\/\//.test(baseUrl)) {
			try {
				return new URL("/favicon.ico", baseUrl).href;
			} catch (e) {
				// Silently fail for invalid URLs
			}
		}

		return '';
	}

	private static getPublished(doc: Document, schemaOrgData: any, metaTags: MetaTagItem[]): string {
		const result =
			this.getSchemaProperty(schemaOrgData, 'datePublished') ||
			this.getMetaContent(metaTags, "name", "publishDate") ||
			this.getMetaContent(metaTags, "property", "article:published_time") ||
			(doc.querySelector('abbr[itemprop="datePublished"]') as HTMLElement)?.title?.trim() ||
			this.getTimeElement(doc) ||
			this.getMetaContent(metaTags, "name", "sailthru.date");
		if (result) return result;

		// Look for date text near the article heading
		const h1 = doc.querySelector('h1');
		if (h1) {
			let sibling = h1.nextElementSibling;
			for (let i = 0; i < 3 && sibling; i++) {
				// Check individual children first — some DOMs (e.g. linkedom) omit whitespace
				// between elements, which breaks word-boundary matching on combined text
				for (const child of Array.from(sibling.querySelectorAll('p, time'))) {
					const parsed = this.parseDateText(child.textContent?.trim() || '');
					if (parsed) return parsed;
				}
				const parsed = this.parseDateText(sibling.textContent?.trim() || '');
				if (parsed) return parsed;
				sibling = sibling.nextElementSibling;
			}
		}

		return '';
	}

	private static getMetaContent(metaTags: MetaTagItem[], attr: string, value: string): string {
		return this.getMetaContents(metaTags, attr, value)[0] ?? "";
	}

	private static getMetaContents(metaTags: MetaTagItem[], attr: string, value: string): string[] {
		return metaTags.filter(tag => {
			const attributeValue = attr === 'name' ? tag.name : tag.property;
			return attributeValue?.toLowerCase() === value.toLowerCase();
		}).map(tag => tag.content?.trim() ?? "");
	}

	private static getTimeElement(doc: Document): string {
		const selector = `time`;
		const element = Array.from(doc.querySelectorAll(selector))[0];
		const content = element ? (element.getAttribute("datetime")?.trim() ?? element.textContent?.trim() ?? "") : "";
		return content;
	}

	private static readonly MONTH_MAP: Record<string, string> = {
		'january': '01', 'february': '02', 'march': '03', 'april': '04',
		'may': '05', 'june': '06', 'july': '07', 'august': '08',
		'september': '09', 'october': '10', 'november': '11', 'december': '12'
	};

	static parseDateText(text: string): string {
		// "26 February 2025" or "Wednesday, 26 February 2025"
		let match = text.match(/\b(\d{1,2})\s+(January|February|March|April|May|June|July|August|September|October|November|December)\s+(\d{4})\b/i);
		if (match) {
			const day = match[1].padStart(2, '0');
			const month = this.MONTH_MAP[match[2].toLowerCase()];
			return `${match[3]}-${month}-${day}T00:00:00+00:00`;
		}

		// "February 26, 2025" or "June 5, 2023"
		match = text.match(/\b(January|February|March|April|May|June|July|August|September|October|November|December)\s+(\d{1,2}),?\s+(\d{4})\b/i);
		if (match) {
			const month = this.MONTH_MAP[match[1].toLowerCase()];
			const day = match[2].padStart(2, '0');
			return `${match[3]}-${month}-${day}T00:00:00+00:00`;
		}

		return '';
	}

	private static getSchemaProperty(schemaOrgData: any, property: string, defaultValue: string = ''): string {
		if (!schemaOrgData) return defaultValue;

		const searchSchema = (data: any, props: string[], fullPath: string, isExactMatch: boolean = true): string[] => {
			if (typeof data === 'string') {
				return props.length === 0 ? [data] : [];
			}
			
			if (!data || typeof data !== 'object') {
				return [];
			}

			if (Array.isArray(data)) {
				const currentProp = props[0];
				if (/^\[\d+\]$/.test(currentProp)) {
					const index = parseInt(currentProp.slice(1, -1));
					if (data[index]) {
						return searchSchema(data[index], props.slice(1), fullPath, isExactMatch);
					}
					return [];
				}
				
				if (props.length === 0 && data.every(item => typeof item === 'string' || typeof item === 'number')) {
					return data.map(String);
				}
				
				return data.flatMap(item => searchSchema(item, props, fullPath, isExactMatch));
			}

			const [currentProp, ...remainingProps] = props;
			
			if (!currentProp) {
				if (typeof data === 'string') return [data];
				if (typeof data === 'object' && data.name) {
					return [data.name];
				}
				return [];
			}

			if (data.hasOwnProperty(currentProp)) {
				return searchSchema(data[currentProp], remainingProps, 
					fullPath ? `${fullPath}.${currentProp}` : currentProp, true);
			}

			if (!isExactMatch) {
				const nestedResults: string[] = [];
				for (const key in data) {
					if (typeof data[key] === 'object') {
						const results = searchSchema(data[key], props, 
							fullPath ? `${fullPath}.${key}` : key, false);
						nestedResults.push(...results);
					}
				}
				if (nestedResults.length > 0) {
					return nestedResults;
				}
			}

			return [];
		};

		try {
			let results = searchSchema(schemaOrgData, property.split('.'), '', true);
			if (results.length === 0) {
				results = searchSchema(schemaOrgData, property.split('.'), '', false);
			}
			const result = results.length > 0 ? results.filter(Boolean).join(', ') : defaultValue;
			return result;
		} catch (error) {
			console.error(`Error in getSchemaProperty for ${property}:`, error);
			return defaultValue;
		}
	}
}