import { BLOCK_LEVEL_ELEMENTS, FOOTNOTE_LIST_SELECTORS } from '../constants';
import { DebugRemoval } from '../types';
import { countWords, textPreview, logDebug, CJK_CHAR_RANGES } from '../utils';
import { getClassName } from '../utils/dom';

/**
 * Link clutter removal.
 *
 * The selected main content is often a wide wrapper (<main>, a page-level
 * <article>, a layout <div>) that holds the article body next to rails of
 * linked headlines, "more from" blocks and author link cards. This step finds
 * the element that holds the densest run of prose (the "anchor") and removes
 * blocks beside the path from the anchor up to the main content, but only
 * when every check proves they are link lists. It never crops the selection.
 */

// Anchor scoring
const ANCHOR_MIN_SCORE = 1600;
const MIN_TEXT_LENGTH = 20;
const MAX_TEXT_DEPTH = 3;
const SCORE_EXPONENT = 1.25;
const DEPTH_DECAY = 0.1;
const CJK_SAMPLE_NODES = 3;
const CJK_SAMPLE_CHARS = 12;
const CJK_MULTIPLIER = 3;
const CJK_MIN_SHARE = 0.5;

// Class multiplier contributions
const ARTICLE_TAG_WEIGHT = 0.5;
const BODY_NAME_WEIGHT = 0.5;
const BOILERPLATE_NAME_PENALTY = 0.75;
const SLIDER_NAME_PENALTY = 0.75;

// Block proof
const MIN_LINK_SHARE = 0.75;
const PROSE_RUN_WORDS = 20;
const PROSE_RUN_MAX_LINK_SHARE = 0.3;
const SMALL_MEDIA_WORDS = 15;
const TITLE_BLOCK_WORDS = 40;

// Page guards
const MIN_ANCHOR_SHARE = 0.2;
const WORD_FLOOR = 120;
const CHUNK_MIN_WORDS = 10;

// Subtrees whose text never counts as prose
const SKIP_SUBTREE = new Set([
	'script', 'style', 'noscript', 'template', 'head', 'title',
	'svg', 'math', 'pre', 'select', 'textarea', 'iframe', 'object', 'embed', 'canvas'
]);

// Elements that cannot be the home of flowing prose
const NOT_A_CANDIDATE = new Set([
	'html', 'a', 'ul', 'ol', 'form', 'option', 'optgroup', 'datalist', 'button', 'input', 'frameset', 'frame'
]);

// Text directly inside these elements is navigation, data or code, not prose
const EXCLUDED_TEXT_PARENTS = new Set([
	'a', 'ul', 'ol', 'li', 'td', 'th', 'dt', 'dd', 'pre', 'option', 'button', 'label'
]);

// Wrappers that normally carry prose; text may be credited through them
const PROSE_WRAPPERS = new Set([
	'p', 'div', 'blockquote', 'q',
	'span', 'em', 'strong', 'b', 'i', 'u', 's', 'small', 'big', 'mark', 'font',
	'sub', 'sup', 'abbr', 'cite', 'dfn', 'time', 'code', 'kbd', 'samp', 'var',
	'del', 'ins', 'bdi', 'bdo'
]);

const QUOTATIONS = new Set(['blockquote', 'q']);

// Elements whose boundaries separate words when collecting block text
const SEPARATED_ELEMENTS = new Set([
	...BLOCK_LEVEL_ELEMENTS,
	'center', 'menu', 'caption', 'hgroup', 'dialog', 'legend', 'search'
]);

const NON_RENDERED = new Set(['script', 'style', 'noscript', 'template', 'head', 'title']);

// Blocks that may be removed as a whole
const REMOVABLE_CONTAINERS = new Set([
	'div', 'section', 'aside', 'nav', 'header', 'footer',
	'ul', 'ol', 'dl', 'menu',
	'table', 'thead', 'tbody', 'tfoot', 'tr', 'td', 'th',
	'center', 'form'
]);

// Class/id names for an article body (whole token match)
const BODY_CLASS_PATTERN = /^(?:(?:(?:article|story|post|entry|blog|news|content|main)[-_]?(?:body|content|text|copy)|body[-_]?(?:text|copy)|rich[-_]?text|prose|markdown[-_]body|instapaper[-_]body)(?:[-_][a-z0-9]+)?|article|content|entry|post|story)$/i;

