import { FOOTNOTE_LIST_SELECTORS, FOOTNOTE_INLINE_REFERENCES, BLOCK_LEVEL_ELEMENTS } from '../constants';
import { transferContent, parseHTML, serializeHTML } from '../utils/dom';
import { isElement, isTextNode } from '../utils';
import { removeOrphanedDividers } from '../standardize';

// Matches heading text for loose footnote section delimiters
const FOOTNOTE_SECTION_RE = /^(foot\s*notes?|end\s*notes?|notes?|references?)$/i;

// Return/backref symbols used as backlink text (Unicode arrows + ASCII caret)
const BACKREF_SYMBOLS_RE = /^[\^\u21A9\u21A5\u2191\u21B5\u2934\u2935\u23CE]+$/;

// MediaWiki cite_ref backref href pattern
const CITE_REF_RE = /^#cite_ref-/;

// Numeric footnote marker with optional wrapping brackets/parens (e.g. "1", "[1]", "(23)", "([1])").
// Capture group 1 is the digits. Wrappers are matched loosely — this is a filter, not an identifier.
const FOOTNOTE_MARKER_RE = /^\[?\(?(\d{1,4})\)?\]?$/;

// Lowercase fragment id from an anchor's href (part after the last '#').
function getHrefFragment(anchor: any): string {
	const href = anchor?.getAttribute('href') || '';
	return href.split('#').pop()?.toLowerCase() || '';
}

type FootnoteData = { content: any; originalId: string; refs: string[] };
type FootnoteCollection = Record<number, FootnoteData>;
type CollectState = {
	footnotes: FootnoteCollection;
	processedIds: Set<string>;
	count: number;
};

// Per-selector rules for extracting the footnote id from an inline reference element.
// First matching selector wins. Arxiv's multi-citation `cite.ltx_cite` is handled as
// a special case in standardizeFootnotes, not through this table.
const INLINE_REF_EXTRACTORS: Array<{ selector: string; extract: (el: any) => string }> = [
	{
		selector: 'sup.footnoteref',
		extract: (el) => {
			const link = el.querySelector('a[id^="footnoteref-"]');
			return link?.id.match(/^footnoteref-(\d+)$/)?.[1] || '';
		},
	},
	// Nature.com
	{ selector: 'a[id^="ref-link"]', extract: (el) => el.textContent?.trim() || '' },
	// Science.org
	{
		selector: 'a[role="doc-biblioref"]',
		extract: (el) => {
			const xmlRid = el.getAttribute('data-xml-rid');
			if (xmlRid) return xmlRid;
			const href = el.getAttribute('href') || '';
			return href.startsWith('#core-R') ? href.replace('#core-', '') : '';
		},
	},
	// Substack
	{
		selector: 'a.footnote-anchor, span.footnote-hovercard-target a',
		extract: (el) => (el.id?.replace('footnote-anchor-', '') || '').toLowerCase(),
	},
	// MediaWiki / Wikipedia: take the id from the last matching child anchor.
	{
		selector: 'sup.reference',
		extract: (el) => {
			let id = '';
			el.querySelectorAll('a').forEach((link: any) => {
				const href = link.getAttribute('href') || '';
				const match = href.split('/').pop()?.match(/(?:cite_note|cite_ref)-(.+)/);
				if (match) id = match[1].toLowerCase();
			});
			return id;
		},
	},
	{
		selector: 'sup[id^="fnref:"], span[id^="fnref:"]',
		extract: (el) => el.id.replace('fnref:', '').toLowerCase(),
	},
	{ selector: 'sup[id^="fnr"]', extract: (el) => el.id.replace('fnr', '').toLowerCase() },
	{
		selector: 'sup.footnote-reference',
		extract: (el) => getHrefFragment(el.querySelector('a[href^="#"]')),
	},
	{
		selector: 'span.footnote-reference',
		// LessWrong uses id="fnrefXXX" on the span when data-footnote-id is missing.
		extract: (el) => {
			const attrId = el.getAttribute('data-footnote-id') || '';
			if (attrId) return attrId;
			return el.id?.startsWith('fnref') ? el.id.replace('fnref', '').toLowerCase() : '';
		},
	},
	{ selector: 'span.footnote-link', extract: (el) => el.getAttribute('data-footnote-id') || '' },
	{ selector: 'a.citation', extract: (el) => el.textContent?.trim() || '' },
	{ selector: 'a[id^="fnref"]', extract: (el) => el.id.replace('fnref', '').toLowerCase() },
];

class FootnoteHandler {
	private doc: any;
	private pendingRemovals: any[] = [];

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

