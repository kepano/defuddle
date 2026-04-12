import { BaseExtractor } from './_base';
import { ExtractorResult } from '../types/extractors';
import { escapeHtml, isDangerousUrl } from '../utils/dom';

const C2_API = 'https://c2.com/wiki/remodel/pages/';

export class C2WikiExtractor extends BaseExtractor {
	private pageTitle: string | null | undefined;

	canExtract(): boolean {
		return false;
	}

	canExtractAsync(): boolean {
		return this.getPageTitle() !== null;
	}

	prefersAsync(): boolean {
		return true;
	}

	extract(): ExtractorResult {
		return { content: '', contentHtml: '' };
	}

	async extractAsync(): Promise<ExtractorResult> {
		const title = this.getPageTitle();
		if (!title) return { content: '', contentHtml: '' };

		const json = await this.fetch(C2_API + title).then(res => res.json());
		if (!json || !json.text) return { content: '', contentHtml: '' };

		const words = title.replace(/([a-z])([A-Z])/g, '$1 $2');
		const contentHtml = this.renderPage(json);

		return {
			content: contentHtml,
			contentHtml,
			variables: {
				title: words,
				site: 'C2 Wiki',
				...(json.date ? { published: json.date } : {}),
			},
		};
	}

	private getPageTitle(): string | null {
		if (this.pageTitle !== undefined) return this.pageTitle;
		try {
			const search = new URL(this.url).search;
			const match = search.match(/[?&]([A-Za-z]\w*)/);
			this.pageTitle = match ? match[1] : 'WelcomeVisitors';
		} catch {
			this.pageTitle = null;
		}
		return this.pageTitle;
	}

	private renderPage(json: any): string {
		const body = this.markup(json.text);
		const footer = json.date ? `<hr><p>Last edit ${escapeHtml(json.date)}</p>` : '';
		return `${body}${footer}`;
	}

	private markup(text: string): string {
		const lines = text.replace(/\\\n/g, ' ').split(/\r?\n/);
		const parts: string[] = [];
		let openTags: string[] = [];

		for (const line of lines) {
			const { html, openTags: nextTags } = this.applyBullets(line, openTags);
			parts.push(this.applyInline(html));
			openTags = nextTags;
		}

		while (openTags.length > 0) {
			parts.push(`</${openTags.pop()}>`);
		}

		return parts.join('\n');
	}

	private applyBullets(text: string, openTags: string[]): { html: string; openTags: string[] } {
		const newOpenTags = [...openTags];
		let prefix = '';

		const closeToDepth = (depth: number, tag?: string) => {
			while (newOpenTags.length > depth) {
				prefix += `</${newOpenTags.pop()}>`;
			}
			if (tag && newOpenTags.length < depth) {
				prefix += `<${tag}>`;
				newOpenTags.push(tag);
			} else if (tag && newOpenTags.length === depth && newOpenTags[depth - 1] !== tag) {
				prefix += `</${newOpenTags.pop()}><${tag}>`;
				newOpenTags.push(tag);
			}
		};

		if (/^\s*$/.test(text)) {
			const inList = newOpenTags.some(t => t === 'ul' || t === 'ol' || t === 'dl');
			if (inList) return { html: '', openTags: newOpenTags };
			closeToDepth(0);
			return { html: prefix + '<p></p>', openTags: newOpenTags };
		}

		if (/^-----*/.test(text)) {
			closeToDepth(0);
			return { html: prefix + '<hr>', openTags: newOpenTags };
		}

		const dlMatch = text.match(/^(\t+)(.+):\t/);
		if (dlMatch) {
			closeToDepth(dlMatch[1].length, 'dl');
			return { html: prefix + `<dt>${dlMatch[2]}<dd>` + text.slice(dlMatch[0].length), openTags: newOpenTags };
		}

		const tabUlMatch = text.match(/^(\t+)\*/);
		if (tabUlMatch) {
			closeToDepth(tabUlMatch[1].length, 'ul');
			return { html: prefix + '<li>' + text.slice(tabUlMatch[0].length), openTags: newOpenTags };
		}

		const starUlMatch = text.match(/^(\*+)/);
		if (starUlMatch) {
			closeToDepth(starUlMatch[1].length, 'ul');
			return { html: prefix + '<li>' + text.slice(starUlMatch[0].length), openTags: newOpenTags };
		}

		const olMatch = text.match(/^(\t+)\d+\.?/);
		if (olMatch) {
			closeToDepth(olMatch[1].length, 'ol');
			return { html: prefix + '<li>' + text.slice(olMatch[0].length), openTags: newOpenTags };
		}

		if (/^\s/.test(text)) {
			closeToDepth(1, 'pre');
			return { html: prefix + text, openTags: newOpenTags };
		}

		closeToDepth(0);
		return { html: prefix + text, openTags: newOpenTags };
	}

	private applyInline(text: string): string {
		return text
			.replace(/'''(.*?)'''/g, '<strong>$1</strong>')
			.replace(/''(.*?)''/g, '<em>$1</em>')
			.replace(
				/\b(https?|ftp|mailto|file|telnet|news):[^\s<>[\]"'()]*[^\s<>[\]"'(),.?]/g,
				(url) => {
					if (isDangerousUrl(url)) return escapeHtml(url);
					if (/\.(gif|jpg|jpeg|png)$/i.test(url)) {
						return `<img src="${escapeAttr(url)}">`;
					}
					return `<a href="${escapeAttr(url)}" rel="nofollow" target="_blank">${escapeHtml(url)}</a>`;
				}
			);
	}
}

function escapeAttr(text: string): string {
	return text.replace(/"/g, '&quot;').replace(/'/g, '&#39;');
}
