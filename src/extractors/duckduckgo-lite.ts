import { BaseExtractor, ExtractorOptions } from './_base';
import { ExtractorResult } from '../types/extractors';
import { serializeHTML, escapeHtml } from '../utils/dom';

interface SearchResult {
	title: string;
	url: string;
	snippet: string;
}

interface ZeroClickInfo {
	header: string;
	body: string;
	textContent: string;
}

export class DuckDuckGoLiteExtractor extends BaseExtractor {
	private isSearchPage: boolean;

	constructor(document: Document, url: string, schemaOrgData?: any, options?: ExtractorOptions) {
		super(document, url, schemaOrgData, options);
		this.isSearchPage = this.detectSearchPage();
	}

	private detectSearchPage(): boolean {
		return !!(
			this.document.querySelector('input.query[name="q"]') &&
			this.document.querySelector('a.result-link') &&
			this.document.querySelector('table[border="0"]')
		);
	}

	canExtract(): boolean {
		return this.isSearchPage;
	}

	extract(): ExtractorResult {
		const zeroClick = this.extractZeroClickInfo();
		const results = this.extractResults();
		const contentHtml = this.buildListingHtml(results, zeroClick);
		const searchQuery = this.getSearchQuery();

		return {
			content: contentHtml,
			contentHtml: contentHtml,
			extractedContent: {
				query: searchQuery,
				resultCount: String(results.length),
			},
			variables: {
				title: searchQuery || 'DuckDuckGo Search',
				site: 'DuckDuckGo Lite',
				description: zeroClick?.textContent || (searchQuery
					? `Search results for "${searchQuery}"`
					: 'DuckDuckGo Lite search results'),
			}
		};
	}

	// Reads the current query string from the search input
	private getSearchQuery(): string {
		const queryInput = this.document.querySelector('input.query[name="q"]');
		return queryInput?.getAttribute('value') || '';
	}

	// DuckDuckGo wraps external URLs in a redirect so it can track clicks
	// Unwraps the real destination from the `uddg` query parameter
	private unwrapRedirectUrl(href: string): string {
		try {
			const url = new URL(href, this.url);
			const actual = url.searchParams.get('uddg');
			return actual ? decodeURIComponent(actual) : href;
		} catch {
			return href;
		}
	}

	// Zero-click info appears in a `table[border="0"]` that does NOT contain
	// `.result-link` elements. The structure is:
	//   Row 1: "Zero-click info: <a href="...">Title</a>"
	//   Row 2: Description text + "More at <q>Source</q>" link
	//   Row 3: Spacer
	// The extracted HTML is wrapped in a `<blockquote data-callout="info">`
	private extractZeroClickInfo(): ZeroClickInfo | null {
		const tables = Array.from(this.document.querySelectorAll('table[border="0"]'));

		for (const table of tables) {
			// Skip result tables — zero-click tables have no .result-link
			if (table.querySelector('a.result-link')) continue;

			const rows = Array.from(table.querySelectorAll('tr'));
			if (rows.length < 2) continue;

			const firstCell = rows[0].querySelector('td');
			if (!firstCell) continue;

			const firstText = firstCell.textContent || '';
			if (!firstText.includes('Zero-click info:')) continue;

			// Header: "Zero-click info: <a>Title</a>"
			const headerHtml = this.unwrapLinksInHtml(firstCell);

			// Body: description text + "More at <q>Source</q>" link
			const bodyCell = rows[1].querySelector('td');
			if (!bodyCell) continue;

			// Clone so we can safely remove the "More at" link
			const cleanBody = bodyCell.cloneNode(true) as Element;
			const links = Array.from(cleanBody.querySelectorAll('a'));
			for (const link of links) {
				if (link.textContent?.includes('More at')) {
					link.remove();
					break;
				}
			}

			const bodyHtml = this.unwrapLinksInHtml(cleanBody);

			// Text-only version for the description variable
			const textContent = cleanBody.textContent?.trim() || '';

			return { header: headerHtml, body: bodyHtml, textContent };
		}

		return null;
	}

	// Unwraps DuckDuckGo redirect URLs in all <a> tags within the given element.
	// Operates on the element's inner HTML string.
	private unwrapLinksInHtml(el: Element): string {
		const clone = el.cloneNode(true) as Element;
		clone.querySelectorAll('a').forEach(a => {
			const href = a.getAttribute('href') || '';
			const unwrapped = this.unwrapRedirectUrl(href);
			if (unwrapped !== href) {
				a.setAttribute('href', unwrapped);
			}
		});
		return serializeHTML(clone);
	}

	// Iterates over the top-level result tables and collects each
	// title / URL / snippet triplet into a structured array.
	//
	// The lite layout uses a flat table where each result is
	// three consecutive rows:
	//   1. title link
	//   2. snippet
	//   3. blank spacer
	private extractResults(): SearchResult[] {
		const results: SearchResult[] = [];
		const tables = Array.from(this.document.querySelectorAll('table[border="0"]'));

		for (const table of tables) {
			// Skip zero-click info tables (no .result-link)
			if (!table.querySelector('a.result-link')) continue;

			const rows = Array.from(table.querySelectorAll('tr'));
			let i = 0;

			while (i < rows.length) {
				const row = rows[i];
				const linkEl = row.querySelector('a.result-link');

				if (linkEl) {
					const title = linkEl.textContent?.trim() || '';
					const href = linkEl.getAttribute('href') || '';
					const url = this.unwrapRedirectUrl(href);

					i++;
					const snippetRow = rows[i];
					const snippetEl = snippetRow?.querySelector('.result-snippet');
					const snippet = snippetEl ? serializeHTML(snippetEl) : '';

					// Skip the blank spacer row
					i++;
					i++;

					if (title && url) {
						results.push({ title, url, snippet });
					}
				} else {
					i++;
				}
			}
		}

		return results;
	}

	
	// Builds the final ordered list HTML. When there are no results a
	// short "No results" message is returned instead of an empty string.
	// Zero-click info, when present, is prepended as a blockquote.
	private buildListingHtml(results: SearchResult[], zeroClick?: ZeroClickInfo | null): string {
		let html = '';

		if (zeroClick) {
			html += '<blockquote data-callout="info">';
			html += `<p>${zeroClick.header}</p>`;
			if (zeroClick.body) {
				html += `<p>${zeroClick.body}</p>`;
			}
			html += '</blockquote>';
		}

		if (results.length === 0) {
			html += '<p>No results found.</p>';
			return html;
		}

		const items = results.map(result => {
			let itemHtml = '<li>';
			itemHtml += `<a href="${escapeHtml(result.url)}">${escapeHtml(result.title)}</a>`;

			if (result.snippet) {
				itemHtml += `<p>${result.snippet}</p>`;
			}

			itemHtml += '</li>';
			return itemHtml;
		});

		html += `<ol>${items.join('')}</ol>`;

		return html;
	}
}