// Class/id names for comments, discussion, footers and page metadata (substring match)
const BOILERPLATE_CLASS_PATTERN = /comment(?!ary)|discuss|disqus|repl(?:y|ies)|respond|footer|colophon|byline|metadata|(?:^|[-_\s])meta(?:$|[-_\s])/i;

// Class/id names for rotating widgets (substring match)
const SLIDER_CLASS_PATTERN = /slider|carousel|slideshow|swiper|rotator|ticker/i;

const INTRO_NAME_PATTERN = /(?:^|[-_\s])(?:intro|introduction|lede|lead|standfirst|dek|summary|teaser)(?:$|[-_\s])/i;
const BODY_NAME_PATTERN = /(?:^|[-_\s])(?:body|content|text)(?:$|[-_\s])/i;

const BODY_CONTAINER_SELECTOR = 'main, [role="main"], article, body, [itemprop~="articleBody"], .entry-content';

const NOTES_SELECTOR = [
	FOOTNOTE_LIST_SELECTORS,
	'[role="doc-endnotes"]',
	'[role="doc-footnotes"]',
	'[role="doc-bibliography"]'
].join(',');
const MEDIA_SELECTOR = 'img, picture, video, audio, iframe, frame, embed, object, figure';
// Figures, pictures and media embeds are kept at any size
const PROTECTED_SELECTOR = 'th, pre, figure, picture, video, audio, iframe, embed, object';
const HEADING_SELECTOR = 'h1, h2, h3, h4, h5, h6';

// Prompts that tell the reader the article continues elsewhere or is gated
const TRUNCATION_PATTERN = /\b(?:continue|keep) reading\b|\bread (?:the )?(?:full|rest of the|whole|entire) (?:article|story|post)\b|\bread more\b|\b(?:log|sign) ?in to (?:read|continue|view|access|keep reading|unlock)\b|\bsubscribe (?:now )?to (?:read|continue|unlock|access|keep reading)\b|\bsubscribers? only\b|\bfor subscribers\b|\balready (?:a )?(?:subscriber|member)\b|\bthis (?:article|story|content) is (?:only )?(?:available|reserved|exclusive)\b|\bunlock (?:this|the full) (?:article|story)\b/i;

const CJK_CHAR_PATTERN = new RegExp(`[${CJK_CHAR_RANGES}]`);

function tagOf(el: Element): string {
	return el.tagName.toLowerCase();
}

interface ScriptSample {
	nodes: number;
	cjk: number;
	total: number;
}

/**
 * Find the element that holds the densest run of prose in the document.
 * Must run on the working copy before any removals. Returns null when no
 * element reaches the minimum score.
 */
