import { BaseExtractor, ExtractorOptions } from './_base';
import { ExtractorResult } from '../types/extractors';
import { escapeHtml } from '../utils/dom';
import { buildCommentTree, type CommentData } from '../utils/comments';
import { createMarkdownContent } from '../markdown';

const INITIAL_STATE_KEY = 'window.__INITIAL_STATE__';


type XhsImageItem = {
	infoList?: { url?: string; width?: number; height?: number }[];
	urlDefault?: string;
	url?: string;
	width?: number;
	height?: number;
};

type XhsTagItem = {
	name?: string;
	id?: string;
};

type XhsCommentItem = {
	user?: { nickname?: string; userId?: string };
	content?: string;
	createdAt?: number;
	subCommentList?: XhsCommentItem[];
	id?: string;
	likeCount?: number;
};

type XhsNoteData = {
	noteId?: string;
	type?: string;
	title?: string;
	desc?: string;
	time?: number;
	lastUpdateTime?: number;
	imageList?: XhsImageItem[];
	tagList?: XhsTagItem[];
	topicList?: XhsTagItem[];
	interactInfo?: { commentCount?: string };
	user?: { nickname?: string; userId?: string };
	video?:
	| {
		media?: {
			stream?: {
				h264?: { masterUrl?: string; backupUrl?: string; master_url?: string; backup_url?: string }[];
				h265?: { masterUrl?: string; master_url?: string }[];
			};
		};
	}
	| undefined;
	commentList?: XhsCommentItem[];
	comments?: XhsCommentItem[];
};

type XhsInitialState = {
	note?: { noteDetailMap?: { [key: string]: { note?: XhsNoteData } } };
	user?: { nickname?: string; userId?: string };
	comments?: XhsCommentItem[];
	// Some XHS builds nest comments under a `comment` module.
	comment?: { commentList?: XhsCommentItem[]; comments?: XhsCommentItem[] };
	firstNoteId?: string;
};

export class XiaohongshuExtractor extends BaseExtractor {
	private _stateCache: XhsInitialState | null | undefined = undefined;
	private _noteCache: XhsNoteData | null | undefined = undefined;

	canExtract(): boolean {
		// Avoid false positives on non-note pages that still define __INITIAL_STATE__.
		return !!this.getNoteData();
	}

	canExtractAsync(): boolean {
		return this.canExtract();
	}

	prefersAsync(): boolean {
		return this.isVideoNote() || this.options.includeReplies !== false;
	}

	extract(): ExtractorResult {
		return this.buildResult();
	}

	async extractAsync(): Promise<ExtractorResult> {
		const note = this.getNoteData();
		const state = this.parseInitialState();
		const includeComments = this.options.includeReplies !== false;

		let comments = '';
		if (includeComments) {
			comments = this.rawCommentsToHtml(this.findRawComments(note, state));

			if (!comments) {
				const noteId = this.getNoteId();
				if (noteId) {
					const fetched = await this.fetchCommentsFromApi(noteId);
					if (fetched && fetched.length > 0) {
						comments = this.rawCommentsToHtml(fetched);
					}
				}
			}

			// Final fallback: extract from rendered DOM (works in browser extension
			// where the live document has Vue-rendered comments)
			if (!comments) {
				comments = this.extractCommentsFromDom();
			}
		}

		return this.buildResultWithComments(note, state, comments, includeComments);
	}

	// ---- Inline JSON parsing (string-aware brace counter) ----

	private parseInitialState(): XhsInitialState | null {
		if (this._stateCache !== undefined) return this._stateCache;

		const scripts = Array.from(this.document.querySelectorAll('script'));
		for (const script of scripts) {
			const text = script.textContent || '';
			if (!text.includes('__INITIAL_STATE__')) continue;

			const assignIndex = text.indexOf(INITIAL_STATE_KEY);
			if (assignIndex === -1) continue;

			const startIndex = text.indexOf('{', assignIndex);
			if (startIndex === -1) continue;

			const jsonText = this.extractJsonObject(text, startIndex);
			if (jsonText) {
				try {
					const normalized = this.normalizeJsonLike(jsonText);
					const parsed = JSON.parse(normalized) as XhsInitialState;
					this._stateCache = parsed;
					return parsed;
				} catch {
					// ignore parse errors, try next script
				}
			}
		}

		this._stateCache = null;
		return null;
	}

