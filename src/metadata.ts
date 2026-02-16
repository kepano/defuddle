import { DefuddleMetadata, MetaTagItem } from './types';

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

		return {
			title: this.getTitle(doc, schemaOrgData, metaTags),
			description: this.getDescription(doc, schemaOrgData, metaTags),
			domain,
			favicon: this.getFavicon(doc, url, metaTags),
			image: this.getImage(doc, schemaOrgData, metaTags),
			published: this.getPublished(doc, schemaOrgData, metaTags),
			author: this.getAuthor(doc, schemaOrgData, metaTags),
			site: this.getSite(doc, schemaOrgData, metaTags),
			schemaOrgData,
			wordCount: 0,
			parseTime: 0
		};
	}

	private static getAuthor(doc: Document, schemaOrgData: any, metaTags: MetaTagItem[]): string {
		let authorsString: string | undefined;

		// Meta tags - typically expect a single string, possibly comma-separated
		authorsString = this.getMetaContent(metaTags, "name", "sailthru.author") ||
			this.getMetaContent(metaTags, "property", "author") ||
			this.getMetaContent(metaTags, "name", "author") ||
			this.getMetaContent(metaTags, "name", "byl") ||
			this.getMetaContent(metaTags, "name", "authorList");
		if (authorsString) return authorsString;

		// Conventions for research paper meta tags
		let authorsStrings: string[] = this.getMetaContents(metaTags, "name", "citation_author");
		if (authorsStrings.length === 0) {
			authorsStrings = this.getMetaContents(metaTags, "property", "dc.creator");
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
				const cleanedName = namePart.trim().replace(/,$/, '').trim();
				const lowerCleanedName = cleanedName.toLowerCase();
				if (cleanedName && lowerCleanedName !== 'author' && lowerCleanedName !== 'authors') {
					collectedAuthorsFromDOM.push(cleanedName);
				}
			});
		};

		const domAuthorSelectors = [
			'[itemprop="author"]',
			'.author',
			'[href*="author"]',
			'.authors a',
		];

		domAuthorSelectors.forEach(selector => {
			doc.querySelectorAll(selector).forEach(el => {
				addDomAuthor(el.textContent);
			});
		});

		if (collectedAuthorsFromDOM.length > 0) {
			let uniqueAuthors = [...new Set(collectedAuthorsFromDOM.map(name => name.trim()).filter(Boolean))];
			if (uniqueAuthors.length > 0) {
				if (uniqueAuthors.length > 10) {
					uniqueAuthors = uniqueAuthors.slice(0, 10);
				}
				return uniqueAuthors.join(', ');
			}
		}
		
		// 4. Fallback meta tags and schema properties (less direct for author names)
		authorsString = this.getMetaContent(metaTags, "name", "copyright") ||
			this.getSchemaProperty(schemaOrgData, 'copyrightHolder.name') ||
			this.getMetaContent(metaTags, "property", "og:site_name") ||
			this.getSchemaProperty(schemaOrgData, 'publisher.name') ||
			this.getSchemaProperty(schemaOrgData, 'sourceOrganization.name') ||
			this.getSchemaProperty(schemaOrgData, 'isPartOf.name') ||
			this.getMetaContent(metaTags, "name", "twitter:creator") || 
			this.getMetaContent(metaTags, "name", "application-name");
		if (authorsString) return authorsString;

		return '';
	}

	private static getSite(doc: Document, schemaOrgData: any, metaTags: MetaTagItem[]): string {
		return (
			this.getSchemaProperty(schemaOrgData, 'publisher.name') ||
			this.getMetaContent(metaTags, "property", "og:site_name") ||
			this.getSchemaProperty(schemaOrgData, 'WebSite.name') ||
			this.getSchemaProperty(schemaOrgData, 'sourceOrganization.name') ||
			this.getMetaContent(metaTags, "name", "copyright") ||
			this.getSchemaProperty(schemaOrgData, 'copyrightHolder.name') ||
			this.getSchemaProperty(schemaOrgData, 'isPartOf.name') ||
			this.getMetaContent(metaTags, "name", "application-name") ||
			this.getAuthor(doc, schemaOrgData, metaTags) ||
			''
		);
	}

	private static getTitle(doc: Document, schemaOrgData: any, metaTags: MetaTagItem[]): string {
		const rawTitle = (
			this.getMetaContent(metaTags, "property", "og:title") ||
			this.getMetaContent(metaTags, "name", "twitter:title") ||
			this.getSchemaProperty(schemaOrgData, 'headline') ||
			this.getMetaContent(metaTags, "name", "title") ||
			this.getMetaContent(metaTags, "name", "sailthru.title") ||
			doc.querySelector('title')?.textContent?.trim() ||
			''
		);

		return this.cleanTitle(rawTitle, this.getSite(doc, schemaOrgData, metaTags));
	}

	private static cleanTitle(title: string, siteName: string): string {
		if (!title || !siteName) return title;

		// Remove site name if it exists
		const siteNameEscaped = siteName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
		const patterns = [
			`\\s*[\\|\\-–—]\\s*${siteNameEscaped}\\s*$`, // Title | Site Name
			`^\\s*${siteNameEscaped}\\s*[\\|\\-–—]\\s*`, // Site Name | Title
		];
		
		for (const pattern of patterns) {
			const regex = new RegExp(pattern, 'i');
			if (regex.test(title)) {
				title = title.replace(regex, '');
				break;
			}
		}

		return title.trim();
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

	private static getFavicon(doc: Document, baseUrl: string, metaTags: MetaTagItem[]): string {
		const iconFromMeta = this.getMetaContent(metaTags, "property", "og:image:favicon");
		if (iconFromMeta) return iconFromMeta;

		const iconLink = doc.querySelector("link[rel='icon']")?.getAttribute("href");
		if (iconLink) return iconLink;

		const shortcutLink = doc.querySelector("link[rel='shortcut icon']")?.getAttribute("href");
		if (shortcutLink) return shortcutLink;

		// Only try to construct favicon URL if we have a valid base URL
		if (baseUrl) {
			try {
				return new URL("/favicon.ico", baseUrl).href;
			} catch (e) {
				console.warn('Failed to construct favicon URL:', e);
			}
		}

		return '';
	}

	private static getPublished(doc: Document, schemaOrgData: any, metaTags: MetaTagItem[]): string {
		return (
			this.getSchemaProperty(schemaOrgData, 'datePublished') ||
			this.getMetaContent(metaTags, "name", "publishDate") ||
			this.getMetaContent(metaTags, "property", "article:published_time") ||
			(doc.querySelector('abbr[itemprop="datePublished"]') as HTMLElement)?.title?.trim() || 
			this.getTimeElement(doc) ||
			this.getMetaContent(metaTags, "name", "sailthru.date") ||
			''
		);
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