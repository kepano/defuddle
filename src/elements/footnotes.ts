import { FOOTNOTE_LIST_SELECTORS, FOOTNOTE_INLINE_REFERENCES } from '../constants';
import { transferContent, parseHTML, serializeHTML } from '../utils/dom';

// Use the global DOM types
interface FootnoteData {
	content: any;
	originalId: string;
	refs: string[];
}

interface FootnoteCollection {
	[footnoteNumber: number]: FootnoteData;
}

class FootnoteHandler {
	private doc: any;
	private genericContainer: any = null;

	constructor(doc: any) {
		this.doc = doc;
	}

	createFootnoteItem(
		footnoteNumber: number,
		content: string | any,
		refs: string[]
	): any {
		const doc = typeof content === 'string' ? this.doc : content.ownerDocument;
		const newItem = doc.createElement('li');
		newItem.className = 'footnote';
		newItem.id = `fn:${footnoteNumber}`;

		// Handle content
		if (typeof content === 'string') {
			const paragraph = doc.createElement('p');
			paragraph.appendChild(parseHTML(doc, content));
			newItem.appendChild(paragraph);
		} else {
			// Get all paragraphs from the content
			const paragraphs = Array.from(content.querySelectorAll('p'));
			if (paragraphs.length === 0) {
				// If no paragraphs, wrap content in a paragraph
				const paragraph = doc.createElement('p');
				transferContent(content, paragraph);
				this.removeBackrefs(paragraph);
				newItem.appendChild(paragraph);
			} else {
				// Copy existing paragraphs
				paragraphs.forEach((p: any) => {
					const newP = doc.createElement('p');
					transferContent(p, newP);
					this.removeBackrefs(newP);
					newItem.appendChild(newP);
				});
			}
		}

		// Add backlink(s) to the last paragraph
		const lastParagraph = newItem.querySelector('p:last-of-type') || newItem;
		refs.forEach((refId, index) => {
			const backlink = doc.createElement('a');
			backlink.href = `#${refId}`;
			backlink.title = 'return to article';
			backlink.className = 'footnote-backref';
			backlink.textContent = '↩';
			if (index < refs.length - 1) {
				backlink.textContent += ' ';
			}
			lastParagraph.appendChild(backlink);
		});

		return newItem;
	}