export function findLinkClutterAnchor(doc: Document): Element | null {
	const body = doc.body;
	if (!body) return null;

	const raw = new Map<Element, number>();
	const samples = new Map<Element, ScriptSample>();
	const weights = new Map<Element, number>();
	const majorityTokens = new Map<Element, Set<string> | null>();

	const credit = (el: Element, length: number, depth: number, sample: { cjk: number; total: number }) => {
		const factor = 1 - DEPTH_DECAY * depth;
		if (factor <= 0 || NOT_A_CANDIDATE.has(tagOf(el))) return;
		raw.set(el, (raw.get(el) || 0) + Math.pow(length * factor, SCORE_EXPONENT));
		let s = samples.get(el);
		if (!s) {
			s = { nodes: 0, cjk: 0, total: 0 };
			samples.set(el, s);
		}
		if (s.nodes < CJK_SAMPLE_NODES) {
			s.nodes++;
			s.cjk += sample.cjk;
			s.total += sample.total;
		}
	};

	// Children of el's parent share a class token with more than half of
	// their siblings (a body split into identical paragraph wrappers).
	const isRepeatedChild = (el: Element): boolean => {
		const parent = el.parentElement;
		if (!parent) return false;
		let tokens = majorityTokens.get(parent);
		if (tokens === undefined) {
			tokens = null;
			const children = parent.children;
			if (children.length >= 2) {
				const counts = new Map<string, number>();
				for (let i = 0; i < children.length; i++) {
					const seen = new Set(getClassName(children[i]).split(/\s+/).filter(Boolean));
					seen.forEach(token => counts.set(token, (counts.get(token) || 0) + 1));
				}
				counts.forEach((count, token) => {
					if (count >= 2 && count * 2 > children.length) {
						(tokens ??= new Set()).add(token);
					}
				});
			}
			majorityTokens.set(parent, tokens);
		}
		if (!tokens) return false;
		return getClassName(el).split(/\s+/).some(token => tokens!.has(token));
	};

	const processText = (text: Text) => {
		const parent = text.parentNode as Element | null;
		if (!parent || parent.nodeType !== 1 || EXCLUDED_TEXT_PARENTS.has(tagOf(parent))) return;
		const trimmed = text.data.trim();
		if (trimmed.length < MIN_TEXT_LENGTH) return;

		const head = trimmed.slice(0, CJK_SAMPLE_CHARS).replace(/\s+/g, '');
		let cjk = 0;
		for (const ch of head) {
			if (CJK_CHAR_PATTERN.test(ch)) cjk++;
		}
		const sample = { cjk, total: head.length };

		// Credit the parent and up to three ancestors; above the first level
		// the path must pass only through prose wrappers.
		let el: Element | null = parent;
		let depth = 0;
		let last: Element = parent;
		let lastDepth = 0;
		while (el && depth <= MAX_TEXT_DEPTH && tagOf(el) !== 'html') {
			credit(el, trimmed.length, depth, sample);
			last = el;
			lastDepth = depth;
			if (depth >= 1 && !PROSE_WRAPPERS.has(tagOf(el))) break;
			el = el.parentElement;
			depth++;
		}

		// Quotations and repeated wrappers also credit their parent, so a
		// pull quote never beats the body around it. The parent was not
		// reached by the walk above, so nothing is counted twice.
		if (QUOTATIONS.has(tagOf(last)) || isRepeatedChild(last)) {
			const up = last.parentElement;
			if (up && tagOf(up) !== 'html') {
				credit(up, trimmed.length, lastDepth + 1, sample);
			}
		}
	};

	// Single traversal in document order
	const stack: Node[] = [body];
	while (stack.length) {
		const node = stack.pop()!;
		if (node.nodeType === 3) {
			processText(node as Text);
			continue;
		}
		for (let child = node.lastChild; child; child = child.previousSibling) {
			if (child.nodeType === 3) {
				stack.push(child);
			} else if (child.nodeType === 1) {
				const el = child as Element;
				if (SKIP_SUBTREE.has(tagOf(el)) || el.hasAttribute('hidden')) continue;
				stack.push(el);
			}
		}
	}

	// Class multiplier, inherited from the parent's value
	const weightOf = (el: Element): number => {
		const chain: Element[] = [];
		let cur: Element | null = el;
		while (cur && !weights.has(cur)) {
			chain.push(cur);
			cur = cur.parentElement;
		}
		let acc = cur ? weights.get(cur)! : 0;
		for (let i = chain.length - 1; i >= 0; i--) {
			acc += ownClassWeight(chain[i]);
			weights.set(chain[i], acc);
		}
		return acc;
	};

	const finalScore = (el: Element): number => {
		const base = raw.get(el);
		if (!base) return 0;
		const multiplier = Math.max(0, 1 + weightOf(el));
		const s = samples.get(el);
		const script = s && s.total > 0 && s.cjk >= s.total * CJK_MIN_SHARE ? CJK_MULTIPLIER : 1;
		return base * multiplier * script;
	};

	let winner: Element | null = null;
	let best = 0;
	for (const el of raw.keys()) {
		const score = finalScore(el);
		if (score > best || (score === best && winner !== null && score > 0 && isDeeper(el, winner))) {
			best = score;
			winner = el;
		}
	}

	if (!winner || best < ANCHOR_MIN_SCORE) return null;

	let anchor: Element = winner;
	const quote = anchor.closest('blockquote, q');
	if (quote && quote.parentElement) {
		anchor = quote.parentElement;
	}

	return widenAnchor(anchor, finalScore);
}

