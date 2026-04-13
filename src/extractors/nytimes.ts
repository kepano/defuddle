import { BaseExtractor } from './_base';
import { ExtractorResult } from '../types/extractors';
import { parseHTML } from '../utils/dom';

const INJECTED_ATTR = 'data-defuddle-nyt';

interface NytPreloadedData {
	initialData?: {
		data?: {
			article?: NytArticle;
		};
	};
}

interface NytArticle {
	headline?: { default?: string };
	summary?: string;
	firstPublished?: string;
	bylines?: Array<{
		creators?: Array<{
			displayName?: string;
		}>;
	}>;
	sprinkledBody?: NytBody;
	body?: NytBody;
}

interface NytBody {
	content?: NytBlock[];
}

type NytBlock =
	| NytParagraphBlock
	| NytImageBlock
	| NytHeadingBlock
	| NytHeaderBlock
	| NytDropzone
	| NytGenericBlock;

interface NytTextInline {
	__typename: string;
	text?: string;
	formats?: Array<{ __typename: string; url?: string }>;
}

interface NytParagraphBlock {
	__typename: 'ParagraphBlock';
	content?: NytTextInline[];
}

interface NytImageBlock {
	__typename: 'ImageBlock';
	media?: {
		altText?: string;
		caption?: {
			text?: string;
		};
		credit?: string;
		crops?: Array<{
			renditions?: Array<{
				name?: string;
				url?: string;
				width?: number;
				height?: number;
			}>;
		}>;
	};
}

interface NytHeadingBlock {
	__typename: 'Heading2Block' | 'Heading3Block' | 'Heading4Block';
	content?: NytTextInline[];
}

interface NytHeaderBlock {
	__typename: 'HeaderBasicBlock';
}

interface NytDropzone {
	__typename: 'Dropzone';
}

interface NytGenericBlock {
	__typename: string;
	content?: NytTextInline[];
}

export class NytimesExtractor extends BaseExtractor {
	private preloadedData: NytArticle | null = null;
	private contentSelector: string | null = null;

	constructor(document: Document, url: string, schemaOrgData?: any, options?: any) {
		super(document, url, schemaOrgData, options);
		this.preloadedData = this.extractPreloadData();

		if (this.preloadedData) {
			const body = this.preloadedData.sprinkledBody || this.preloadedData.body;
			if (body?.content?.length) {
				// Inject rendered content into the document for the pipeline
				const existing = document.querySelector(`[${INJECTED_ATTR}]`);
				if (!existing) {
					const wrapper = document.createElement('div');
					wrapper.setAttribute(INJECTED_ATTR, '');
					wrapper.appendChild(parseHTML(document, this.renderBlocks(body.content)));
					document.body.appendChild(wrapper);
				}
				this.contentSelector = `[${INJECTED_ATTR}]`;
			}
		}
	}

	canExtract(): boolean {
		return this.contentSelector !== null;
	}

	extract(): ExtractorResult {
		const article = this.preloadedData!;

		const title = article.headline?.default || '';
		const authors = (article.bylines?.[0]?.creators || [])
			.map(c => c.displayName)
			.filter(Boolean)
			.join(', ');
		const published = article.firstPublished || '';
		const description = article.summary || '';

		return {
			content: '',
			contentHtml: '',
			contentSelector: this.contentSelector!,
			variables: {
				title,
				author: authors,
				published,
				description,
			},
		};
	}

