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
		let authors;

		// 1. Specific meta tags for author
		authors = this.getMetaContent(metaTags, "name", "sailthru.author") ||
			this.getMetaContent(metaTags, "property", "author") ||
			this.getMetaContent(metaTags, "name", "author") ||
			this.getMetaContent(metaTags, "name", "byl") ||
			this.getMetaContent(metaTags, "name", "authorList");
		if (authors) return authors;

		// 2. Schema.org data (getSchemaProperty handles arrays by joining with ', ')
		authors = this.getSchemaProperty(schemaOrgData, 'author.name') ||
			this.getSchemaProperty(schemaOrgData, 'author.[].name'); // Try explicit array path
		if (authors) return authors;

		// 3. Microdata: itemprop="author"
		const nestedNameElements = doc.querySelectorAll('[itemprop="author"]');
		if (nestedNameElements.length > 0) {
			const names = Array.from(nestedNameElements)
				.map(el => el.textContent?.trim().replace(/,$/, '').trim()) // Clean trailing comma from individual item
				.filter(name => !!name) as string[];
			if (names.length > 0) return names.join(', ');
		}
		
		// 4. Microdata: itemprop="author" and itemprop="name" on the same element
		// e.g., <span itemprop="author" itemprop="name">Author Name</span>
		const sameElementAuthorNames = doc.querySelectorAll('[itemprop="author"][itemprop="name"]');
		if (sameElementAuthorNames.length > 0) {
			const names = Array.from(sameElementAuthorNames)
				.map(el => el.textContent?.trim().replace(/,$/, '').trim())
				.filter(name => !!name) as string[];
			if (names.length > 0) return names.join(', ');
		}

		// 5. User-added generic class query (from their local modification)
		authors = doc.querySelector('.author')?.textContent?.trim();
		if (authors) return authors;
		
		// 6. Other meta tags and schema properties as fallbacks (less direct for author names)
		authors = this.getMetaContent(metaTags, "name", "copyright") ||
			this.getSchemaProperty(schemaOrgData, 'copyrightHolder.name') ||
			this.getMetaContent(metaTags, "property", "og:site_name") ||
			this.getSchemaProperty(schemaOrgData, 'publisher.name') ||
			this.getSchemaProperty(schemaOrgData, 'sourceOrganization.name') ||
			this.getSchemaProperty(schemaOrgData, 'isPartOf.name') ||
			this.getMetaContent(metaTags, "name", "twitter:creator") || // often a single user handle
			this.getMetaContent(metaTags, "name", "application-name");
		if (authors) return authors;

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
		const foundTag = metaTags.find(tag => {
			const attributeValue = attr === 'name' ? tag.name : tag.property;
			return attributeValue?.toLowerCase() === value.toLowerCase();
		});
		return foundTag ? foundTag.content?.trim() ?? "" : "";
	}

	private static getTimeElement(doc: Document): string {
		const selector = `time`;
		const element = Array.from(doc.querySelectorAll(selector))[0];
		const content = element ? (element.getAttribute("datetime")?.trim() ?? element.textContent?.trim() ?? "") : "";
		return this.decodeHTMLEntities(content, doc);
	}

	private static decodeHTMLEntities(text: string, doc: Document): string {
		const textarea = doc.createElement('textarea');
		textarea.innerHTML = text;
		return textarea.value;
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
				if (/^\\[\\d+\\]$/.test(currentProp)) {
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