	collectFootnotes(element: any): FootnoteCollection {
		const footnotes: FootnoteCollection = {};
		let footnoteCount = 1;
		const processedIds = new Set<string>(); // Track processed IDs

		// Collect all footnotes and their IDs from footnote lists
		const footnoteLists = element.querySelectorAll(FOOTNOTE_LIST_SELECTORS);
		footnoteLists.forEach((list: any) => {
			// Wikidot uses div.footnotes-footer containing div.footnote-footer children
			if (list.matches('div.footnotes-footer')) {
				const footnoteDivs = list.querySelectorAll('div.footnote-footer');
				footnoteDivs.forEach((div: any) => {
					const divId = div.id || '';
					const match = divId.match(/^footnote-(\d+)$/);
					if (match) {
						const id = match[1];
						if (!processedIds.has(id)) {
							// Clone the div to avoid modifying the original DOM
							const clone = div.cloneNode(true);
							// Remove the back-link anchor
							const backLink = clone.querySelector('a');
							if (backLink) backLink.remove();
							// Get remaining text and strip leading ". "
							let text = serializeHTML(clone);
							text = text.replace(/^\s*\.\s*/, '');
							const contentDiv = element.ownerDocument.createElement('div');
							contentDiv.appendChild(parseHTML(element.ownerDocument, text.trim()));
							footnotes[footnoteCount] = {
								content: contentDiv,
								originalId: id,
								refs: []
							};
							processedIds.add(id);
							footnoteCount++;
						}
					}
				});
				return;
			}

			// Substack has individual footnote divs with no parent
			if (list.matches('div.footnote[data-component-name="FootnoteToDOM"]')) {
				const anchor = list.querySelector('a.footnote-number');
				const content = list.querySelector('.footnote-content');
				if (anchor && content) {
					const id = anchor.id.replace('footnote-', '').toLowerCase();
					if (id && !processedIds.has(id)) {
						footnotes[footnoteCount] = {
							content: content,
							originalId: id,
							refs: []
						};
						processedIds.add(id);
						footnoteCount++;
					}
				}
				return;
			}

			// Common format using OL/UL and LI elements
			const items = list.querySelectorAll('li, div[role="listitem"]');
			items.forEach((li: any) => {
				let id = '';
				let content: any = null;

				// Handle citations with .citations class
				const citationsDiv = li.querySelector('.citations');
				if (citationsDiv?.id?.toLowerCase().startsWith('r')) {
					id = citationsDiv.id.toLowerCase();
					// Look for citation content within the citations div
					const citationContent = citationsDiv.querySelector('.citation-content');
					if (citationContent) {
						content = citationContent;
					}
				} else {
					// Extract ID from various formats
					if (li.id.toLowerCase().startsWith('bib.bib')) {
						id = li.id.replace('bib.bib', '').toLowerCase();
					} else if (li.id.toLowerCase().startsWith('fn:')) {
						id = li.id.replace('fn:', '').toLowerCase();
					} else if (li.id.toLowerCase().startsWith('fn')) {
						id = li.id.replace('fn', '').toLowerCase();
					// Nature.com
					} else if (li.hasAttribute('data-counter')) {
						id = li.getAttribute('data-counter')?.replace(/\.$/, '')?.toLowerCase() || '';
					} else {
						const match = li.id.split('/').pop()?.match(/cite_note-(.+)/);
						id = match ? match[1].toLowerCase() : li.id.toLowerCase();
					}
					content = li;
				}

				if (id && !processedIds.has(id)) {
					footnotes[footnoteCount] = {
						content: content || li,
						originalId: id,
						refs: []
					};
					processedIds.add(id);
					footnoteCount++;
				}
			});
		});

		// Generic fallback: if no footnotes found via selectors, try ID-based detection
		if (footnoteCount === 1) {
			// Step 1: Find all in-text anchors linking to fragment IDs with short numeric text
			const candidateRefs = new Map<string, any[]>(); // fragment -> [anchor elements]
			const allAnchors = element.querySelectorAll('a[href*="#"]');
			allAnchors.forEach((a: any) => {
				const href = a.getAttribute('href') || '';
				const fragment = href.split('#').pop()?.toLowerCase();
				if (!fragment) return;

				const text = a.textContent?.trim() || '';
				if (!/^\[?\(?\d{1,4}\)?\]?$/.test(text)) return;

				// Must be inside a sup or span to look like a footnote ref
				const parent = a.parentElement;
				if (!parent) return;
				const parentTag = parent.tagName.toLowerCase();
				if (parentTag !== 'sup' && parentTag !== 'span' && a.tagName.toLowerCase() !== 'a') return;

				if (!candidateRefs.has(fragment)) {
					candidateRefs.set(fragment, []);
				}
				candidateRefs.get(fragment)!.push(a);
			});

			if (candidateRefs.size >= 2) {
				// Step 2: Find a container where multiple children have IDs matching our fragments
				const fragmentSet = new Set(candidateRefs.keys());
				const containers = element.querySelectorAll('div, section, aside, footer');
				let bestContainer: any = null;
				let bestMatchCount = 0;

				containers.forEach((container: any) => {
					// Skip containers that are the main content element itself
					if (container === element) return;

					const children = container.querySelectorAll('p[id], li[id], div[id]');
					let matchCount = 0;
					children.forEach((child: any) => {
						if (fragmentSet.has(child.id.toLowerCase())) {
							matchCount++;
						}
					});

					if (matchCount >= 2 && matchCount >= bestMatchCount) {
						bestMatchCount = matchCount;
						bestContainer = container;
					}
				});

				if (bestContainer) {
					// Step 3: Extract footnotes from the container
					const idElements = bestContainer.querySelectorAll('p[id], li[id], div[id]');
					const orderedElements: any[] = [];

					idElements.forEach((el: any) => {
						if (fragmentSet.has(el.id.toLowerCase())) {
							orderedElements.push(el);
						}
					});

					// Step 4: Handle multi-paragraph footnotes (group consecutive non-ID elements)
					orderedElements.forEach((el: any) => {
						const id = el.id.toLowerCase();
						if (processedIds.has(id)) return;

						const contentDiv = element.ownerDocument.createElement('div');
						// Clone the element content
						const clone = el.cloneNode(true);
						// Strip leading footnote number (e.g. "1. " or "1 ")
						const firstText = clone.childNodes[0];
						if (firstText && firstText.nodeType === 3) {
							firstText.textContent = firstText.textContent.replace(/^\d+\.\s*/, '');
						}
						contentDiv.appendChild(clone);

						// Check for consecutive siblings without IDs (multi-paragraph footnotes)
						let sibling = el.nextElementSibling;
						while (sibling && !sibling.id) {
							const sibClone = sibling.cloneNode(true);
							contentDiv.appendChild(sibClone);
							sibling = sibling.nextElementSibling;
						}

						footnotes[footnoteCount] = {
							content: contentDiv,
							originalId: id,
							refs: []
						};
						processedIds.add(id);
						footnoteCount++;
					});

					// Step 5: Store container for later removal
					this.genericContainer = bestContainer;
				}
			}
		}

		return footnotes;
	}