function ownClassWeight(el: Element): number {
	let weight = 0;
	for (const value of [el.getAttribute('id') || '', getClassName(el)]) {
		if (!value.trim()) continue;
		if (value.split(/\s+/).some(token => BODY_CLASS_PATTERN.test(token))) weight += BODY_NAME_WEIGHT;
		if (BOILERPLATE_CLASS_PATTERN.test(value)) weight -= BOILERPLATE_NAME_PENALTY;
		if (SLIDER_CLASS_PATTERN.test(value)) weight -= SLIDER_NAME_PENALTY;
	}
	if (tagOf(el) === 'article') weight += ARTICLE_TAG_WEIGHT;
	return weight;
}

function depthOf(el: Element): number {
	let depth = 0;
	for (let cur = el.parentElement; cur; cur = cur.parentElement) depth++;
	return depth;
}

function isDeeper(a: Element, b: Element): boolean {
	if (b.contains(a)) return true;
	if (a.contains(b)) return false;
	return depthOf(a) > depthOf(b);
}

function nameOf(el: Element): string {
	return `${el.getAttribute('id') || ''} ${getClassName(el)}`;
}

/**
 * Widen the winner to the element that holds the whole body when the page
 * split the body into parts. The first rule that applies wins.
 */
function widenAnchor(winner: Element, score: (el: Element) => number): Element {
	// 1. Explicit read-later body marker
	const marked = winner.closest('.instapaper_body');
	if (marked) return marked;

	// 2. Header block of an article
	const header = winner.closest('header');
	if (header && header.parentElement && tagOf(header.parentElement) === 'article') {
		return header.parentElement;
	}

	// 3. Body directly after a hero figure inside an article
	const article = winner.closest('article');
	const prev = winner.previousElementSibling;
	if (article && prev && tagOf(prev) === 'figure') {
		return article;
	}

	// 4. Sectioned body inside a body container. The search stops at an
	// article: an article is a whole piece, never one part of a sectioned body.
	const section = winner.closest('section');
	const sectionParent = section?.parentElement;
	const outsideArticle = !!section && !(article && section.contains(article));
	if (section && outsideArticle && sectionParent && sectionParent.matches(BODY_CONTAINER_SELECTOR)) {
		const hasPeers = Array.from(sectionParent.children).some(child =>
			child !== section && (tagOf(child) === 'section' || tagOf(child) === 'header')
		);
		if (hasPeers) return sectionParent;
	}

	// 5. Intro plus body
	const parent = winner.parentElement;
	if (parent) {
		const ownName = nameOf(winner);
		for (const sibling of [winner.previousElementSibling, winner.nextElementSibling]) {
			if (!sibling) continue;
			const siblingName = nameOf(sibling);
			if ((INTRO_NAME_PATTERN.test(ownName) && BODY_NAME_PATTERN.test(siblingName)) ||
				(BODY_NAME_PATTERN.test(ownName) && INTRO_NAME_PATTERN.test(siblingName))) {
				return parent;
			}
		}
	}

	// 6. Body split into chunks with the same tag and class
	let chunk: Element | null = winner;
	if (tagOf(chunk) === 'p' && !getClassName(chunk).trim()) {
		chunk = chunk.parentElement;
	}
	if (chunk && !chunk.getAttribute('id') && getClassName(chunk).trim() && chunk.parentElement) {
		const className = getClassName(chunk);
		const chunkParent: Element = chunk.parentElement;
		const peer = Array.from(chunkParent.children).some(child =>
			child !== chunk &&
			child.tagName === chunk!.tagName &&
			getClassName(child) === className &&
			score(child) >= ANCHOR_MIN_SCORE
		);
		if (peer) return chunkParent;
	}

	return winner;
}

export interface BlockWordCounts {
	words: number;
	linkedWords: number;
}

interface BlockAnalysis extends BlockWordCounts {
	text: string;
	hasProseRun: boolean;
}

/**
 * Collect the text of a block with a separator at every block boundary and
 * line break, so minified and formatted markup count the same. Linked words
 * come from outermost links only. Optionally checks whether the block or any
 * block descendant holds a run of its own mostly unlinked prose.
 */