	/**
	 * Extract a balanced JSON object string starting at `startIndex`.
	 * Unlike a naive brace counter, this skips braces inside quoted strings
	 * and handles escaped characters, so `{"a":"{val}"}` is parsed correctly.
	 */
	private extractJsonObject(text: string, startIndex: number): string | null {
		let depth = 0;
		let inString = false;
		let i = startIndex;

		while (i < text.length) {
			const char = text[i];

			if (inString) {
				if (char === '\\') {
					i += 2; // skip escaped char
					continue;
				}
				if (char === '"') {
					inString = false;
				}
				i += 1;
				continue;
			}

			if (char === '"') {
				inString = true;
				i += 1;
				continue;
			}

			if (char === '{') {
				depth += 1;
			} else if (char === '}') {
				depth -= 1;
				if (depth === 0) {
					return text.slice(startIndex, i + 1);
				}
			}

			i += 1;
		}

		return null;
	}

	/**
	 * Normalize JSON-like object literals into valid JSON.
	 * XHS __INITIAL_STATE__ may contain bare tokens like `undefined`, `NaN`,
	 * or `Infinity` which are valid in JS but invalid in JSON.
	 *
	 * This function performs a string-aware scan and replaces those tokens
	 * outside quoted strings with `null`.
	 */
	private normalizeJsonLike(text: string): string {
		let out = '';
		let inString = false;
		let stringQuote: '"' | "'" | null = null;
		let i = 0;

		const isIdentChar = (ch: string | undefined): boolean => {
			if (!ch) return false;
			return /[A-Za-z0-9_$]/.test(ch);
		};

		while (i < text.length) {
			const ch = text[i];

			if (inString) {
				out += ch;
				if (ch === '\\') {
					// Copy escaped char too
					if (i + 1 < text.length) {
						out += text[i + 1];
						i += 2;
						continue;
					}
				}
				if (stringQuote && ch === stringQuote) {
					inString = false;
					stringQuote = null;
				}
				i += 1;
				continue;
			}

			if (ch === '"' || ch === "'") {
				inString = true;
				stringQuote = ch as '"' | "'";
				out += ch;
				i += 1;
				continue;
			}

			// Replace unsupported bare tokens outside strings.
			// Must be identifier-bounded so we don't touch substrings.
			const prev = i > 0 ? text[i - 1] : undefined;
			if (!isIdentChar(prev)) {
				if (text.startsWith('undefined', i) && !isIdentChar(text[i + 9])) {
					out += 'null';
					i += 9;
					continue;
				}
				if (text.startsWith('NaN', i) && !isIdentChar(text[i + 3])) {
					out += 'null';
					i += 3;
					continue;
				}
				if (text.startsWith('Infinity', i) && !isIdentChar(text[i + 8])) {
					out += 'null';
					i += 8;
					continue;
				}
			}

			out += ch;
			i += 1;
		}

		return out;
	}

	private getNoteData(): XhsNoteData | null {
		if (this._noteCache !== undefined) return this._noteCache;

		const state = this.parseInitialState();
		if (!state) { this._noteCache = null; return null; }

		// XHS noteDetailMap often contains multiple entries (e.g. suggested notes).
		// Prefer the noteId from the current URL when possible.
		const noteMap = state.note?.noteDetailMap;
		if (noteMap) {
			const urlNoteId = this.getNoteIdFromUrl();
			if (urlNoteId && noteMap[urlNoteId]?.note) {
				this._noteCache = noteMap[urlNoteId].note!;
				return this._noteCache;
			}

			// Try to find note via firstNoteId key
			const firstKey = state.firstNoteId || Object.keys(noteMap)[0];
			if (firstKey && noteMap[firstKey]?.note) {
				this._noteCache = noteMap[firstKey].note!;
				return this._noteCache;
			}
			// Fallback: iterate map entries
			for (const key of Object.keys(noteMap)) {
				if (noteMap[key]?.note) {
					this._noteCache = noteMap[key].note!;
					return this._noteCache;
				}
			}
		}

		this._noteCache = null;
		return null;
	}