	removeBackrefs(el: any): void {
		el.querySelectorAll('a').forEach((a: any) => {
			if (a.textContent?.trim() === '↩' || a.classList?.contains('footnote-backref')) {
				a.remove();
			}
		});
		// Clean up trailing text nodes that are only whitespace/punctuation
		// (remnants from around removed backref links, e.g. " ." or " , .")
		while (el.lastChild && el.lastChild.nodeType === 3) {
			const text = el.lastChild.textContent;
			if (/^[\s,.;]*$/.test(text)) {
				el.lastChild.remove();
			} else {
				break;
			}
		}
	}

	findOuterFootnoteContainer(el: any): any {
		let current: any = el;
		let parent: any = el.parentElement;
		
		// Keep going up until we find an element that's not a span or sup
		while (parent && (
			parent.tagName.toLowerCase() === 'span' || 
			parent.tagName.toLowerCase() === 'sup'
		)) {
			current = parent;
			parent = parent.parentElement;
		}
		
		return current;
	}

	// Every footnote reference should be a sup element with an anchor inside
	// e.g. <sup id="fnref:1"><a href="#fn:1">1</a></sup>
	createFootnoteReference(footnoteNumber: string, refId: string): any {
		const sup = this.doc.createElement('sup');
		sup.id = refId;
		const link = this.doc.createElement('a');
		link.href = `#fn:${footnoteNumber}`;
		link.textContent = footnoteNumber;
		sup.appendChild(link);
		return sup;
	}

	/**
	 * Handle CSS sidenote footnotes where content is embedded inline in the text.
	 * Pattern: <span class="footnote-container">
	 *            <label class="footnote-number"></label>
	 *            <input class="margin-toggle">
	 *            <span class="footnote">Content...</span>
	 *          </span>
	 */
	collectInlineSidenotes(element: any): FootnoteCollection {
		const footnotes: FootnoteCollection = {};
		const containers = element.querySelectorAll('span.footnote-container, span.sidenote-container');
		if (containers.length === 0) return footnotes;

		let footnoteCount = 1;
		containers.forEach((container: any) => {
			const content = container.querySelector('span.footnote, span.sidenote');
			if (!content) return;

			// Clone content so we can manipulate it without affecting the DOM
			const contentClone = content.cloneNode(true);

			footnotes[footnoteCount] = {
				content: contentClone,
				originalId: String(footnoteCount),
				refs: [`fnref:${footnoteCount}`]
			};

			// Replace the container with a standard footnote reference
			const ref = this.createFootnoteReference(String(footnoteCount), `fnref:${footnoteCount}`);
			container.replaceWith(ref);

			footnoteCount++;
		});

		return footnotes;
	}