	// Record a footnote if id is non-empty and unseen. Without explicitNum, assigns
	// the next sequential slot. With explicitNum, uses that key and advances state.count
	// past it so later sequential adds don't collide.
	private addFootnote(state: CollectState, id: string, content: any, explicitNum?: number): boolean {
		if (!id || state.processedIds.has(id)) return false;
		const key = explicitNum ?? state.count;
		state.footnotes[key] = { content, originalId: id, refs: [] };
		state.processedIds.add(id);
		if (explicitNum === undefined) {
			state.count++;
		} else if (explicitNum >= state.count) {
			state.count = explicitNum + 1;
		}
		return true;
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
		const state: CollectState = { footnotes: {}, processedIds: new Set(), count: 1 };
		const footnoteLists = element.querySelectorAll(FOOTNOTE_LIST_SELECTORS);
		footnoteLists.forEach((list: any) => {
			// Wikidot uses div.footnotes-footer containing div.footnote-footer children
			if (list.matches('div.footnotes-footer')) {
				const footnoteDivs = list.querySelectorAll('div.footnote-footer');
				footnoteDivs.forEach((div: any) => {
					const match = (div.id || '').match(/^footnote-(\d+)$/);
					if (!match) return;
					const id = match[1];
					if (state.processedIds.has(id)) return;
					// Clone to avoid modifying the original DOM
					const clone = div.cloneNode(true);
					const backLink = clone.querySelector('a');
					if (backLink) backLink.remove();
					const text = serializeHTML(clone).replace(/^\s*\.\s*/, '');
					const contentDiv = element.ownerDocument.createElement('div');
					contentDiv.appendChild(parseHTML(element.ownerDocument, text.trim()));
					this.addFootnote(state, id, contentDiv);
				});
				return;
			}

			// pulldown-cmark / mdBook / zola: standalone div.footnote-definition.
			// Skip if wrapped in div.footnote-definitions (handled by the next branch).
			if (list.matches('div.footnote-definition') && !list.parentElement?.matches('div.footnote-definitions')) {
				const id = (list.id || '').toLowerCase();
				const clone = list.cloneNode(true);
				const label = clone.querySelector('sup.footnote-definition-label');
				if (label) label.remove();
				this.addFootnote(state, id, clone);
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
					this.addFootnote(state, (supEl.id || '').toLowerCase(), body.cloneNode(true));
				});
				const parent = list.parentElement;
				if (parent && parent !== element && parent.classList?.contains('footnotes')) {
					this.pendingRemovals.push(parent);
				}
				return;
			}

			// Easy Footnotes WP plugin: li items have no id, id is on a child span
			if (list.matches('ol.easy-footnotes-wrapper')) {
				const items = list.querySelectorAll('li.easy-footnote-single');
				items.forEach((li: any) => {
					const idSpan = li.querySelector('span[id^="easy-footnote-bottom-"]');
					if (!idSpan) return;
					const clone = li.cloneNode(true);
					clone.querySelector('span[id^="easy-footnote-bottom-"]')?.remove();
					clone.querySelector('a.easy-footnote-to-top')?.remove();
					this.addFootnote(state, idSpan.id.toLowerCase(), clone);
				});
				// Track empty anchor spans left in the body by the plugin for later removal
				element.querySelectorAll('span.easy-footnote-margin-adjust').forEach((span: any) => {
					this.pendingRemovals.push(span);
				});
				return;
			}

			// Substack has individual footnote divs with no parent
			if (list.matches('div.footnote[data-component-name="FootnoteToDOM"]')) {
				const anchor = list.querySelector('a.footnote-number');
				const content = list.querySelector('.footnote-content');
				if (anchor && content) {
					this.addFootnote(state, anchor.id.replace('footnote-', '').toLowerCase(), content);
				}
				return;
			}

			const items = list.querySelectorAll('li, div[role="listitem"]');
			items.forEach((li: any) => {
				const { id, content } = this.extractListItemIdAndContent(li);
				this.addFootnote(state, id, content || li);
			});
		});

		const fallbacks = [
			this.tryGenericIdDetection,
			this.tryWordExport,
			this.tryGoogleDocs,
			this.tryLooseFootnotes,
			this.tryClassFootnote,
		];
		for (const fallback of fallbacks) {
			if (state.count > 1) break;
			fallback.call(this, element, state);
		}

		return state.footnotes;
	}

	// Generic fallback: detect footnotes by numeric anchor text referencing an in-container id.
	private tryGenericIdDetection(element: any, state: CollectState): void {
		const candidateRefs = new Map<string, any[]>();
		element.querySelectorAll('a[href*="#"]').forEach((a: any) => {
			const fragment = getHrefFragment(a);
			if (!fragment) return;
			const text = a.textContent?.trim() || '';
			if (!FOOTNOTE_MARKER_RE.test(text)) return;
			if (!candidateRefs.has(fragment)) candidateRefs.set(fragment, []);
			candidateRefs.get(fragment)!.push(a);
		});

		if (candidateRefs.size < 2) return;

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

		if (!bestContainer) return;

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
			if (state.processedIds.has(id)) return;

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
				contentDiv.appendChild(sibling.cloneNode(true));
				sibling = sibling.nextElementSibling;
			}

			this.addFootnote(state, id, contentDiv);
		});

		if (bestContainer) this.pendingRemovals.push(bestContainer);
	}

	// Microsoft Word HTML export: body refs use href="#_ftn[N]",
	// footnote list items contain back-links href="..#_ftnref[N]" (no IDs on elements).
	private tryWordExport(element: any, state: CollectState): void {
		const wordBackrefs = Array.from(element.querySelectorAll('a[href*="#_ftnref"]'));
		if (wordBackrefs.length < 2) return;

		const pairs: Array<{num: number, anchor: any}> = [];
		wordBackrefs.forEach((anchor: any) => {
			const match = getHrefFragment(anchor).match(/^_ftnref(\d+)$/);
			if (match) pairs.push({ num: parseInt(match[1]), anchor });
		});
		pairs.sort((a, b) => a.num - b.num);

		pairs.forEach(({ num, anchor }) => {
			const originalId = `_ftn${num}`;
			if (state.processedIds.has(originalId)) return;

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

			this.addFootnote(state, originalId, contentDiv, num);
			this.pendingRemovals.push(container);
		});
	}

	// Google Docs/Sites: p[id^="ftnt"] with back-link a[href*="#ftnt_ref"]
	private tryGoogleDocs(element: any, state: CollectState): void {
		const gdocPairs: Array<{num: number, el: any}> = [];
		element.querySelectorAll('p[id^="ftnt"]').forEach((p: any) => {
			const match = (p.id || '').match(/^ftnt(\d+)$/);
			if (match) gdocPairs.push({ num: parseInt(match[1]), el: p });
		});

		if (gdocPairs.length < 2) return;

		gdocPairs.sort((a, b) => a.num - b.num);
		gdocPairs.forEach(({ num, el }) => {
			const originalId = `ftnt${num}`;
			if (state.processedIds.has(originalId)) return;

			const clone = el.cloneNode(true) as any;
			clone.querySelector('a[href*="#ftnt_ref"]')?.remove();

			const contentDiv = element.ownerDocument.createElement('div');
			contentDiv.appendChild(clone);

			this.addFootnote(state, originalId, contentDiv, num);

			// Remove the paragraph and its wrapper div
			this.pendingRemovals.push(el);
			const parent = el.parentElement;
			if (parent && parent !== element && parent.tagName.toLowerCase() === 'div' && parent.children.length === 1) {
				this.pendingRemovals.push(parent);
			}
		});

		// Remove "Footnotes" heading preceding the first footnote
		const firstEl = gdocPairs[0].el;
		const firstParent = firstEl.parentElement;
		const scanFrom = (firstParent && firstParent !== element && firstParent.tagName.toLowerCase() === 'div')
			? firstParent : firstEl;
		const prev = scanFrom.previousElementSibling;
		if (prev && /^h[1-6]$/.test(prev.tagName.toLowerCase()) && FOOTNOTE_SECTION_RE.test(prev.textContent?.trim() || '')) {
			this.pendingRemovals.push(prev);
		}
	}

	// Loose footnotes: trailing numbered paragraphs cross-referenced with inline <sup>N</sup> refs,
	// or a direct-child container whose child <p>s are all numbered paragraphs.
	private tryLooseFootnotes(element: any, state: CollectState): void {
		const numbered = this.findLooseFootnoteParagraphs(element);
		if (!numbered) return;

		const { paragraphs, toRemove } = numbered;
		const toRemoveSet = new Set(toRemove);
		for (let i = 0; i < paragraphs.length; i++) {
			const { num, el: defPara } = paragraphs[i];
			const nextDef = paragraphs[i + 1]?.el ?? null;

			const contentDiv = this.stripMarkerAndWrap(defPara);
			let sibling: any = defPara.nextElementSibling;
			while (sibling && sibling !== nextDef && toRemoveSet.has(sibling)) {
				contentDiv.appendChild(sibling.cloneNode(true));
				sibling = sibling.nextElementSibling;
			}

			this.addFootnote(state, String(num), contentDiv);
		}

		this.pendingRemovals.push(...toRemove);
	}

	// Class-based footnote paragraphs: <p class="footnote"><sup>N</sup>content...</p>.
	// The "footnote" class is a strong enough signal that we don't require cross-validation
	// or a minimum count, so even a single footnote is detected.
	private tryClassFootnote(element: any, state: CollectState): void {
		const footnoteParagraphs: Array<{num: number; el: any}> = [];
		element.querySelectorAll('p.footnote').forEach((p: any) => {
			const num = this.parseFootnoteNum(p);
			if (num !== null) footnoteParagraphs.push({ num, el: p });
		});

		for (const { num, el: defPara } of footnoteParagraphs) {
			this.addFootnote(state, String(num), this.stripMarkerAndWrap(defPara));
		}
		this.pendingRemovals.push(...footnoteParagraphs.map(p => p.el));
	}

	private trimLeadingWhitespace(parent: any): void {
		const first = parent.firstChild;
		if (first?.nodeType === 3) {
			first.textContent = first.textContent.replace(/^\s+/, '');
		}
	}

	private isBoldWrappedSup(el: any): boolean {
		const tag = el.tagName?.toLowerCase();
		return (tag === 'b' || tag === 'strong') &&
			el.firstChild === el.firstElementChild &&
			el.firstElementChild?.tagName?.toLowerCase() === 'sup';
	}

	stripMarkerAndWrap(el: any): any {
		const contentDiv = el.ownerDocument.createElement('div');
		const clone = el.cloneNode(true) as any;
		const marker = clone.firstElementChild;
		if (marker) {
			if (this.isBoldWrappedSup(marker)) {
				marker.firstElementChild.remove();
				this.trimLeadingWhitespace(marker);
			} else {
				marker.remove();
				this.trimLeadingWhitespace(clone);
			}
		}
		contentDiv.appendChild(clone);
		return contentDiv;
	}

	parseFootnoteNum(el: any): number | null {
		// Marker must be the very first child (no preceding text node)
		if (!el.firstChild) return null;
		let first = el.firstElementChild;
		if (!first || first !== el.firstChild) return null;
		let tag = first.tagName.toLowerCase();
		if (this.isBoldWrappedSup(first)) {
			first = first.firstElementChild;
			tag = 'sup';
		}
		if (tag !== 'sup' && tag !== 'strong') return null;
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

		// Strategy 3: catches footnotes followed by non-footnote trailing content,
		// or footnotes in a different container than the last <p>
		const halfParaIdx = Math.floor(allPs.length / 2);
		const scattered: Array<{num: number; el: any}> = [];
		for (let i = halfParaIdx; i < allPs.length; i++) {
			const num = this.parseFootnoteNum(allPs[i]);
			if (num !== null) scattered.push({ num, el: allPs[i] });
		}

		if (scattered.length >= 2 && this.crossValidate(element, scattered)) {
			return { paragraphs: scattered, toRemove: scattered.map(p => p.el) };
		}

		return null;
	}

	isBackrefLink(el: any): boolean {
		if (el.tagName?.toLowerCase() !== 'a') return false;
		const text = el.textContent?.trim().replace(/\uFE0E|\uFE0F/g, '') || '';
		if (BACKREF_SYMBOLS_RE.test(text) || !!el.classList?.contains('footnote-backref')) return true;
		// MediaWiki multi-ref backrefs: <a href="#cite_ref-...">3.0</a>
		const href = el.getAttribute('href') || '';
		return CITE_REF_RE.test(href);
	}

	removeBackrefs(el: any): void {
		el.querySelectorAll('a').forEach((a: any) => {
			if (this.isBackrefLink(a)) {
				// Remove the wrapping <sup> if it only contained this link
				const parent = a.parentElement;
				if (parent?.tagName?.toLowerCase() === 'sup' && parent.children.length === 1) {
					parent.remove();
				} else {
					a.remove();
				}
			}
		});
		// Trim leading backref text nodes (e.g. bare "^" before numbered multi-ref links)
		while (el.firstChild && el.firstChild.nodeType === 3) {
			const text = el.firstChild.textContent;
			if (text && /^[\s\^,.;]*$/.test(text) && text.includes('^')) {
				el.firstChild.remove();
			} else {
				break;
			}
		}
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

	// Extract the footnote id and content element from a generic <li>/<div role=listitem>.
	// Handles Science .citations, Arxiv bib.bib*, fn:*, fn*, Nature data-counter, MediaWiki cite_note.
	private extractListItemIdAndContent(li: any): { id: string; content: any } {
		const citationsDiv = li.querySelector('.citations');
		if (citationsDiv?.id?.toLowerCase().startsWith('r')) {
			return {
				id: citationsDiv.id.toLowerCase(),
				content: citationsDiv.querySelector('.citation-content') || null,
			};
		}

		const rawId = (li.id || '').toLowerCase();
		// Order matters: `fn:` must precede `fn`, else `fn:3` would strip to `:3`.
		for (const prefix of ['bib.bib', 'fn:', 'fn']) {
			if (rawId.startsWith(prefix)) return { id: rawId.slice(prefix.length), content: li };
		}
		if (li.hasAttribute('data-counter')) {
			const id = (li.getAttribute('data-counter') || '').replace(/\.$/, '').toLowerCase();
			return { id, content: li };
		}
		const match = rawId.split('/').pop()?.match(/cite_note-(.+)/);
		return { id: match ? match[1] : rawId, content: li };
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

		if (containers.length === 0) {
			// Org Mode CSS sidenotes: label.footref + input.footref-toggle + span.sidenote
			const footrefs = element.querySelectorAll('label.footref');
			if (footrefs.length > 0) {
				let footnoteCount = 1;
				footrefs.forEach((label: any) => {
					// Find the sidenote that follows this label (possibly with input in between)
					let sibling = label.nextElementSibling;
					if (sibling?.tagName === 'INPUT' && sibling.classList?.contains('footref-toggle')) {
						sibling = sibling.nextElementSibling;
					}
					if (!sibling || sibling.tagName !== 'SPAN' || !sibling.classList?.contains('sidenote')) return;

					const content = sibling.cloneNode(true);
					// Remove the leading sup number from the sidenote content
					const leadingSup = content.querySelector('sup');
					if (leadingSup && content.firstChild === leadingSup) {
						leadingSup.remove();
					}

					footnotes[footnoteCount] = {
						content: content,
						originalId: String(footnoteCount),
						refs: [`fnref:${footnoteCount}`]
					};

					// Replace label + input + sidenote with a footnote reference
					const ref = this.createFootnoteReference(String(footnoteCount), `fnref:${footnoteCount}`);
					const inputEl = label.nextElementSibling;
					if (inputEl?.tagName === 'INPUT' && inputEl.classList?.contains('footref-toggle')) {
						inputEl.remove();
					}
					sibling.remove();
					label.replaceWith(ref);

					footnoteCount++;
				});

				// Remove the footer that duplicates these sidenotes (Org Mode footdef list)
				element.querySelectorAll('footer').forEach((footer: any) => {
					if (footer.querySelector('.footdef')) {
						footer.remove();
					}
				});

				return footnotes;
			}

			// Remove standalone sidenotes that duplicate the formal footnote list
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

			// Arxiv — multi-citation groups (e.g. [35, 2, 5]) are handled specially because
			// one element can expand into several refs.
			if (el.matches('cite.ltx_cite')) {
				const refs: any[] = [];
				el.querySelectorAll('a').forEach((link: any) => {
					const href = link.getAttribute('href');
					if (!href) return;
					const match = href.split('/').pop()?.match(/bib\.bib(\d+)/);
					if (!match) return;
					const entry = footnotesByOriginalId.get(match[1].toLowerCase());
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
						if (i > 0) fragment.appendChild(el.ownerDocument.createTextNode(' '));
						fragment.appendChild(ref);
					});
					container.replaceWith(fragment);
				}
				return;
			}

			let footnoteId = '';
			for (const { selector, extract } of INLINE_REF_EXTRACTORS) {
				if (el.matches(selector)) {
					footnoteId = extract(el);
					break;
				}
			}
			if (!footnoteId) {
				// Fallback: use the href fragment when no selector matched.
				const href = el.getAttribute('href');
				if (href) footnoteId = href.replace(/^[#]/, '').toLowerCase();
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
				this.pendingRemovals.some((g: any) => g.contains(el));

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
				const fragment = getHrefFragment(link);
				if (!fragment) return;
				const entry = footnoteIdMap.get(fragment);
				if (!entry) return;
				const text = link.textContent?.trim() || '';
				if (!FOOTNOTE_MARKER_RE.test(text)) return;
				assignRef(link, entry);
			});

			// Pass 2: Match sup/span elements with numeric text
			const hasUnmatched = Object.values(footnotes).some(d => d.refs.length === 0);
			if (hasUnmatched) {
				element.querySelectorAll('sup, span.footnote-ref').forEach((el: any) => {
					if (!el.parentNode || el.id?.startsWith('fnref:') || el.closest('#footnotes')) return;
					const match = (el.textContent?.trim() || '').match(FOOTNOTE_MARKER_RE);
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
		this.pendingRemovals.forEach((el: any) => { if (el.parentNode) el.remove(); });

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