	private getNoteIdFromUrl(): string {
		try {
			const url = new URL(this.url);
			const match = url.pathname.match(/\/(?:explore|discovery\/item)\/([0-9A-Za-z]+)/);
			if (match) return match[1];
		} catch { /* ignore */ }
		return '';
	}

	private getNoteId(): string {
		// Prefer URL id to avoid selecting a different entry from noteDetailMap.
		const urlId = this.getNoteIdFromUrl();
		if (urlId) return urlId;
		const note = this.getNoteData();
		if (note?.noteId) return note.noteId;
		return '';
	}

	private isVideoNote(): boolean {
		const note = this.getNoteData();
		return note?.type === 'video' || !!note?.video?.media?.stream;
	}

	private toIsoDateFromTimestamp(timestamp: number | undefined): string {
		if (!timestamp || !Number.isFinite(timestamp)) return '';
		// XHS timestamps are usually ms; if it looks like seconds, convert.
		const ms = timestamp < 1_000_000_000_000 ? timestamp * 1000 : timestamp;
		try {
			return new Date(ms).toISOString();
		} catch {
			return '';
		}
	}

	// ---- Content building ----

	private buildResult(): ExtractorResult {
		const note = this.getNoteData();
		const state = this.parseInitialState();
		const includeComments = this.options.includeReplies !== false;
		let comments = includeComments ? this.rawCommentsToHtml(this.findRawComments(note, state)) : '';
		// DOM fallback for sync path (e.g. upstream clipper without MAIN world bridge)
		if (!comments && includeComments) {
			comments = this.extractCommentsFromDom();
		}
		return this.buildResultWithComments(note, state, comments, includeComments);
	}

	private buildResultWithComments(
		note: XhsNoteData | null,
		state: XhsInitialState | null,
		comments: string,
		includeComments: boolean,
	): ExtractorResult {
		const noteId = this.getNoteId();
		const noteType = this.isVideoNote() ? 'video' : 'normal';

		const author = note?.user?.nickname || state?.user?.nickname || '';
		const authorId = note?.user?.userId || state?.user?.userId || '';
		const desc = note?.desc || '';
		const tagNames = this.extractTagNames(note);
		const tags = tagNames.join(',');

		// Tags are extracted separately (variables.tags); keep them out of the
		// rendered content and summary fields to avoid duplication.
		const cleanedDesc = this.removeTagsFromText(desc, tagNames);
		const title = this.removeTagsFromText(
			note?.title || cleanedDesc.slice(0, 50).replace(/\n/g, ' ').trim(),
			tagNames,
		);
		const description = this.removeTagsFromText(cleanedDesc.slice(0, 200).trim(), tagNames);
		const published = this.toIsoDateFromTimestamp(note?.time ?? note?.lastUpdateTime);

		let contentHtml = '';

		// Video embed (iframe) for video notes
		if (noteType === 'video') {
			const videoUrl = this.extractVideoUrl(note);
			if (videoUrl) {
				contentHtml += `<iframe width="560" height="315" src="${escapeHtml(videoUrl)}" title="小红书视频" frameborder="0" allowfullscreen></iframe>\n`;
			}
		}

		// Description text
		if (cleanedDesc) {
			contentHtml += this.formatDescription(cleanedDesc);
		}

		// Images (only for image notes, skip for video)
		if (noteType === 'normal') {
			const imagesHtml = this.extractImages(note);
			if (imagesHtml) {
				contentHtml += '\n' + imagesHtml;
			}
		}

		// By default, include comments in contentHtml.
		// Set options.excludeCommentsFromContent = true to keep them only in variables.
		const excludeCommentsFromContent = (this.options as any).excludeCommentsFromContent === true;
		if (!excludeCommentsFromContent && comments) {
			contentHtml += '\n' + comments;
		}

		const variables: { [key: string]: string } = {
			title,
			author,
			site: '小红书',
			description,
			published,
			noteId,
			noteType,
		};
		if (tags) variables.tags = tags;
		if (includeComments && comments) {
			variables.comments = createMarkdownContent(comments, this.url).trim();
		}

		return {
			content: contentHtml,
			contentHtml: contentHtml,
			extractedContent: {
				noteId,
				noteType,
				...(authorId ? { authorId } : {}),
			},
			variables,
		};
	}

