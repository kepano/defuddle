import { BaseExtractor, ExtractorOptions } from './_base';
import { ExtractorResult } from '../types/extractors';
import { escapeHtml } from '../utils/dom';
import { buildCommentTree, type CommentData } from '../utils/comments';

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
		if (this.getNoteIdFromUrl()) return true;
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
		let note = this.getNoteData();
		let state = this.parseInitialState();
		const includeComments = this.options.includeReplies !== false;

		const urlNoteId = this.getNoteIdFromUrl();
		if (!note && urlNoteId && this.url) {
			// SPA stale state detection: The URL indicates this is a note, but it is not found in the current HTML's initial state.
			try {
				// Proactively fetch the real URL to get the latest HTML source.
				const resp = await this.fetch(this.url, { credentials: 'include' });
				if (resp.ok) {
					const html = await resp.text();
					// Parse the latest state directly from plain text HTML and update the extractor context.
					const newState = this.parseStateText(html);
					if (newState) {
						state = newState;
						this._stateCache = state;
						const noteMap = state.note?.noteDetailMap;
						if (noteMap && noteMap[urlNoteId]?.note) {
							note = noteMap[urlNoteId].note!;
							this._noteCache = note;
						}
					}
				}
			} catch {
				// Catch exceptions and gracefully degrade.
			}
		}

		if (!note) {
			// If there is still no note data after async refresh, attempt a final fallback extraction from the DOM.
			const domNote = this.extractNoteFromDom();
			if (domNote) {
				note = domNote;
				this._noteCache = note;
			} else {
				throw new Error('Failed to extract target note data from SPA state or DOM');
			}
		}

		let comments = '';
		if (includeComments) {
			comments = this.rawCommentsToHtml(this.findRawComments(note, state));



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
			if (!text.includes(INITIAL_STATE_KEY)) continue;

			const parsed = this.parseStateText(text);
			if (parsed) {
				this._stateCache = parsed;
				return parsed;
			}
		}

		this._stateCache = null;
		return null;
	}

	private parseStateText(text: string): XhsInitialState | null {
		const assignIndex = text.indexOf(INITIAL_STATE_KEY);
		if (assignIndex === -1) return null;

		const startIndex = text.indexOf('{', assignIndex);
		if (startIndex === -1) return null;

		let depth = 0;
		let inString = false;
		let i = startIndex;

		while (i < text.length) {
			const char = text[i];
			if (inString) {
				if (char === '\\') {
					i += 2;
					continue;
				}
				if (char === '"') inString = false;
			} else {
				if (char === '"') inString = true;
				else if (char === '{') depth += 1;
				else if (char === '}') {
					depth -= 1;
					if (depth === 0) {
						let jsonText = text.slice(startIndex, i + 1);
						// Normalize invalid tokens outside strings
						jsonText = jsonText.replace(
							/"(?:[^"\\]|\\.)*"|\b(?:undefined|NaN|Infinity)\b/g,
							m => (m[0] === '"' ? m : 'null')
						);
						try {
							return JSON.parse(jsonText) as XhsInitialState;
						} catch {
							return null;
						}
					}
				}
			}
			i += 1;
		}

		return null;
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
			if (urlNoteId) {
				if (noteMap[urlNoteId]?.note) {
					this._noteCache = noteMap[urlNoteId].note!;
					return this._noteCache;
				}
			}
			// If the URL does not contain a note ID (e.g. homepage, profile page), or it is a new note ID not in the state,
			// return null directly. This prevents cross-fetching irrelevant data.
			this._noteCache = null;
			return null;
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
		let note = this.getNoteData();
		if (!note) {
			note = this.extractNoteFromDom();
			if (note) this._noteCache = note;
		}
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
			variables.comments = comments;
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

	private getCommentId(raw: any): string {
		if (!raw || typeof raw !== 'object') return '';
		const id = raw.id ?? raw.commentId ?? raw.comment_id;
		return (typeof id === 'string' || typeof id === 'number') ? String(id) : '';
	}



	private extractNoteFromDom(): XhsNoteData | null {
		const container = this.document.querySelector('#noteContainer');
		if (!container) return null;

		const title = container.querySelector('#detail-title')?.textContent?.trim() || '';
		const authorEl = container.querySelector('.username, .name, .author-name, .nickname, [class*="user-nickname"]');
		
		let desc = '';
		const descEl = container.querySelector('#detail-desc');
		if (descEl) {
			const clone = descEl.cloneNode(true) as HTMLElement;
			clone.querySelectorAll('a.tag').forEach(tag => tag.remove());
			clone.querySelectorAll('br').forEach(br => br.replaceWith('\n'));
			desc = clone.textContent?.trim() || '';
		}
		if (!title && !desc && !authorEl) return null;

		const imageList: XhsImageItem[] = [];
		const addImg = (src: string) => {
			if (src && !src.startsWith('data:') && !src.includes('sns-avatar')) {
				src = src.split('?')[0]!;
				if (!imageList.some(item => item.urlDefault === src)) imageList.push({ urlDefault: src });
			}
		};
		container.querySelectorAll('.media-container img, .swiper-slide img').forEach(img => addImg(img.getAttribute('src') || ''));
		container.querySelectorAll('.media-container, .swiper-slide').forEach(media => {
			const bg = (media.getAttribute('style') || '').match(/background-image:\s*url\(['"]?([^'"()]+)['"]?\)/i);
			if (bg) addImg(bg[1]);
		});

		const tagList: XhsTagItem[] = Array.from(container.querySelectorAll('#detail-desc a.tag'))
			.map(tag => (tag.textContent || '').replace(/^#/, '').trim())
			.filter(Boolean).map(name => ({ name }));

		let timestamp: number | undefined;
		const dateEl = container.querySelector('.date, .bottom-info, .publish-date, span[class*="date"]');
		if (dateEl) {
			const text = dateEl.textContent || '';
			const m = text.match(/(\d{4}-)?\d{2}-\d{2}/);
			if (m) {
				timestamp = Date.parse(m[0].length === 5 ? `${new Date().getFullYear()}-${m[0]}` : m[0]);
			} else {
				const now = Date.now();
				const extract = (regex: RegExp, mul: number) => { const rm = text.match(regex); return rm ? now - parseInt(rm[1]) * mul : undefined; };
				timestamp = text.includes('刚') ? now : extract(/(\d+)\s*分/, 60000) || extract(/(\d+)\s*小/, 3600000) || extract(/(\d+)\s*天/, 86400000) || (text.includes('昨') ? now - 86400000 : undefined);
			}
		}

		let video;
		const videoSrc = container.querySelector('video')?.getAttribute('src');
		if (videoSrc && !videoSrc.startsWith('blob:')) video = { media: { stream: { h264: [{ masterUrl: videoSrc }] } } };

		return {
			noteId: this.getNoteIdFromUrl() || undefined,
			type: video ? 'video' : 'normal',
			title,
			desc,
			user: { nickname: authorEl?.textContent?.trim() || '' },
			imageList,
			tagList,
			time: timestamp,
			video,
		} as XhsNoteData;
	}

	private extractCommentsFromDom(): string {
		const doc = this.document;
		const commentEls = Array.from(doc.querySelectorAll('.comment-item'));
		if (commentEls.length === 0) return '';

		const commentData: CommentData[] = [];
		const processed = new Set<Element>();
		const qsText = (el: Element, sel: string) => el.querySelector(sel)?.textContent?.trim() || '';

		for (const el of commentEls) {
			if (processed.has(el)) continue;
			processed.add(el);

			const authorSelectors = [
				'.user-nickname',
				'.author .name',
				'.author-wrapper .name',
				'.nickname',
				'[class*="user-nickname"]',
				'[class*="author-name"]',
				'[class*="nickname"]',
				'a[href*="/user/profile/"]',
			];
			let author = '';
			for (const selector of authorSelectors) {
				author = qsText(el, selector);
				if (author) break;
			}
			const contentText = qsText(el, '.content, .comment-content, .note-text, [class*="comment-content"], [class*="commentContent"], [class*="note-text"]');
			
			if (!contentText) continue;
			const content = `<p>${escapeHtml(contentText).replace(/\n/g, '<br>')}</p>`;
			const depth = (el.classList && (el.classList.contains('comment-item-sub') || el.classList.contains('sub-comment'))) ? 1 : 0;

			commentData.push({ author: author || '匿名', date: '', content, depth });
		}

		return commentData.length > 0 ? buildCommentTree(commentData) : '';
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
		const hasUser = !!v.user || !!v.userInfo || typeof v.nickname === 'string';
		const hasTimestamp = this.toNumber(v.createdAt ?? v.time ?? v.timestamp) !== undefined;
		return (hasText && hasUser) || (hasText && hasTimestamp);
	}

	private extractText(value: unknown): string {
		if (!value) return '';
		if (typeof value === 'string') return value;
		if (typeof value === 'number') return String(value);
		if (typeof value === 'object') {
			const obj = value as any;
			return obj.text ?? obj.content ?? obj.desc ?? obj.value ?? obj.raw ?? '';
		}
		return '';
	}

	private toNumber(value: unknown): number | undefined {
		if (typeof value === 'number' && Number.isFinite(value)) return value;
		if (typeof value === 'string' && Number.isFinite(Number(value))) return Number(value);
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

		const replies = this.extractReplies(r);

		const id = this.getCommentId(r) || undefined;

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

	private extractReplies(raw: any): any[] {
		const candidates = [
			raw?.subCommentList,
			raw?.subComments,
			raw?.replyList,
			raw?.sub_comments,
			raw?.sub_comment_list,
			raw?.replies,
			raw?.children,
		];

		const replies: any[] = [];
		const seenIds = new Set<string>();
		const seenObjects = new Set<any>();
		for (const candidate of candidates) {
			const unwrapped = this.unwrapArray(candidate);
			if (!unwrapped || unwrapped.length === 0) continue;
			for (const reply of unwrapped) {
				if (!reply || typeof reply !== 'object') continue;
				const id = this.getCommentId(reply);
				if (id ? seenIds.has(id) : seenObjects.has(reply)) continue;
				if (id) seenIds.add(id);
				else seenObjects.add(reply);
				replies.push(reply);
			}
		}
		return replies;
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
		// Common nested list patterns
		for (const path of [value?.list, value?.data?.list, value?.data?.commentList, value?.data?.comments]) {
			if (Array.isArray(path)) return path;
		}
		return null;
	}
}