	standardizeFootnotes(element: any) {
		// Handle CSS sidenote footnotes first
		const sidenotes = this.collectInlineSidenotes(element);

		const footnotes = this.collectFootnotes(element);

		// Standardize inline footnotes using the collected IDs
		const footnoteInlineReferences = element.querySelectorAll(FOOTNOTE_INLINE_REFERENCES);

		// Group references by their parent sup element
		const supGroups = new Map();

		footnoteInlineReferences.forEach((el: any) => {
			if (!el || !el.parentNode) return;

			let footnoteId = '';
			let footnoteContent = '';

			// Extract footnote ID based on element type
			// Wikidot: <sup class="footnoteref"><a id="footnoteref-N" href="javascript:;">N</a></sup>
			if (el.matches('sup.footnoteref')) {
				const link = el.querySelector('a[id^="footnoteref-"]');
				if (link) {
					const linkId = link.id || '';
					const match = linkId.match(/^footnoteref-(\d+)$/);
					if (match) {
						footnoteId = match[1];
					}
				}
			// Nature.com
			} else if (el.matches('a[id^="ref-link"]')) {
				footnoteId = el.textContent?.trim() || '';
			// Science.org
			} else if (el.matches('a[role="doc-biblioref"]')) {
				const xmlRid = el.getAttribute('data-xml-rid');
				if (xmlRid) {
					footnoteId = xmlRid;
				} else {
					const href = el.getAttribute('href');
					if (href?.startsWith('#core-R')) {
						footnoteId = href.replace('#core-', '');
					}
				}
			// Substack
			} else if (el.matches('a.footnote-anchor, span.footnote-hovercard-target a')) {
				const id = el.id?.replace('footnote-anchor-', '') || '';
				if (id) {
					footnoteId = id.toLowerCase();
				}
			// Arxiv
			} else if (el.matches('cite.ltx_cite')) {
				const link = el.querySelector('a');
				if (link) {
					const href = link.getAttribute('href');
					if (href) {
						const match = href.split('/').pop()?.match(/bib\.bib(\d+)/);
						if (match) {
							footnoteId = match[1].toLowerCase();
						}
					}
				}
			} else if (el.matches('sup.reference')) {
				const links = el.querySelectorAll('a');
				Array.from(links).forEach((link: any) => {
					const href = link.getAttribute('href');
					if (href) {
						const match = href.split('/').pop()?.match(/(?:cite_note|cite_ref)-(.+)/);
						if (match) {
							footnoteId = match[1].toLowerCase();
						}
					}
				});
			} else if (el.matches('sup[id^="fnref:"]')) {
				footnoteId = el.id.replace('fnref:', '').toLowerCase();
			} else if (el.matches('sup[id^="fnr"]')) {
				footnoteId = el.id.replace('fnr', '').toLowerCase();
			} else if (el.matches('span.footnote-reference')) {
				footnoteId = el.getAttribute('data-footnote-id') || '';
				// LessWrong uses id="fnrefXXX" on the span
				if (!footnoteId && el.id?.startsWith('fnref')) {
					footnoteId = el.id.replace('fnref', '').toLowerCase();
				}
			} else if (el.matches('span.footnote-link')) {
				footnoteId = el.getAttribute('data-footnote-id') || '';
				footnoteContent = el.getAttribute('data-footnote-content') || '';
			} else if (el.matches('a.citation')) {
				footnoteId = el.textContent?.trim() || '';
				footnoteContent = el.getAttribute('href') || '';
			} else if (el.matches('a[id^="fnref"]')) {
				footnoteId = el.id.replace('fnref', '').toLowerCase();
			} else {
				// Other citation types
				const href = el.getAttribute('href');
				if (href) {
					const id = href.replace(/^[#]/, '');
					footnoteId = id.toLowerCase();
				}
			}

			if (footnoteId) {
				// Find the footnote number by matching the original ID
				const footnoteEntry = Object.entries(footnotes).find(
					([_, data]) => data.originalId === footnoteId.toLowerCase()
				);

				if (footnoteEntry) {
					const [footnoteNumber, footnoteData] = footnoteEntry;
					
					// Create footnote reference ID
					const refId = footnoteData.refs.length > 0 ? 
						`fnref:${footnoteNumber}-${footnoteData.refs.length + 1}` : 
						`fnref:${footnoteNumber}`;
					
					footnoteData.refs.push(refId);

					// Find the outermost container (span or sup)
					const container = this.findOuterFootnoteContainer(el);
					
					// If container is a sup, group references
					if (container.tagName.toLowerCase() === 'sup') {
						if (!supGroups.has(container)) {
							supGroups.set(container, []);
						}
						const group = supGroups.get(container);
						group.push(this.createFootnoteReference(footnoteNumber, refId));
					} else {
						// Replace the container directly
						container.replaceWith(this.createFootnoteReference(footnoteNumber, refId));
					}
				}
			}
		});

		// Fallback: match remaining unmatched footnotes
		const unmatchedFootnotes = Object.entries(footnotes).filter(
			([_, data]) => data.refs.length === 0
		);

		if (unmatchedFootnotes.length > 0) {
			// Build lookup maps
			const footnoteIdMap = new Map<string, [string, FootnoteData]>();
			const footnoteNumMap = new Map<string, [string, FootnoteData]>();
			unmatchedFootnotes.forEach(([num, data]) => {
				footnoteIdMap.set(data.originalId, [num, data]);
				footnoteNumMap.set(num, [num, data]);
			});

			// Pass 1: Match by fragment link (e.g. <a href="#mn37note01">1</a>)
			const allLinks = element.querySelectorAll('a[href*="#"]');
			allLinks.forEach((link: any) => {
				if (!link.parentNode) return;

				// Skip if already inside a standardized footnote ref
				const closestFnref = link.closest('[id^="fnref:"]');
				if (closestFnref) return;

				// Skip if inside the footnotes section itself
				const closestFootnotes = link.closest('#footnotes');
				if (closestFootnotes) return;

				// Skip if inside the generic container (footnote definitions)
				if (this.genericContainer && this.genericContainer.contains(link)) return;

				const href = link.getAttribute('href') || '';
				const fragment = href.split('#').pop()?.toLowerCase();
				if (!fragment) return;

				const entry = footnoteIdMap.get(fragment);
				if (!entry) return;

				// Validate it looks like a footnote marker
				const text = link.textContent?.trim() || '';
				if (!/^[\[\(]?\d{1,4}[\]\)]?$/.test(text)) return;

				const [footnoteNumber, footnoteData] = entry;

				const refId = footnoteData.refs.length > 0
					? `fnref:${footnoteNumber}-${footnoteData.refs.length + 1}`
					: `fnref:${footnoteNumber}`;

				footnoteData.refs.push(refId);

				const container = this.findOuterFootnoteContainer(link);
				container.replaceWith(this.createFootnoteReference(footnoteNumber, refId));
			});

			// Pass 2: Match sup/span elements with numeric text (e.g. <sup class="footnote-ref">1</sup>)
			const stillUnmatched = Object.entries(footnotes).filter(
				([_, data]) => data.refs.length === 0
			);

			if (stillUnmatched.length > 0) {
				const supElements = element.querySelectorAll('sup, span.footnote-ref');
				supElements.forEach((el: any) => {
					if (!el.parentNode) return;

					// Skip if already standardized
					if (el.id?.startsWith('fnref:')) return;

					// Skip if inside the footnotes section
					if (el.closest('#footnotes')) return;

					const text = el.textContent?.trim() || '';
					const match = text.match(/^[\[\(]?(\d{1,4})[\]\)]?$/);
					if (!match) return;

					const num = match[1];
					// Match against footnote number or originalId
					const entry = footnoteNumMap.get(num) || footnoteIdMap.get(num);
					if (!entry) return;

					const [footnoteNumber, footnoteData] = entry;
					if (footnoteData.refs.length > 0) return; // Already matched

					const refId = `fnref:${footnoteNumber}`;
					footnoteData.refs.push(refId);

					const container = this.findOuterFootnoteContainer(el);
					container.replaceWith(this.createFootnoteReference(footnoteNumber, refId));
				});
			}
		}

		// Handle grouped references
		supGroups.forEach((references, container) => {
			if (references.length > 0) {
				// Create a document fragment to hold all the references
				const fragment = this.doc.createDocumentFragment();
				
				// Add each reference as its own sup element
				references.forEach((ref: any) => {
					const link = ref.querySelector('a');
					if (link) {
						const sup = this.doc.createElement('sup');
						sup.id = ref.id;
						sup.appendChild(link.cloneNode(true));
						fragment.appendChild(sup);
					}
				});
				
				container.replaceWith(fragment);
			}
		});

		// Create the standardized footnote list
		const newList = this.doc.createElement('div');
		newList.id = 'footnotes';
		const orderedList = this.doc.createElement('ol');

		// Merge sidenotes and regular footnotes
		const allFootnotes = { ...sidenotes, ...footnotes };

		// Create footnote items in order
		Object.entries(allFootnotes).forEach(([number, data]) => {
			const newItem = this.createFootnoteItem(
				parseInt(number),
				data.content,
				data.refs
			);
			orderedList.appendChild(newItem);
		});

		// Remove original footnote lists
		const footnoteLists = element.querySelectorAll(FOOTNOTE_LIST_SELECTORS);
		footnoteLists.forEach((list: any) => list.remove());

		// Remove generically-detected footnote container
		if (this.genericContainer && this.genericContainer.parentNode) {
			this.genericContainer.remove();
		}

		// If we have any footnotes, add the new list to the document
		if (orderedList.children.length > 0) {
			newList.appendChild(orderedList);
			element.appendChild(newList);
		}
	}
}

/**
 * Standardizes footnotes in the given element
 * @param element The element to standardize footnotes in
 */
export function standardizeFootnotes(element: any): void {
	// Get the document from the element's ownerDocument
	const doc = element.ownerDocument;
	if (!doc) {
		console.warn('standardizeFootnotes: No document available');
		return;
	}

	const handler = new FootnoteHandler(doc);
	handler.standardizeFootnotes(element);
}