	private async fetchCommentsFromApi(noteId: string): Promise<XhsCommentItem[] | null> {
		const endpoints = [
			`https://edith.xiaohongshu.com/api/sns/web/v2/comment/page?note_id=${encodeURIComponent(noteId)}`,
			`https://edith.xiaohongshu.com/api/sns/web/v1/comment/page?note_id=${encodeURIComponent(noteId)}`,
		];

		for (const url of endpoints) {
			try {
				const resp = await this.fetch(url, {
					credentials: 'include',
					headers: {
						accept: 'application/json, text/plain, */*',
						'x-requested-with': 'XMLHttpRequest',
					},
				});
				if (!resp.ok) continue;

				const data = await resp.json().catch(() => null);
				if (!data || typeof data !== 'object') continue;

				const list = this.extractCommentListFromApiPayload(data);
				if (list && list.length > 0 && this.isCommentLikeArray(list)) {
					return list as XhsCommentItem[];
				}
			} catch {
				// ignore fetch errors, try next endpoint
			}
		}

		return null;
	}

	private extractCommentListFromApiPayload(payload: any): any[] | null {
		const candidates = [
			payload?.data,
			payload?.data?.comments,
			payload?.data?.commentList,
			payload?.data?.list,
			payload?.comments,
			payload?.commentList,
			payload?.list,
		];

		for (const candidate of candidates) {
			const list = this.unwrapArray(candidate);
			if (list) return list;
		}

		return null;
	}

	private formatDescription(desc: string): string {
		const safe = escapeHtml(desc).replace(/\n/g, '<br>');
		return safe ? `<p>${safe}</p>` : '';
	}

	private extractImages(note: XhsNoteData | null): string {
		if (!note?.imageList) return '';
		const parts: string[] = [];
		for (const img of note.imageList) {
			// Prefer highest resolution from infoList, fallback to urlDefault / url
			const url = this.pickImageUrl(img);
			if (url) {
				parts.push(`<img src="${escapeHtml(url)}" alt="" />`);
			}
		}
		return parts.join('\n');
	}

	private pickImageUrl(img: XhsImageItem): string {
		// infoList is sorted by resolution; pick the largest (last entry)
		if (Array.isArray(img.infoList) && img.infoList.length > 0) {
			const largest = img.infoList[img.infoList.length - 1];
			if (largest?.url) return largest.url;
		}
		return img.urlDefault || img.url || '';
	}

	private extractVideoUrl(note: XhsNoteData | null): string {
		const streams = note?.video?.media?.stream;
		if (!streams) return '';

		const pickUrl = (list: any[] | undefined): string => {
			if (!Array.isArray(list) || list.length === 0) return '';
			for (const entry of [list[list.length - 1], list[0]]) {
				for (const key of ['masterUrl', 'master_url', 'backupUrl', 'backup_url']) {
					if (entry?.[key]) return entry[key];
				}
			}
			return '';
		};

		return pickUrl(streams.h264) || pickUrl(streams.h265);
	}

	private extractTagNames(note: XhsNoteData | null): string[] {
		const names: string[] = [];
		if (note?.tagList) {
			for (const tag of note.tagList) {
				if (tag.name) names.push(tag.name);
			}
		}
		if (note?.topicList) {
			for (const topic of note.topicList) {
				if (topic.name && !names.includes(topic.name)) names.push(topic.name);
			}
		}
		return names.map(n => n.trim()).filter(Boolean);
	}

	private escapeRegExp(text: string): string {
		return text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
	}

	/**
	 * Remove hashtag-style tag mentions (e.g. "#春天#", "#春天[话题]#")
	 * from freeform note text when the tag is already extracted via tagList/topicList.
	 */
	private removeTagsFromText(text: string, tagNames: string[]): string {
		if (!text) return '';
		if (!Array.isArray(tagNames) || tagNames.length === 0) return text;

		let out = text;
		const boundary = '(?=$|\\s|[\\u3000\\uFF0C\\u3001\\u3002\\uFF01\\uFF1F\\uFF1B,\\.\\!\\?;:、。，“”‘’()（）\\[\\]<>《》])';

		for (const rawName of tagNames) {
			const name = rawName.trim();
			if (!name) continue;
			const escaped = this.escapeRegExp(name);
			// Common XHS forms: #tag# or #tag[话题]#
			const wrapped = new RegExp(`(?:#|＃)\\s*${escaped}(?:\\[[^\\]]*\\])?\\s*(?:#|＃)`, 'g');
			// Also handle trailing-less form: #tag<boundary>
			const unwrapped = new RegExp(`(?:#|＃)\\s*${escaped}(?:\\[[^\\]]*\\])?${boundary}`, 'g');
			out = out.replace(wrapped, '');
			out = out.replace(unwrapped, '');
		}

		// Clean up spacing introduced by removals.
		out = out
			.replace(/[ \t\u3000]{2,}/g, ' ')
			.replace(/\n{3,}/g, '\n\n')
			.trim();

		return out;
	}

