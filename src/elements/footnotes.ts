import { FOOTNOTE_LIST_SELECTORS, FOOTNOTE_INLINE_REFERENCES } from '../constants';
import { transferContent, parseHTML, serializeHTML } from '../utils/dom';
import { isElement, isTextNode } from '../utils';
import { removeOrphanedDividers } from '../standardize';

// Matches heading text for loose footnote section delimiters
const FOOTNOTE_SECTION_RE = /^(foot\s*notes?|end\s*notes?|notes?|references?)$/i;

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
	private genericElements: any[] = [];
	private extraContainersToRemove: any[] = [];

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
			const BLOCK_TAGS = new Set(['div', 'section', 'article', 'aside', 'blockquote', 'dl', 'figure', 'footer', 'form', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'header', 'hr', 'main', 'nav', 'ol', 'p', 'pre', 'table', 'ul']);
			const children = Array.from(content.children) as any[];
			const hasParagraphs = children.some((c: any) => c.tagName.toLowerCase() === 'p');
			const hasBlockChildren = children.some((c: any) => BLOCK_TAGS.has(c.tagName.toLowerCase()));
			if (!hasParagraphs && !hasBlockChildren) {
				// No paragraph or block structure — wrap all content (including text nodes) in a single paragraph
				const paragraph = doc.createElement('p');
				transferContent(content, paragraph);
				this.removeBackrefs(paragraph);
				newItem.appendChild(paragraph);
			} else if (!hasParagraphs && hasBlockChildren) {
				// Block children but no paragraphs — append directly to avoid <p><div> invalid nesting
				children.forEach((child: any) => {
					const clone = child.cloneNode(true);
					this.removeBackrefs(clone);
					newItem.appendChild(clone);
				});
			} else {
				// Copy direct children in order, preserving non-paragraph elements (lists, blockquotes, etc.)
				children.forEach((child: any) => {
					if (child.tagName.toLowerCase() === 'p') {
						if (!child.textContent?.trim() && !child.querySelector('img, br')) return;
						const newP = doc.createElement('p');
						transferContent(child, newP);
						this.removeBackrefs(newP);
						newItem.appendChild(newP);
					} else {
						const clone = child.cloneNode(true);
						this.removeBackrefs(clone);
						newItem.appendChild(clone);
					}
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

			// Hugo/org-mode: div.footnote-definitions containing div.footnote-definition children
			// Each child: <sup id="footnote-N"><a href="#footnote-reference-N">N</a></sup>
			//              <div class="footnote-body"><p>content</p></div>
			if (list.matches('div.footnote-definitions')) {
				const defs = list.querySelectorAll('div.footnote-definition');
				defs.forEach((def: any) => {
					const supEl = def.querySelector('sup[id]');
					const body = def.querySelector('.footnote-body');
					if (!supEl || !body) return;
					const id = (supEl.id || '').toLowerCase();
					if (!id || processedIds.has(id)) return;
					footnotes[footnoteCount] = {
						content: body.cloneNode(true),
						originalId: id,
						refs: []
					};
					processedIds.add(id);
					footnoteCount++;
				});
				// Also schedule the parent wrapper (e.g. div.footnotes) for removal
				// so the <hr> separator inside it doesn't remain in the output.
				const parent = list.parentElement;
				if (parent && parent !== element && parent.classList?.contains('footnotes')) {
					this.extraContainersToRemove.push(parent);
				}
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

				if (!candidateRefs.has(fragment)) {
					candidateRefs.set(fragment, []);
				}
				candidateRefs.get(fragment)!.push(a);
			});

			if (candidateRefs.size >= 2) {
				// Step 2: Find a container where multiple children have IDs matching our fragments
				const fragmentSet = new Set(candidateRefs.keys());
				const containers = element.querySelectorAll('div, section, aside, footer, ol, ul');
				let bestContainer: any = null;
				let bestMatchCount = 0;

					containers.forEach((container: any) => {
					// Skip containers that are the main content element itself
					if (container === element) return;

					const matchCount = this.findMatchingFootnoteElements(container, fragmentSet).length;
					if (matchCount >= 2 && matchCount >= bestMatchCount) {
						bestMatchCount = matchCount;
						bestContainer = container;
					}
				});

				if (bestContainer) {
					// Validate: require >=75% of external candidate refs (anchors outside the container,
					// i.e. not back-links) to point to footnote elements in this container.
					// This prevents equation/theorem cross-references in the body from being
					// mis-classified as footnotes when only a subset link to any one container.
					const orderedElements = this.findMatchingFootnoteElements(bestContainer, fragmentSet);
					const footnoteFragments = new Set(orderedElements.map(({ id }) => id));
					let externalTotal = 0, externalMatch = 0;
					candidateRefs.forEach((anchors: any[], frag: string) => {
						if (anchors.some((a: any) => bestContainer.contains(a))) return; // back-link
						externalTotal++;
						if (footnoteFragments.has(frag)) externalMatch++;
					});
					if (externalMatch < Math.max(2, Math.ceil(externalTotal * 0.75))) bestContainer = null;

					// Step 3: Extract footnotes from the container in document order

					// Step 4: Handle multi-paragraph footnotes (group consecutive non-ID elements)
					orderedElements.forEach(({ el, id }) => {
						if (processedIds.has(id)) return;

						const contentDiv = element.ownerDocument.createElement('div');
						// Clone the element content
						const clone = el.cloneNode(true);

						// Remove any empty child anchor used as an ID marker (e.g. <a id="r1"></a>)
						// Also remove anchors whose text is just a numeric marker (e.g. <a id="r1">1.</a>)
						const idAnchor = clone.querySelector(`a[id="${id}"]`);
						if (idAnchor && (!idAnchor.textContent?.trim() || /^\d+[.)]*\s*$/.test(idAnchor.textContent.trim()))) {
							idAnchor.remove();
						}

						// Remove named anchor footnote marker (e.g. Gutenberg: <a name="Footnote_4">4</a>)
						const namedAnchor = clone.querySelector('a[name]');
						if (namedAnchor && namedAnchor.getAttribute('name')?.toLowerCase() === id) {
							namedAnchor.remove();
						}

						// Strip leading footnote number (e.g. "1. " or "1 ") or whitespace left by removed anchor
						const firstText = clone.childNodes[0];
						if (firstText && firstText.nodeType === 3) {
							firstText.textContent = firstText.textContent.replace(/^\d+\.\s*/, '').replace(/^\s+/, '');
						}

						// For list items, extract children into contentDiv to avoid <p><li>...</li></p> nesting
						if (clone.matches('li')) {
							transferContent(clone, contentDiv);
						} else {
							contentDiv.appendChild(clone);
						}

						// Check for consecutive siblings without IDs (multi-paragraph footnotes)
						let sibling = el.nextElementSibling;
						while (sibling && !sibling.id) {
							// Stop if this sibling starts a new anchored footnote
							const sibAnchorId = this.getChildAnchorId(sibling);
							if (sibAnchorId && fragmentSet.has(sibAnchorId)) break;
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

		// Microsoft Word HTML export: body refs use href="#_ftn[N]",
		// footnote list items contain back-links href="..#_ftnref[N]" (no IDs on elements).
		if (footnoteCount === 1) {
			const wordBackrefs = Array.from(element.querySelectorAll('a[href*="#_ftnref"]'));
			if (wordBackrefs.length >= 2) {
				const pairs: Array<{num: number, anchor: any}> = [];
				wordBackrefs.forEach((anchor: any) => {
					const href = anchor.getAttribute('href') || '';
					const fragment = href.split('#').pop() || '';
					const match = fragment.match(/^_ftnref(\d+)$/);
					if (match) pairs.push({ num: parseInt(match[1]), anchor });
				});
				pairs.sort((a, b) => a.num - b.num);

				pairs.forEach(({ num, anchor }) => {
					const originalId = `_ftn${num}`;
					if (processedIds.has(originalId)) return;

					// Walk up to the containing block element (p, div, li)
					let container: any = anchor.parentElement;
					while (container && container !== element) {
						const tag = container.tagName.toLowerCase();
						if (tag === 'p' || tag === 'div' || tag === 'li') break;
						container = container.parentElement;
					}
					if (!container || container === element) return;

					// Clone and strip the back-ref marker (the sup containing the anchor)
					const clone = container.cloneNode(true) as any;
					const backrefAnchor = clone.querySelector('a[href*="_ftnref"]');
					if (backrefAnchor) {
						const wrapSup = backrefAnchor.closest('sup');
						if (wrapSup) wrapSup.remove();
						else backrefAnchor.remove();
					}

					const contentDiv = element.ownerDocument.createElement('div');
					contentDiv.appendChild(clone);

					footnotes[num] = { content: contentDiv, originalId, refs: [] };
					processedIds.add(originalId);
					if (num >= footnoteCount) footnoteCount = num + 1;
					this.genericElements.push(container);
				});
			}
		}

		// Loose footnotes: trailing numbered paragraphs cross-referenced with inline <sup>N</sup> refs,
		// or a direct-child container whose child <p>s are all numbered paragraphs.
		if (footnoteCount === 1) {
			const numbered = this.findLooseFootnoteParagraphs(element);
			if (numbered) {
				const { paragraphs, toRemove } = numbered;
				for (let i = 0; i < paragraphs.length; i++) {
					const { num, el: defPara } = paragraphs[i];
					const nextDef = paragraphs[i + 1]?.el ?? null;
					const id = String(num);
					if (processedIds.has(id)) continue;

					const contentDiv = this.stripMarkerAndWrap(defPara);

					// Include sibling elements (e.g. lists) until the next numbered paragraph
					let sibling: any = defPara.nextElementSibling;
					while (sibling && sibling !== nextDef) {
						contentDiv.appendChild(sibling.cloneNode(true));
						sibling = sibling.nextElementSibling;
					}

					footnotes[footnoteCount] = { content: contentDiv, originalId: id, refs: [] };
					processedIds.add(id);
					footnoteCount++;
				}

				this.genericElements.push(...toRemove);
			}
		}

		// Class-based footnote paragraphs: <p class="footnote"><sup>N</sup>content...</p>
		// The "footnote" class is a strong enough signal that we don't require cross-validation
		// or a minimum count, so even a single footnote is detected.
		if (footnoteCount === 1) {
			const footnoteParagraphs: Array<{num: number; el: any}> = [];
			element.querySelectorAll('p.footnote').forEach((p: any) => {
				const num = this.parseFootnoteNum(p);
				if (num !== null) {
					footnoteParagraphs.push({ num, el: p });
				}
			});

			for (const { num, el: defPara } of footnoteParagraphs) {
				const id = String(num);
				if (processedIds.has(id)) continue;

				footnotes[footnoteCount] = { content: this.stripMarkerAndWrap(defPara), originalId: id, refs: [] };
				processedIds.add(id);
				footnoteCount++;
			}
			this.genericElements.push(...footnoteParagraphs.map(p => p.el));
		}

		return footnotes;
	}

	// Clones a footnote paragraph, removes the leading number marker (sup/strong),
	// strips leftover whitespace, and wraps the result in a div.
	stripMarkerAndWrap(el: any): any {
		const contentDiv = el.ownerDocument.createElement('div');
		const clone = el.cloneNode(true) as any;
		const marker = clone.firstElementChild;
		if (marker) {
			marker.remove();
			const firstNode = clone.firstChild;
			if (firstNode?.nodeType === 3) {
				firstNode.textContent = firstNode.textContent.replace(/^\s+/, '');
			}
		}
		contentDiv.appendChild(clone);
		return contentDiv;
	}

	// Returns the footnote number if `el` is a <p> whose first child is <sup>N> or <strong>N</strong>,
	// where N is a positive integer. Returns null otherwise.
	parseFootnoteNum(el: any): number | null {
		const first = el.firstElementChild;
		if (!first) return null;
		const ft = first.tagName.toLowerCase();
		if (ft !== 'sup' && ft !== 'strong') return null;
		const numText = first.textContent?.trim() || '';
		const num = parseInt(numText, 10);
		return !isNaN(num) && num >= 1 && String(num) === numText ? num : null;
	}

	// Returns true if at least 2 of the paragraph numbers appear as bare <sup>N</sup>
	// inline refs in element (outside the footnote paragraphs themselves).
	crossValidate(element: any, paragraphs: Array<{num: number; el: any}>): boolean {
		const numberedNums = new Set(paragraphs.map(p => p.num));
		const matchedNums = new Set<number>();
		element.querySelectorAll('sup').forEach((sup: any) => {
			if (paragraphs.some(fn => fn.el.contains(sup))) return;
			if (sup.querySelector('a')) return; // already standardized or linked
			const text = sup.textContent?.trim() || '';
			const n = parseInt(text, 10);
			if (!isNaN(n) && n >= 1 && String(n) === text && numberedNums.has(n)) {
				matchedNums.add(n);
			}
		});
		return matchedNums.size >= 2;
	}

	// Finds the footnote section in `element` using two methods:
	// Method 1 (<hr> boundary): scans forward from after the last <hr>, collecting
	//   numbered paragraphs. Correctly handles footnotes with continuation paragraphs
	//   or embedded lists between definitions.
	// Method 2 (backwards scan): for articles without <hr>, scans backwards from the
	//   end for trailing numbered <p>s (tolerating lists between them). Falls back to
	//   a heading delimiter if present.
	// Both methods cross-validate against bare <sup>N</sup> inline refs in the body.
	// Returns null if nothing found, or { paragraphs, toRemove } on match.
	findLooseFootnoteParagraphs(
		element: any
	): { paragraphs: Array<{num: number; el: any}>; toRemove: any[] } | null {
		// For nested article layouts (e.g. Next.js blogs), the footnote <p> elements may not
		// be direct children of `element` — they live inside a deeply nested content div.
		// Use the parent of the last <p> descendant as the scan container.
		const allPs = Array.from(element.querySelectorAll('p')) as any[];
		const container = allPs.length > 0 ? (allPs[allPs.length - 1].parentElement ?? element) : element;
		const children = Array.from(container.children) as any[];

		// Method 1: <hr> section boundary.
		// Forward-scan everything after the last <hr> for numbered paragraphs.
		// This correctly handles footnotes that include continuation paragraphs or lists.
		for (let i = children.length - 1; i >= 0; i--) {
			if (children[i].tagName.toLowerCase() !== 'hr') continue;

			const paragraphs: Array<{num: number; el: any}> = [];
			for (let j = i + 1; j < children.length; j++) {
				const num = this.parseFootnoteNum(children[j]);
				if (num !== null) paragraphs.push({ num, el: children[j] });
			}

			if (paragraphs.length >= 2 && this.crossValidate(element, paragraphs)) {
				return { paragraphs, toRemove: children.slice(i) };
			}
			break; // only check the last <hr>
		}

		// Method 2: backwards scan for trailing numbered paragraphs (no <hr> delimiter).
		// Works when each footnote is a single paragraph; tolerates lists between them.
		const trailingNumbered: Array<{num: number; el: any}> = [];
		let firstFootnoteIdx = -1;
		for (let i = children.length - 1; i >= 0; i--) {
			const child = children[i];
			const tag = child.tagName.toLowerCase();

			if (tag === 'p') {
				const num = this.parseFootnoteNum(child);
				if (num !== null) {
					trailingNumbered.unshift({ num, el: child });
					firstFootnoteIdx = i;
					continue;
				}
				break; // non-numbered paragraph — stop
			}

			if (tag === 'ul' || tag === 'ol' || tag === 'blockquote') continue;
			break; // any other element (heading, div, ...) — stop
		}

		if (trailingNumbered.length >= 2 && this.crossValidate(element, trailingNumbered)) {
			const toRemove: any[] = children.slice(firstFootnoteIdx);

			// Also remove an orphaned footnote-section heading immediately before
			const prev = trailingNumbered[0].el.previousElementSibling;
			if (prev) {
				const prevTag = prev.tagName.toLowerCase();
				if (/^h[1-6]$/.test(prevTag) && FOOTNOTE_SECTION_RE.test(prev.textContent?.trim() || '')) {
					toRemove.unshift(prev);
				}
			}

			return { paragraphs: trailingNumbered, toRemove };
		}

		return null;
	}

	removeBackrefs(el: any): void {
		el.querySelectorAll('a').forEach((a: any) => {
			const text = a.textContent?.trim().replace(/\uFE0E|\uFE0F/g, '') || '';
			if (/^[\u21A9\u21A5\u2191\u21B5\u2934\u2935\u23CE]+$/.test(text) || a.classList?.contains('footnote-backref')) {
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

	// Returns the lowercase ID from a child anchor, checking a[id] then a[name].
	getChildAnchorId(el: any): string {
		const anchor = el.querySelector('a[id], a[name]');
		if (!anchor) return '';
		return (anchor.id || anchor.getAttribute('name') || '').toLowerCase();
	}

	// Returns elements within container whose IDs (direct or via child anchor) are in fragmentSet,
	// in document order, deduplicated.
	findMatchingFootnoteElements(container: any, fragmentSet: Set<string>): Array<{el: any, id: string}> {
		const results: Array<{el: any, id: string}> = [];
		const seen = new Set<string>();
		container.querySelectorAll('li, p, div').forEach((el: any) => {
			let id = '';
			if (el.id && fragmentSet.has(el.id.toLowerCase())) {
				id = el.id.toLowerCase();
			} else if (!el.id) {
				const anchorId = this.getChildAnchorId(el);
				if (anchorId && fragmentSet.has(anchorId)) id = anchorId;
			}
			if (id && !seen.has(id)) {
				results.push({ el, id });
				seen.add(id);
			}
		});
		return results;
	}

	replaceContainerPreservingText(container: any, footnoteRef: any): void {
		let directText = '';
		let hasChildElements = false;
		for (const node of container.childNodes) {
			if (isTextNode(node)) directText += node.textContent || '';
			else if (isElement(node)) hasChildElements = true;
		}
		directText = directText.trim();

		if (directText && hasChildElements) {
			const fragment = container.ownerDocument.createDocumentFragment();
			fragment.appendChild(container.ownerDocument.createTextNode(directText));
			fragment.appendChild(footnoteRef);
			container.replaceWith(fragment);
		} else {
			container.replaceWith(footnoteRef);
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
	 * Pattern 1 (Tufte-style): <span class="footnote-container">
	 *            <label class="footnote-number"></label>
	 *            <input class="margin-toggle">
	 *            <span class="footnote">Content...</span>
	 *          </span>
	 * Pattern 2 (inline-footnote): <span class="inline-footnote">N
	 *            <span class="footnoteContent" style="display:none;">Content...</span>
	 *          </span>
	 */
	collectInlineSidenotes(element: any): FootnoteCollection {
		const footnotes: FootnoteCollection = {};
		const containers = element.querySelectorAll('span.footnote-container, span.sidenote-container, span.inline-footnote');

		// Remove standalone sidenote spans that aren't inside a handled container.
		// These appear as siblings of footnote reference sups (e.g. Hugo/org-mode sites)
		// and duplicate content already in the formal footnote list.
		if (containers.length === 0) {
			element.querySelectorAll('span.sidenote').forEach((sidenote: any) => {
				sidenote.remove();
			});
			return footnotes;
		}

		let footnoteCount = 1;
		containers.forEach((container: any) => {
			const content = container.querySelector('span.footnote, span.sidenote, span.footnoteContent');
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

	/**
	 * Collects footnotes from asides containing numbered ordered lists.
	 * Pattern: <aside><ol start="N"><li>Content…</li></ol></aside>
	 * with bare <sup>N</sup> inline refs in the surrounding text.
	 * Asides are removed from the DOM; the Pass 2 fallback in standardizeFootnotes
	 * matches the bare <sup>N</sup> refs to the collected footnotes.
	 */
	collectAsideFootnotes(element: any): FootnoteCollection {
		const footnotes: FootnoteCollection = {};

		const ols = Array.from(element.querySelectorAll('aside > ol[start]')) as any[];
		if (ols.length === 0) return footnotes;

		ols.forEach((ol: any) => {
			const aside = ol.parentElement;
			const footnoteNumber = parseInt(ol.getAttribute('start') || '', 10);
			if (isNaN(footnoteNumber) || footnoteNumber < 1) return;

			const items = Array.from(ol.querySelectorAll('li')) as any[];
			if (items.length === 0) return;

			const contentDiv = this.doc.createElement('div');
			if (items.length === 1) {
				transferContent(items[0].cloneNode(true), contentDiv);
			} else {
				items.forEach((li: any) => {
					const p = this.doc.createElement('p');
					transferContent(li.cloneNode(true), p);
					contentDiv.appendChild(p);
				});
			}

			footnotes[footnoteNumber] = {
				content: contentDiv,
				originalId: String(footnoteNumber),
				refs: []
			};

			aside.remove();
		});

		return footnotes;
	}

	standardizeFootnotes(element: any) {
		// Handle CSS sidenote footnotes first
		const sidenotes = this.collectInlineSidenotes(element);

		const footnotes = this.collectFootnotes(element);

		// Merge aside footnotes; don't overwrite footnotes already collected
		const asideFootnotes = this.collectAsideFootnotes(element);
		for (const [num, data] of Object.entries(asideFootnotes)) {
			const n = parseInt(num);
			if (!footnotes[n]) {
				footnotes[n] = data;
			}
		}

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
			// Arxiv — handle multi-citation groups (e.g. [35, 2, 5])
			} else if (el.matches('cite.ltx_cite')) {
				const links = Array.from(el.querySelectorAll('a'));
				if (links.length > 0) {
					// Process all links in the citation group
					const refs: any[] = [];
					links.forEach((link: any) => {
						const href = link.getAttribute('href');
						if (!href) return;
						const match = href.split('/').pop()?.match(/bib\.bib(\d+)/);
						if (!match) return;
						const citationId = match[1].toLowerCase();
						const entry = Object.entries(footnotes).find(
							([_, data]) => data.originalId === citationId
						);
						if (!entry) return;
						const [fnNum, fnData] = entry;
						const refId = fnData.refs.length > 0
							? `fnref:${fnNum}-${fnData.refs.length + 1}`
							: `fnref:${fnNum}`;
						fnData.refs.push(refId);
						refs.push(this.createFootnoteReference(fnNum, refId));
					});
					if (refs.length > 0) {
						const container = this.findOuterFootnoteContainer(el);
						const fragment = el.ownerDocument.createDocumentFragment();
						refs.forEach((ref: any, i: number) => {
							if (i > 0) {
								fragment.appendChild(el.ownerDocument.createTextNode(' '));
							}
							fragment.appendChild(ref);
						});
						container.replaceWith(fragment);
						// Skip the default single-footnote handling below
						return;
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
						this.replaceContainerPreservingText(container, this.createFootnoteReference(footnoteNumber, refId));
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

				// Skip if inside a generic container (footnote definitions)
				if (this.genericContainer && this.genericContainer.contains(link)) return;
				if (this.genericElements.some((el: any) => el.contains(link))) return;

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
				this.replaceContainerPreservingText(container, this.createFootnoteReference(footnoteNumber, refId));
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
					this.replaceContainerPreservingText(container, this.createFootnoteReference(footnoteNumber, refId));
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

		// Remove generically-detected footnote containers
		if (this.genericContainer && this.genericContainer.parentNode) {
			this.genericContainer.remove();
		}
		this.genericElements.forEach((el: any) => {
			if (el.parentNode) el.remove();
		});

		// Remove outer wrapper containers tracked during collection
		// (e.g. div.footnotes wrapping a div.footnote-definitions)
		this.extraContainersToRemove.forEach((el: any) => {
			if (el.parentNode) el.remove();
		});

		// Strip trailing <hr> left behind after footnote list removal
		// (section separator no longer needed since we append our own standardized list)
		removeOrphanedDividers(element);

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