function analyzeBlock(root: Element, checkProse: boolean): BlockAnalysis {
	const all: string[] = [];
	const linked: string[] = [];
	let hasProseRun = false;

	const checkRun = (own: string[], ownLinked: string[]) => {
		const words = countWords(own.join(''));
		if (words < PROSE_RUN_WORDS) return;
		if (countWords(ownLinked.join('')) < words * PROSE_RUN_MAX_LINK_SHARE) {
			hasProseRun = true;
		}
	};

	const separate = (inLink: boolean, own: string[] | null, ownLinked: string[] | null) => {
		all.push(' ');
		if (inLink) linked.push(' ');
		if (own) {
			own.push(' ');
			if (inLink) ownLinked!.push(' ');
		}
	};

	const visit = (el: Element, own: string[] | null, ownLinked: string[] | null, inLink: boolean) => {
		for (let node = el.firstChild; node; node = node.nextSibling) {
			if (node.nodeType === 3) {
				const data = (node as Text).data;
				all.push(data);
				if (inLink) linked.push(data);
				if (own) {
					own.push(data);
					if (inLink) ownLinked!.push(data);
				}
				continue;
			}
			if (node.nodeType !== 1) continue;
			const child = node as Element;
			const tag = tagOf(child);
			if (NON_RENDERED.has(tag)) continue;
			if (tag === 'br') {
				separate(inLink, own, ownLinked);
				continue;
			}
			const startsLink = tag === 'a' && !inLink;
			if (SEPARATED_ELEMENTS.has(tag)) {
				separate(inLink, own, ownLinked);
				if (checkProse && !hasProseRun) {
					const childOwn: string[] = [];
					const childLinked: string[] = [];
					visit(child, childOwn, childLinked, inLink || startsLink);
					checkRun(childOwn, childLinked);
				} else {
					visit(child, null, null, inLink || startsLink);
				}
				separate(inLink, null, null);
			} else {
				visit(child, own, ownLinked, inLink || startsLink);
			}
			if (startsLink) {
				linked.push(' ');
				if (ownLinked) ownLinked.push(' ');
			}
		}
	};

	if (checkProse) {
		const own: string[] = [];
		const ownLinked: string[] = [];
		visit(root, own, ownLinked, false);
		checkRun(own, ownLinked);
	} else {
		visit(root, null, null, false);
	}

	const text = all.join('');
	const words = countWords(text);
	const linkedWords = Math.min(words, countWords(linked.join('')));
	return { words, linkedWords, text, hasProseRun };
}

/** Word and linked-word counts of a block, using block separators. */
export function countBlockWords(el: Element): BlockWordCounts {
	const { words, linkedWords } = analyzeBlock(el, false);
	return { words, linkedWords };
}

function isOrHas(el: Element, selector: string): boolean {
	return el.matches(selector) || el.querySelector(selector) !== null;
}

/**
 * Widen the anchor to cover chunks of the same body that ad slots split
 * apart: elements with the same tag, class (ignoring digits) and depth.
 */
function widenToChunks(anchor: Element, mainContent: Element, wordsOf: (el: Element) => number): Element {
	const className = getClassName(anchor).trim();
	if (!className) return anchor;
	const normalize = (value: string) => value.replace(/\d+/g, '').replace(/\s+/g, ' ').trim();
	const key = normalize(className);
	const depth = depthOf(anchor);
	const peers = Array.from(mainContent.getElementsByTagName(anchor.tagName)).filter(el =>
		el !== anchor &&
		normalize(getClassName(el)) === key &&
		!el.contains(anchor) &&
		!anchor.contains(el) &&
		depthOf(el) === depth &&
		wordsOf(el) >= CHUNK_MIN_WORDS
	);
	if (peers.length === 0) return anchor;
	let common: Element | null = anchor;
	for (const peer of peers) {
		while (common && !common.contains(peer)) common = common.parentElement;
	}
	return common || anchor;
}

export interface LinkClutterResult {
	removed: number;
	/** Page-level guard that stopped the step, if any */
	skipped?: string;
}

interface Candidate {
	element: Element;
	words: number;
	linkedWords: number;
	level: number;
}