	private rawCommentsToHtml(rawComments: any[]): string {
		if (!rawComments || rawComments.length === 0) return '';
		const commentData: CommentData[] = [];
		this.flattenComments(rawComments, 0, commentData, new Set());
		return buildCommentTree(commentData);
	}

	/**
	 * Extract comments from the rendered DOM as a final fallback.
	 * Works in browser extensions where the live document has Vue-rendered
	 * comments even though __INITIAL_STATE__ in HTML source has empty lists.
	 */
	private extractCommentsFromDom(): string {
		const doc = this.document;

		// Strategy 1: XHS-specific comment container selectors
		// XHS renders comments inside elements with these known class patterns
		const containerSelectors = [
			'.comments-container',
			'.comment-list',
			'.comments-el',
			'[class*="comment-list"]',
			'[class*="commentList"]',
		];

		let container: Element | null = null;
		for (const sel of containerSelectors) {
			container = doc.querySelector(sel);
			if (container) break;
		}

		// Strategy 2: Look for a section heading "评论" and use its parent/sibling.
		// Restrict to small leaf-like elements to avoid scanning the entire DOM.
		if (!container) {
			const candidates = Array.from(doc.querySelectorAll(
				'[class*="comment"] [class*="title"], [class*="comment"] [class*="header"], [class*="comment"] span, [class*="comment"] p'
			));
			for (const el of candidates) {
				const text = el.textContent?.trim() || '';
				if (/^评论\s*\d*$/.test(text) && el.parentElement) {
					container = el.parentElement;
					break;
				}
			}
			// Broader fallback: check elements with "comment" in their class hierarchy
			if (!container) {
				const commentSections = Array.from(doc.querySelectorAll('[class*="comment"]'));
				for (const section of commentSections) {
					// Only check direct children for the heading text
					for (const child of Array.from(section.children)) {
						const text = child.textContent?.trim() || '';
						if (/^评论\s*\d*$/.test(text)) {
							container = section;
							break;
						}
					}
					if (container) break;
				}
			}
		}

		if (!container) return '';

		// Find individual comment items within the container
		const commentSelectors = [
			'.comment-item',
			'.comment-inner',
			'[class*="comment-item"]',
			'[class*="commentItem"]',
			'[class*="comment-inner"]',
		];

		let commentEls: Element[] = [];
		for (const sel of commentSelectors) {
			commentEls = Array.from(container!.querySelectorAll(sel));
			if (commentEls.length > 0) break;
		}

		// If no specific comment items found, try direct children that look like comments
		if (commentEls.length === 0) {
			const children = Array.from(container!.children);
			commentEls = children.filter(child => {
				// Heuristic: comment elements typically contain author + text
				const text = child.textContent?.trim() || '';
				return text.length > 5 && text.length < 2000;
			});
		}

		if (commentEls.length === 0) return '';

		const commentData: CommentData[] = [];

		for (const el of commentEls) {
			const author = this.extractDomAuthor(el);
			const content = this.extractDomCommentText(el);
			if (!content) continue;

			// Try to find sub-comments (replies) within this comment element
			const subContainerSelectors = [
				'.sub-comment-list',
				'.reply-list',
				'[class*="sub-comment"]',
				'[class*="subComment"]',
				'[class*="reply-list"]',
			];

			let subContainer: Element | null = null;
			for (const sel of subContainerSelectors) {
				subContainer = el.querySelector(sel);
				if (subContainer) break;
			}

			commentData.push({
				author: author || '匿名',
				date: '',
				content: content,
				depth: 0,
			});

			// Extract replies at depth 1
			if (subContainer) {
				const replyEls = Array.from(subContainer.children);
				for (const reply of replyEls) {
					const replyAuthor = this.extractDomAuthor(reply);
					const replyContent = this.extractDomCommentText(reply);
					if (!replyContent) continue;
					commentData.push({
						author: replyAuthor || '匿名',
						date: '',
						content: replyContent,
						depth: 1,
					});
				}
			}
		}

		return commentData.length > 0 ? buildCommentTree(commentData) : '';
	}

