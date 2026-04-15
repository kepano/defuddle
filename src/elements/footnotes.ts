import { FOOTNOTE_LIST_SELECTORS, FOOTNOTE_INLINE_REFERENCES, BLOCK_LEVEL_ELEMENTS } from '../constants';
import { transferContent, parseHTML, serializeHTML } from '../utils/dom';
import { isElement, isTextNode } from '../utils';
import { removeOrphanedDividers } from '../standardize';

// Matches heading text for loose footnote section delimiters
const FOOTNOTE_SECTION_RE = /^(foot\s*notes?|end\s*notes?|notes?|references?)$/i;

// Unicode return/backref arrow glyphs used as backlink text
const BACKREF_SYMBOLS_RE = /^[\u21A9\u21A5\u2191\u21B5\u2934\u2935\u23CE]+$/;

type FootnoteData = { content: any; originalId: string; refs: string[] };
type FootnoteCollection = Record<number, FootnoteData>;

class FootnoteHandler {
	private doc: any;
	private genericContainer: any = null;
	private genericElements: any[] = [];
	private extraContainersToRemove: any[] = [];

	constructor(doc: any) {
		this.doc = doc;
	}

	private makeRefId(footnoteNumber: string, refsLength: number): string {
		return refsLength > 0 ? `fnref:${footnoteNumber}-${refsLength + 1}` : `fnref:${footnoteNumber}`;
	}