	private extractPreloadData(): NytArticle | null {
		const scripts = this.document.querySelectorAll('script:not([src])');
		for (const script of scripts) {
			const text = script.textContent || '';
			if (!text.includes('window.__preloadedData')) continue;

			const match = text.match(/window\.__preloadedData\s*=\s*({[\s\S]+})\s*;?\s*$/);
			if (!match) continue;

			try {
				// NYT JSON contains JS `undefined` values — replace with null
				const raw = match[1].replace(/(?<=:)undefined(?=[,}\]])/g, 'null');
				const data = JSON.parse(raw) as NytPreloadedData;
				return data.initialData?.data?.article || null;
			} catch {
				return null;
			}
		}
		return null;
	}

	private renderBlocks(blocks: NytBlock[]): string {
		const parts: string[] = [];

		for (const block of blocks) {
			switch (block.__typename) {
				case 'ParagraphBlock':
					parts.push(`<p>${this.renderInlines((block as NytParagraphBlock).content)}</p>`);
					break;

				case 'Heading2Block':
					parts.push(`<h2>${this.renderInlines((block as NytHeadingBlock).content)}</h2>`);
					break;

				case 'Heading3Block':
					parts.push(`<h3>${this.renderInlines((block as NytHeadingBlock).content)}</h3>`);
					break;

				case 'Heading4Block':
					parts.push(`<h4>${this.renderInlines((block as NytHeadingBlock).content)}</h4>`);
					break;

				case 'ImageBlock': {
					const img = block as NytImageBlock;
					const media = img.media;
					if (!media) break;

					const src = this.getBestImageUrl(media);
					if (!src) break;

					const alt = this.escapeAttr(media.altText || media.caption?.text || '');
					const caption = media.caption?.text || '';
					const credit = media.credit || '';
					const figcaptionParts = [caption, credit].filter(Boolean);

					if (figcaptionParts.length) {
						parts.push(
							`<figure>` +
							`<img src="${this.escapeAttr(src)}" alt="${alt}">` +
							`<figcaption>${this.escapeHtml(figcaptionParts.join(' '))}</figcaption>` +
							`</figure>`
						);
					} else {
						parts.push(`<img src="${this.escapeAttr(src)}" alt="${alt}">`);
					}
					break;
				}

				case 'HeaderBasicBlock':
				case 'Dropzone':
					// Skip structural blocks
					break;

				default: {
					// Handle unknown blocks that have inline content
					const generic = block as NytGenericBlock;
					if (generic.content?.length) {
						parts.push(`<p>${this.renderInlines(generic.content)}</p>`);
					}
					break;
				}
			}
		}

		return parts.join('\n');
	}

	private renderInlines(inlines?: NytTextInline[]): string {
		if (!inlines) return '';

		return inlines.map(inline => {
			let text = this.escapeHtml(inline.text || '');
			if (!inline.formats?.length) return text;

			for (const fmt of inline.formats) {
				switch (fmt.__typename) {
					case 'BoldFormat':
						text = `<strong>${text}</strong>`;
						break;
					case 'ItalicFormat':
						text = `<em>${text}</em>`;
						break;
					case 'LinkFormat':
						if (fmt.url) {
							text = `<a href="${this.escapeAttr(fmt.url)}">${text}</a>`;
						}
						break;
				}
			}

			return text;
		}).join('');
	}

	private getBestImageUrl(media?: NytImageBlock['media']): string | null {
		const crops = media?.crops;
		if (!crops?.length) return null;

		// Prefer superJumbo > jumbo > articleLarge
		const preferred = ['superJumbo', 'jumbo', 'articleLarge'];

		for (const name of preferred) {
			for (const crop of crops) {
				const rendition = crop.renditions?.find(
					(r: { name?: string; url?: string }) => r.name === name
				);
				if (rendition?.url) return rendition.url;
			}
		}

		// Fall back to any rendition with a URL
		for (const crop of crops) {
			if (crop.renditions?.length && crop.renditions[0].url) {
				return crop.renditions[0].url;
			}
		}

		return null;
	}

	private escapeHtml(text: string): string {
		return text
			.replace(/&/g, '&amp;')
			.replace(/</g, '&lt;')
			.replace(/>/g, '&gt;');
	}

	private escapeAttr(text: string): string {
		return text
			.replace(/&/g, '&amp;')
			.replace(/"/g, '&quot;')
			.replace(/</g, '&lt;')
			.replace(/>/g, '&gt;');
	}
}