	/** Extract author name from a DOM comment element */
	private extractDomAuthor(el: Element): string {
		const authorSelectors = [
			'.user-nickname',
			'.author-wrapper .name',
			'.nickname',
			'[class*="user-nickname"]',
			'[class*="author-name"]',
			'[class*="nickname"]',
			'a[href*="/user/profile/"]',
		];
		for (const sel of authorSelectors) {
			const found = el.querySelector(sel);
			if (found?.textContent?.trim()) {
				return found.textContent.trim();
			}
		}
		return '';
	}

	/** Extract comment text content from a DOM comment element */
	private extractDomCommentText(el: Element): string {
		const textSelectors = [
			'.content',
			'.comment-content',
			'.note-text',
			'[class*="comment-content"]',
			'[class*="commentContent"]',
			'[class*="note-text"]',
		];
		for (const sel of textSelectors) {
			const found = el.querySelector(sel);
			if (found?.textContent?.trim()) {
				const safe = escapeHtml(found.textContent.trim()).replace(/\n/g, '<br>');
				return safe ? `<p>${safe}</p>` : '';
			}
		}
		return '';
	}

	private findRawComments(note: XhsNoteData | null, state: XhsInitialState | null): any[] {
		const candidates: any[] = [];
		const pushIfArr = (value: any): void => {
			if (value != null) candidates.push(value);
		};

		const pushModulePaths = (obj: any): void => {
			if (!obj || typeof obj !== 'object') return;
			for (const v of [obj.list, obj.data?.list, obj.commentList, obj.comments]) {
				const arr = this.unwrapArray(v);
				if (arr) candidates.push(arr);
			}
		};

		pushIfArr(note?.commentList);
		pushIfArr(note?.comments);
		pushIfArr(state?.comments);
		pushIfArr(state?.comment?.commentList);
		pushIfArr(state?.comment?.comments);

		const noteId = this.getNoteId();
		const noteMap = (state as any)?.note?.noteDetailMap;
		const entry = noteId && noteMap?.[noteId];
		if (entry) {
			pushIfArr(entry.commentList);
			pushIfArr(entry.comments);
			pushIfArr(entry.comment?.commentList);
			pushIfArr(entry.comment?.comments);
			pushModulePaths(entry.comments);
		}

		if (noteMap && typeof noteMap === 'object') {
			for (const key of Object.keys(noteMap)) {
				const e = noteMap[key];
				if (!e || typeof e !== 'object') continue;
				if (e?.note?.noteId && noteId && e.note.noteId !== noteId) continue;
				pushModulePaths(e.comments);
			}
		}

		for (const c of candidates) {
			if (Array.isArray(c) && c.length > 0 && this.isCommentLikeArray(c)) return c;
		}

		return [];
	}

	private isCommentLikeArray(arr: any[]): boolean {
		return arr.slice(0, 5).some(item => this.isCommentLike(item));
	}

	private isCommentLike(value: any): boolean {
		if (!value || typeof value !== 'object') return false;
		const v: any = value;
		const hasText = !!this.extractText(v.content ?? v.text ?? v.desc ?? v.body ?? v.note);
		const hasUser = !!v.user || !!v.userInfo || !!v.user_info || typeof v.nickname === 'string';
		const hasReplies = Array.isArray(v.subCommentList) || Array.isArray(v.subComments) || Array.isArray(v.replyList);
		const hasTimestamp = this.toNumber(v.createdAt ?? v.createTime ?? v.time ?? v.timestamp) !== undefined;
		return (hasText && hasUser) || (hasText && (hasReplies || hasTimestamp));
	}