	private mergeFootnotes(target: FootnoteCollection, source: FootnoteCollection): void {
		for (const [num, data] of Object.entries(source)) {
			const n = parseInt(num);
			if (!target[n]) target[n] = data;
		}
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

		if (typeof content === 'string') {
			const paragraph = doc.createElement('p');
			paragraph.appendChild(parseHTML(doc, content));
			newItem.appendChild(paragraph);
		} else {
			const children = Array.from(content.children) as any[];
			const hasParagraphs = children.some((c: any) => c.tagName.toLowerCase() === 'p');
			const hasBlockChildren = children.some((c: any) => BLOCK_LEVEL_ELEMENTS.has(c.tagName.toLowerCase()));
			if (!hasParagraphs && !hasBlockChildren) {
				// Wrap inline content in a paragraph
				const paragraph = doc.createElement('p');
				transferContent(content, paragraph);
				this.removeBackrefs(paragraph);
				newItem.appendChild(paragraph);
			} else if (!hasParagraphs && hasBlockChildren) {
				// Append block children directly to avoid invalid <p><div> nesting
				children.forEach((child: any) => {
					if (this.isBackrefLink(child)) return;
					const clone = child.cloneNode(true);
					this.removeBackrefs(clone);
					newItem.appendChild(clone);
				});
			} else {
				children.forEach((child: any) => {
					if (this.isBackrefLink(child)) return;
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
		const processedIds = new Set<string>();
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
							// Clone to avoid modifying the original DOM
							const clone = div.cloneNode(true);
							const backLink = clone.querySelector('a');
							if (backLink) backLink.remove();
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

			// pulldown-cmark / mdBook / zola: standalone div.footnote-definition.
			// Skip if wrapped in div.footnote-definitions (handled by the next branch).
			if (list.matches('div.footnote-definition') && !list.parentElement?.matches('div.footnote-definitions')) {
				const id = (list.id || '').toLowerCase();
				if (!id || processedIds.has(id)) return;

				const clone = list.cloneNode(true);
				const label = clone.querySelector('sup.footnote-definition-label');
				if (label) label.remove();

				footnotes[footnoteCount] = {
					content: clone,
					originalId: id,
					refs: []
				};
				processedIds.add(id);
				footnoteCount++;
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
				const parent = list.parentElement;
				if (parent && parent !== element && parent.classList?.contains('footnotes')) {
					this.extraContainersToRemove.push(parent);
				}
				return;
			}

			// Easy Footnotes WP plugin: li items have no id, id is on a child span
			if (list.matches('ol.easy-footnotes-wrapper')) {
				const items = list.querySelectorAll('li.easy-footnote-single');
				items.forEach((li: any) => {
					const idSpan = li.querySelector('span[id^="easy-footnote-bottom-"]');
					if (!idSpan) return;
					const id = idSpan.id.toLowerCase();
					if (processedIds.has(id)) return;

					const clone = li.cloneNode(true);
					const cloneIdSpan = clone.querySelector('span[id^="easy-footnote-bottom-"]');
					if (cloneIdSpan) cloneIdSpan.remove();
					const backLink = clone.querySelector('a.easy-footnote-to-top');
					if (backLink) backLink.remove();

					footnotes[footnoteCount] = {
						content: clone,
						originalId: id,
						refs: []
					};
					processedIds.add(id);
					footnoteCount++;
				});
				// Track empty anchor spans left in the body by the plugin for later removal
				element.querySelectorAll('span.easy-footnote-margin-adjust').forEach((span: any) => {
					this.extraContainersToRemove.push(span);
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

			const items = list.querySelectorAll('li, div[role="listitem"]');
			items.forEach((li: any) => {
				let id = '';
				let content: any = null;
				const citationsDiv = li.querySelector('.citations');
				if (citationsDiv?.id?.toLowerCase().startsWith('r')) {
					id = citationsDiv.id.toLowerCase();
					const citationContent = citationsDiv.querySelector('.citation-content');
					if (citationContent) {
						content = citationContent;
					}
				} else {
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

		// Generic fallback: ID-based detection when no selectors matched
		if (footnoteCount === 1) {
			const candidateRefs = new Map<string, any[]>();
			const allAnchors = element.querySelectorAll('a[href*="#"]');
			allAnchors.forEach((a: any) => {
				const fragment = this.getHrefFragment(a);
				if (!fragment) return;

				const text = a.textContent?.trim() || '';
				if (!/^\[?\(?\d{1,4}\)?\]?$/.test(text)) return;

				if (!candidateRefs.has(fragment)) {
					candidateRefs.set(fragment, []);
				}
				candidateRefs.get(fragment)!.push(a);
			});

			if (candidateRefs.size >= 2) {
				const fragmentSet = new Set(candidateRefs.keys());
				const containers = element.querySelectorAll('div, section, aside, footer, ol, ul');
				let bestContainer: any = null;
				let bestMatchCount = 0;

					containers.forEach((container: any) => {
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

					orderedElements.forEach(({ el, id }) => {
						if (processedIds.has(id)) return;

						const contentDiv = element.ownerDocument.createElement('div');
						const clone = el.cloneNode(true);

						// Remove empty/numeric ID anchors (e.g. <a id="r1"></a> or <a id="r1">1.</a>)
						const idAnchor = clone.querySelector(`a[id="${id}"]`);
						if (idAnchor && (!idAnchor.textContent?.trim() || /^\d+[.)]*\s*$/.test(idAnchor.textContent.trim()))) {
							idAnchor.remove();
						}

						// Remove named anchor footnote marker (e.g. Gutenberg)
						const namedAnchor = clone.querySelector('a[name]');
						if (namedAnchor && namedAnchor.getAttribute('name')?.toLowerCase() === id) {
							namedAnchor.remove();
						}

						const firstText = clone.childNodes[0];
						if (firstText && firstText.nodeType === 3) {
							firstText.textContent = firstText.textContent.replace(/^\d+\.\s*/, '').replace(/^\s+/, '');
						}

						if (clone.matches('li')) {
							transferContent(clone, contentDiv);
						} else {
							contentDiv.appendChild(clone);
						}

						let sibling = el.nextElementSibling;
						while (sibling && !sibling.id) {
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

					let container: any = anchor.parentElement;
					while (container && container !== element) {
						const tag = container.tagName.toLowerCase();
						if (tag === 'p' || tag === 'div' || tag === 'li') break;
						container = container.parentElement;
					}
					if (!container || container === element) return;

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

		// Google Docs/Sites: p[id^="ftnt"] with back-link a[href*="#ftnt_ref"]
		if (footnoteCount === 1) {
			const gdocFootnotes = Array.from(element.querySelectorAll('p[id^="ftnt"]'));
			const gdocPairs: Array<{num: number, el: any}> = [];
			gdocFootnotes.forEach((p: any) => {
				const id = p.id || '';
				const match = id.match(/^ftnt(\d+)$/);
				if (!match) return;
				gdocPairs.push({ num: parseInt(match[1]), el: p });
			});

			if (gdocPairs.length >= 2) {
				gdocPairs.sort((a, b) => a.num - b.num);
				gdocPairs.forEach(({ num, el }) => {
					const originalId = `ftnt${num}`;
					if (processedIds.has(originalId)) return;

					const clone = el.cloneNode(true) as any;
					const backref = clone.querySelector('a[href*="#ftnt_ref"]');
					if (backref) backref.remove();

					const contentDiv = element.ownerDocument.createElement('div');
					contentDiv.appendChild(clone);

					footnotes[num] = { content: contentDiv, originalId, refs: [] };
					processedIds.add(originalId);
					if (num >= footnoteCount) footnoteCount = num + 1;

					// Remove the paragraph and its wrapper div
					this.genericElements.push(el);
					const parent = el.parentElement;
					if (parent && parent !== element && parent.tagName.toLowerCase() === 'div' && parent.children.length === 1) {
						this.genericElements.push(parent);
					}
				});

				// Remove "Footnotes" heading preceding the first footnote
				const firstEl = gdocPairs[0].el;
				const firstParent = firstEl.parentElement;
				const scanFrom = (firstParent && firstParent !== element && firstParent.tagName.toLowerCase() === 'div')
					? firstParent : firstEl;
				const prev = scanFrom.previousElementSibling;
				if (prev && /^h[1-6]$/.test(prev.tagName.toLowerCase()) && FOOTNOTE_SECTION_RE.test(prev.textContent?.trim() || '')) {
					this.genericElements.push(prev);
				}
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

	parseFootnoteNum(el: any): number | null {
		const first = el.firstElementChild;
		if (!first) return null;
		const ft = first.tagName.toLowerCase();
		if (ft !== 'sup' && ft !== 'strong') return null;
		const numText = first.textContent?.trim() || '';
		const num = parseInt(numText, 10);
		return !isNaN(num) && num >= 1 && String(num) === numText ? num : null;
	}

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

	findLooseFootnoteParagraphs(
		element: any
	): { paragraphs: Array<{num: number; el: any}>; toRemove: any[] } | null {
		// Use parent of last <p> as scan container for nested layouts (e.g. Next.js)
		const allPs = Array.from(element.querySelectorAll('p')) as any[];
		const container = allPs.length > 0 ? (allPs[allPs.length - 1].parentElement ?? element) : element;
		const children = Array.from(container.children) as any[];

		// Strategy 1: forward-scan after the last <hr>
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

		// Strategy 2: backward-scan for trailing numbered paragraphs
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

	isBackrefLink(el: any): boolean {
		if (el.tagName?.toLowerCase() !== 'a') return false;
		const text = el.textContent?.trim().replace(/\uFE0E|\uFE0F/g, '') || '';
		return BACKREF_SYMBOLS_RE.test(text) || !!el.classList?.contains('footnote-backref');
	}

	removeBackrefs(el: any): void {
		el.querySelectorAll('a').forEach((a: any) => {
			if (this.isBackrefLink(a)) a.remove();
		});
		while (el.lastChild && el.lastChild.nodeType === 3) {
			const text = el.lastChild.textContent;
			if (/^[\s,.;]*$/.test(text)) {
				el.lastChild.remove();
			} else {
				break;
			}
		}
	}

	getChildAnchorId(el: any): string {
		const anchor = el.querySelector('a[id], a[name]');
		if (!anchor) return '';
		return (anchor.id || anchor.getAttribute('name') || '').toLowerCase();
	}

	// Extract the lowercase fragment id from an anchor's href (part after the last '#').
	getHrefFragment(anchor: any): string {
		const href = anchor?.getAttribute('href') || '';
		return href.split('#').pop()?.toLowerCase() || '';
	}

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

		while (parent) {
			const tag = parent.tagName.toLowerCase();
			if (tag !== 'span' && tag !== 'sup') break;

			// Don't walk into spans that contain substantial non-footnote content
			if (tag === 'span') {
				let hasNonFootnoteContent = false;
				for (const child of parent.childNodes) {
					if (child === current) continue;
					if (isTextNode(child) && child.textContent?.trim()) {
						hasNonFootnoteContent = true;
						break;
					}
					if (isElement(child) && child.tagName.toLowerCase() !== 'sup') {
						hasNonFootnoteContent = true;
						break;
					}
				}
				if (hasNonFootnoteContent) break;
			}
			current = parent;
			parent = parent.parentElement;
		}

		return current;
	}

	createFootnoteReference(footnoteNumber: string, refId: string): any {
		const sup = this.doc.createElement('sup');
		sup.id = refId;
		const link = this.doc.createElement('a');
		link.href = `#fn:${footnoteNumber}`;
		link.textContent = footnoteNumber;
		sup.appendChild(link);
		return sup;
	}

	// Tufte-style and inline sidenotes embedded in text
	collectInlineSidenotes(element: any): FootnoteCollection {
		const footnotes: FootnoteCollection = {};
		const containers = element.querySelectorAll('span.footnote-container, span.sidenote-container, span.inline-footnote');

		// Remove standalone sidenotes that duplicate the formal footnote list
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

			footnotes[footnoteCount] = {
				content: content.cloneNode(true),
				originalId: String(footnoteCount),
				refs: [`fnref:${footnoteCount}`]
			};

			const ref = this.createFootnoteReference(String(footnoteCount), `fnref:${footnoteCount}`);
			container.replaceWith(ref);

			footnoteCount++;
		});

		return footnotes;
	}

	// Sidenotes rendered in a separate column/container
	collectSidenotesColumn(element: any): FootnoteCollection {
		const footnotes: FootnoteCollection = {};

		let columns = Array.from(element.querySelectorAll('.sidenotes-column')) as any[];

		// Sidenote columns are often siblings of an ancestor
		// (e.g. <div class="wrapper"><article>…</article><aside class="sidenotes-column">)
		if (columns.length === 0) {
			let ancestor = element.parentElement;
			for (let i = 0; i < 3 && ancestor && columns.length === 0; i++) {
				columns = Array.from(ancestor.querySelectorAll(':scope > .sidenotes-column')) as any[];
				ancestor = ancestor.parentElement;
			}
		}
		if (columns.length === 0) return footnotes;

		let footnoteCount = 1;
		columns.forEach((column: any) => {
			const sidenotes = column.querySelectorAll('.sidenote[id]');
			sidenotes.forEach((sidenote: any) => {
				const id = sidenote.id;
				if (!id) return;

				const idSpan = sidenote.querySelector('.sidenote__id');
				const num = idSpan?.textContent?.replace(/\D/g, '');
				const footnoteNumber = num ? parseInt(num, 10) : footnoteCount;

				const contentDiv = this.doc.createElement('div');
				Array.from(sidenote.childNodes).forEach((node: any) => {
					if (isElement(node)) {
						if (node.classList?.contains('sidenote__id')) return;
						if (node.classList?.contains('sidenote__label')) return;
						if (node.classList?.contains('sn-backref')) return;
					}
					contentDiv.appendChild(node.cloneNode(true));
				});

				this.removeBackrefs(contentDiv);

				footnotes[footnoteNumber] = {
					content: contentDiv,
					originalId: id.toLowerCase(),
					refs: []
				};
				footnoteCount++;
			});

			column.remove();
		});

		return footnotes;
	}

	// Footnotes in asides with numbered ordered lists
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

	// Hidden aside footnotes linked by data-definition attribute
	// Pattern: <span data-definition="id"><a href="#">*</a></span>
	//          <aside style="display:none" id="id">content</aside>
	collectHiddenAsideFootnotes(element: any): FootnoteCollection {
		const footnotes: FootnoteCollection = {};

		const refs = Array.from(element.querySelectorAll('span[data-definition]')) as any[];
		if (refs.length === 0) return footnotes;

		const asideMap = new Map<string, any>();
		element.querySelectorAll('aside[id]').forEach((aside: any) => {
			asideMap.set(aside.id, aside);
		});

		let footnoteCount = 1;

		refs.forEach((ref: any) => {
			const defId = ref.getAttribute('data-definition');
			if (!defId) return;

			const aside = asideMap.get(defId);
			if (!aside) return;

			const contentDiv = this.doc.createElement('div');
			transferContent(aside, contentDiv);
			aside.remove();

			const footnoteNumber = String(footnoteCount);
			const refId = `fnref:${footnoteNumber}`;
			footnotes[footnoteCount] = {
				content: contentDiv,
				originalId: defId.toLowerCase(),
				refs: [refId]
			};

			ref.replaceWith(this.createFootnoteReference(footnoteNumber, refId));
			footnoteCount++;
		});

		return footnotes;
	}

	standardizeFootnotes(element: any) {
		const sidenotes = this.collectInlineSidenotes(element);
		const footnotes = this.collectHiddenAsideFootnotes(element);
		this.mergeFootnotes(footnotes, this.collectFootnotes(element));
		this.mergeFootnotes(footnotes, this.collectSidenotesColumn(element));
		this.mergeFootnotes(footnotes, this.collectAsideFootnotes(element));

		const footnoteInlineReferences = element.querySelectorAll(FOOTNOTE_INLINE_REFERENCES);
		const supGroups = new Map();

		const footnotesByOriginalId = new Map<string, [string, FootnoteData]>();
		Object.entries(footnotes).forEach(([num, data]) => {
			footnotesByOriginalId.set(data.originalId.toLowerCase(), [num, data]);
		});

		footnoteInlineReferences.forEach((el: any) => {
			if (!el || !el.parentNode) return;

			if (!el.textContent?.trim()) return;

			let footnoteId = '';
			let footnoteContent = '';
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
			// Arxiv — multi-citation groups (e.g. [35, 2, 5])
			} else if (el.matches('cite.ltx_cite')) {
				const links = Array.from(el.querySelectorAll('a'));
				if (links.length > 0) {
					const refs: any[] = [];
					links.forEach((link: any) => {
						const href = link.getAttribute('href');
						if (!href) return;
						const match = href.split('/').pop()?.match(/bib\.bib(\d+)/);
						if (!match) return;
						const citationId = match[1].toLowerCase();
						const entry = footnotesByOriginalId.get(citationId);
						if (!entry) return;
						const [fnNum, fnData] = entry;
						const refId = this.makeRefId(fnNum, fnData.refs.length);
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
			} else if (el.matches('sup.footnote-reference')) {
				footnoteId = this.getHrefFragment(el.querySelector('a[href^="#"]'));
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
				const footnoteEntry = footnotesByOriginalId.get(footnoteId.toLowerCase());

				if (footnoteEntry) {
					const [footnoteNumber, footnoteData] = footnoteEntry;
					const container = this.findOuterFootnoteContainer(el);
					const isSup = container.tagName.toLowerCase() === 'sup';

					// Dedupe: when an outer sup and its inner anchor both match the same footnote,
					// keep only the first reference.
					if (isSup && supGroups.get(container)?.some((r: any) => r.footnoteNumber === footnoteNumber)) {
						return;
					}

					const refId = this.makeRefId(footnoteNumber, footnoteData.refs.length);
					footnoteData.refs.push(refId);

					if (isSup) {
						if (!supGroups.has(container)) supGroups.set(container, []);
						supGroups.get(container).push({ footnoteNumber, refId });
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
			const footnoteIdMap = new Map<string, [string, FootnoteData]>();
			const footnoteNumMap = new Map<string, [string, FootnoteData]>();
			unmatchedFootnotes.forEach(([num, data]) => {
				footnoteIdMap.set(data.originalId, [num, data]);
				footnoteNumMap.set(num, [num, data]);
			});

			const isInsideFootnotes = (el: any) =>
				el.closest('[id^="fnref:"]') || el.closest('#footnotes') ||
				(this.genericContainer && this.genericContainer.contains(el)) ||
				this.genericElements.some((g: any) => g.contains(el));

			const assignRef = (el: any, entry: [string, FootnoteData]) => {
				const [footnoteNumber, footnoteData] = entry;
				const refId = this.makeRefId(footnoteNumber, footnoteData.refs.length);
				footnoteData.refs.push(refId);
				const container = this.findOuterFootnoteContainer(el);
				this.replaceContainerPreservingText(container, this.createFootnoteReference(footnoteNumber, refId));
			};

			// Pass 1: Match by fragment link
			element.querySelectorAll('a[href*="#"]').forEach((link: any) => {
				if (!link.parentNode || isInsideFootnotes(link)) return;
				const fragment = this.getHrefFragment(link);
				if (!fragment) return;
				const entry = footnoteIdMap.get(fragment);
				if (!entry) return;
				const text = link.textContent?.trim() || '';
				if (!/^[\[\(]?\d{1,4}[\]\)]?$/.test(text)) return;
				assignRef(link, entry);
			});

			// Pass 2: Match sup/span elements with numeric text
			const hasUnmatched = Object.values(footnotes).some(d => d.refs.length === 0);
			if (hasUnmatched) {
				element.querySelectorAll('sup, span.footnote-ref').forEach((el: any) => {
					if (!el.parentNode || el.id?.startsWith('fnref:') || el.closest('#footnotes')) return;
					const match = (el.textContent?.trim() || '').match(/^[\[\(]?(\d{1,4})[\]\)]?$/);
					if (!match) return;
					const entry = footnoteNumMap.get(match[1]) || footnoteIdMap.get(match[1]);
					if (!entry || entry[1].refs.length > 0) return;
					assignRef(el, entry);
				});
			}
		}

		supGroups.forEach((refs: Array<{footnoteNumber: string, refId: string}>, container: any) => {
			const fragment = this.doc.createDocumentFragment();
			refs.forEach(({ footnoteNumber, refId }) => {
				fragment.appendChild(this.createFootnoteReference(footnoteNumber, refId));
			});
			container.replaceWith(fragment);
		});

		const newList = this.doc.createElement('div');
		newList.id = 'footnotes';
		const orderedList = this.doc.createElement('ol');
		const allFootnotes = { ...sidenotes, ...footnotes };

		Object.entries(allFootnotes).forEach(([number, data]) => {
			orderedList.appendChild(this.createFootnoteItem(parseInt(number), data.content, data.refs));
		});

		element.querySelectorAll(FOOTNOTE_LIST_SELECTORS).forEach((list: any) => list.remove());
		if (this.genericContainer?.parentNode) this.genericContainer.remove();
		this.genericElements.forEach((el: any) => { if (el.parentNode) el.remove(); });
		this.extraContainersToRemove.forEach((el: any) => { if (el.parentNode) el.remove(); });

		removeOrphanedDividers(element);

		if (orderedList.children.length > 0) {
			newList.appendChild(orderedList);
			element.appendChild(newList);
		}
	}
}

export function standardizeFootnotes(element: any): void {
	const doc = element.ownerDocument;
	if (!doc) {
		// No document available
		return;
	}

	const handler = new FootnoteHandler(doc);
	handler.standardizeFootnotes(element);
}