/**
 * Remove link-dominated blocks beside the path from the anchor up to the main
 * content. All blocks are judged against the unmodified tree, page-level
 * guards are applied, and only then are proven blocks detached.
 */
export function removeLinkClutter(
	mainContent: Element,
	anchor: Element | null,
	debug: boolean = false,
	debugRemovals?: DebugRemoval[]
): LinkClutterResult {
	const skip = (reason: string): LinkClutterResult => {
		logDebug(debug, 'Link clutter removal skipped:', reason);
		return { removed: 0, skipped: reason };
	};

	if (!anchor) return skip('no anchor');
	if (anchor === mainContent || !mainContent.contains(anchor)) {
		return skip('anchor outside selection');
	}

	const counts = new Map<Element, number>();
	const wordsOf = (el: Element): number => {
		let words = counts.get(el);
		if (words === undefined) {
			words = analyzeBlock(el, false).words;
			counts.set(el, words);
		}
		return words;
	};

	anchor = widenToChunks(anchor, mainContent, wordsOf);
	if (anchor === mainContent || !mainContent.contains(anchor)) {
		return skip('anchor outside selection');
	}

	const anchorWords = wordsOf(anchor);
	if (anchorWords === 0) return skip('anchor has no words');
	const selectionWords = wordsOf(mainContent);
	if (anchorWords < selectionWords * MIN_ANCHOR_SHARE) {
		return skip(`anchor share below ${Math.round(MIN_ANCHOR_SHARE * 100)}%`);
	}

	const proven: Candidate[] = [];
	let node: Element = anchor;
	let level = 0;
	while (node !== mainContent) {
		const parent: Element | null = node.parentElement;
		if (!parent) break;
		level++;
		let before = true;
		const siblings = Array.from(parent.children);
		for (const sibling of siblings) {
			if (sibling === node) {
				before = false;
				continue;
			}
			const candidate = proveLinkClutter(sibling, before, level);
			if (candidate) proven.push(candidate);
		}
		node = parent;
	}

	if (proven.length === 0) return skip('nothing proven');

	const provenWords = proven.reduce((sum, c) => sum + c.words, 0);
	if (selectionWords - provenWords < WORD_FLOOR) {
		return skip(`under ${WORD_FLOOR}-word floor`);
	}

	for (const candidate of proven) {
		if (debug && debugRemovals) {
			const share = Math.round(candidate.linkedWords / candidate.words * 100);
			debugRemovals.push({
				step: 'removeLinkClutter',
				reason: `link share ${share}%, ${candidate.words} words, ${candidate.level} level${candidate.level === 1 ? '' : 's'} above anchor`,
				text: textPreview(candidate.element)
			});
		}
		candidate.element.remove();
	}

	logDebug(debug, 'Removed link clutter blocks:', proven.length);
	return { removed: proven.length };
}

/**
 * Returns the block's counts if every condition proves it is link clutter
 * and no guard keeps it, otherwise null.
 */
function proveLinkClutter(el: Element, before: boolean, level: number): Candidate | null {
	// Block container only; never paragraphs, headings, figures or inline elements
	if (!REMOVABLE_CONTAINERS.has(tagOf(el))) return null;
	// Site-specific extractor output is never examined
	if (el.closest('[data-defuddle]')) return null;

	const block = analyzeBlock(el, true);
	// Has words
	if (block.words === 0) return null;
	// Link-dominated
	if (block.linkedWords < block.words * MIN_LINK_SHARE) return null;
	// No prose run
	if (block.hasProseRun) return null;

	// Guards: the block itself and all its descendants
	if (isOrHas(el, NOTES_SELECTOR)) return null;
	if (isOrHas(el, 'figcaption')) return null;
	if (isOrHas(el, PROTECTED_SELECTOR)) return null;
	if (block.words < SMALL_MEDIA_WORDS && isOrHas(el, MEDIA_SELECTOR)) return null;
	if (TRUNCATION_PATTERN.test(block.text)) return null;
	if (before && block.words < TITLE_BLOCK_WORDS && isOrHas(el, HEADING_SELECTOR)) return null;

	return { element: el, words: block.words, linkedWords: block.linkedWords, level };
}