	private extractText(value: unknown, depth = 0): string {
		if (value == null || depth > 5) return '';
		if (typeof value === 'string') return value;
		if (typeof value === 'number' && Number.isFinite(value)) return String(value);
		if (Array.isArray(value)) {
			return value.slice(0, 80)
				.map(item => this.extractText(item, depth + 1))
				.filter(Boolean)
				.join('');
		}
		if (typeof value === 'object') {
			const obj = value as any;
			for (const key of ['text', 'content', 'desc', 'value', 'raw']) {
				if (typeof obj[key] === 'string') return obj[key];
			}
			for (const key of ['children', 'nodes', 'segments', 'spans']) {
				if (obj[key] != null) {
					const t = this.extractText(obj[key], depth + 1);
					if (t) return t;
				}
			}
			return '';
		}
		return '';
	}

	private toNumber(value: unknown): number | undefined {
		if (typeof value === 'number' && Number.isFinite(value)) return value;
		if (typeof value === 'string') {
			const n = Number(value);
			if (Number.isFinite(n)) return n;
		}
		return undefined;
	}

	private normalizeComment(raw: any): {
		id?: string;
		author: string;
		createdAt?: number;
		likeCount?: number;
		contentHtml: string;
		replies: any[];
	} | null {
		if (!raw || typeof raw !== 'object') return null;
		const r: any = raw;

		const author =
			r.user?.nickname ||
			r.userInfo?.nickname ||
			r.user_info?.nickname ||
			r.user?.name ||
			r.nickname ||
			'';

		const rawContent: unknown = r.content ?? r.text ?? r.desc ?? r.body ?? r.note ?? '';
		const contentText = this.extractText(rawContent);
		const safe = contentText ? escapeHtml(contentText).replace(/\n/g, '<br>') : '';
		const contentHtml = safe ? `<p>${safe}</p>` : '';

		const createdAt = this.toNumber(r.createdAt ?? r.createTime ?? r.time ?? r.timestamp);
		const likeCount = this.toNumber(r.likeCount ?? r.likedCount ?? r.like_count);

		const replies =
			(Array.isArray(r.subCommentList) && r.subCommentList) ||
			(Array.isArray(r.subComments) && r.subComments) ||
			(Array.isArray(r.replyList) && r.replyList) ||
			[];

		const id = typeof r.id === 'string' ? r.id : typeof r.commentId === 'string' ? r.commentId : undefined;

		if (!contentHtml && (!Array.isArray(replies) || replies.length === 0)) return null;

		return {
			id,
			author: author || '匿名',
			createdAt,
			likeCount,
			contentHtml,
			replies,
		};
	}

	private flattenComments(
		comments: any[],
		depth: number,
		out: CommentData[],
		seenIds: Set<string>,
	): void {
		if (!Array.isArray(comments) || comments.length === 0) return;

		for (const raw of comments) {
			const normalized = this.normalizeComment(raw);
			if (!normalized) continue;

			if (normalized.id) {
				if (seenIds.has(normalized.id)) continue;
				seenIds.add(normalized.id);
			}

			const iso = this.toIsoDateFromTimestamp(normalized.createdAt);
			const date = iso ? iso.split('T')[0] : '';
			const score = typeof normalized.likeCount === 'number' && normalized.likeCount > 0
				? `${normalized.likeCount} 赞`
				: undefined;

			out.push({
				author: normalized.author,
				date,
				content: normalized.contentHtml,
				depth,
				score,
			});

			if (Array.isArray(normalized.replies) && normalized.replies.length > 0) {
				this.flattenComments(normalized.replies, depth + 1, out, seenIds);
			}
		}
	}

	private unwrapArray(value: any): any[] | null {
		if (Array.isArray(value)) return value;
		// Vue reactive proxy wrappers
		for (const key of ['_rawValue', '_value', 'value']) {
			if (Array.isArray(value?.[key])) return value[key];
		}
		if (Array.isArray(value?.value?.list)) return value.value.list;
		// Common nested list patterns
		for (const path of [value?.list, value?.data?.list, value?.data?.commentList, value?.data?.comments]) {
			if (Array.isArray(path)) return path;
		}
		// Array-like objects (length + numeric indexes).
		const len = typeof value?.length === 'number' ? value.length : 0;
		if (len > 0 && Number.isFinite(len)) {
			try {
				const arr = Array.from({ length: Math.min(len, 200) }, (_, i) => value[i]);
				if (arr.some(item => item !== undefined)) return arr;
			} catch {
				// ignore
			}
		}
		return null;
	}
}
