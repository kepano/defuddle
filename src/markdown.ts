import TurndownService from 'turndown';
import { isElement, isTextNode } from './utils';
import { parseHTML, serializeHTML, isDirectTableChild } from './utils/dom';
import type { DefuddleResponse, DefuddleOptions } from './types';

// Define a type that works for both JSDOM and browser environments
type GenericElement = {
	classList?: {
		contains: (className: string) => boolean;
	};
	getAttribute: (name: string) => string | null;
	hasAttribute: (name: string) => boolean;
	querySelector: (selector: string) => Element | null;
	querySelectorAll: (selector: string) => NodeListOf<Element>;
	rows?: ArrayLike<{
		cells?: ArrayLike<{}>;
	}>;
	parentNode?: GenericElement | null;
	nextSibling?: GenericElement | null;
	nodeName: string;
	innerHTML: string;
	children?: ArrayLike<GenericElement>;
	cloneNode: (deep?: boolean) => Node;
	textContent?: string | null;
	attributes?: NamedNodeMap;
	className?: string;
	tagName?: string;
	nodeType: number;
	closest?: (selector: string) => Element | null;
};

export function isGenericElement(node: unknown): node is GenericElement {
	return node !== null && typeof node === 'object' && 'getAttribute' in node;
}

export function asGenericElement(node: any): GenericElement {
	return node as unknown as GenericElement;
}


const WIDTH_DESCRIPTOR_RE = /^(\d+)w,?$/;
const DENSITY_DESCRIPTOR_RE = /^\d+(?:\.\d+)?x,?$/;

function getBestImageSrc(node: GenericElement): string {
	const srcset = node.getAttribute('srcset');
	if (srcset) {
		let bestUrl = '';
		let bestWidth = 0;
		// Tokenize by whitespace instead of splitting on commas, because CDN
		// image URLs (e.g. Substack) can contain commas in the URL path
		// (e.g. `w_424,c_limit,f_webp`). We scan tokens and treat any token
		// matching `Nw` as a width descriptor; the preceding tokens form the URL.
		const tokens = srcset.trim().split(/\s+/);
		let urlParts: string[] = [];
		for (const token of tokens) {
			const widthMatch = token.match(WIDTH_DESCRIPTOR_RE);
			if (widthMatch) {
				const width = parseInt(widthMatch[1], 10);
				if (urlParts.length > 0 && width > bestWidth) {
					const url = urlParts.join(' ').replace(/^,\s*/, '');
					if (url) {
						bestWidth = width;
						bestUrl = url;
					}
				}
				urlParts = [];
			} else if (DENSITY_DESCRIPTOR_RE.test(token)) {
				// Density descriptor (e.g. 2x) — skip, not used for selection
				urlParts = [];
			} else {
				urlParts.push(token);
			}
		}
		if (bestUrl) return bestUrl;
	}
	return node.getAttribute('src') || '';
}

export function createMarkdownContent(content: string, url: string) {
	const footnotes: { [key: string]: string } = {};
	const turndownService = new TurndownService({
		headingStyle: 'atx',
		hr: '---',
		bulletListMarker: '-',
		codeBlockStyle: 'fenced',
		emDelimiter: '*',
		preformattedCode: true,
	});

	turndownService.addRule('table', {
		filter: 'table',
		replacement: function(content, node) {
			if (!isGenericElement(node)) return content;
			
			// Check if it's an ArXiv equation table
			if (node.classList?.contains('ltx_equation') || node.classList?.contains('ltx_eqn_table')) {
				return handleNestedEquations(node);
			}

			// Detect layout tables (used for styling/positioning, not data)
			const hasNestedTables = node.querySelector('table') !== null;
			const directCells = Array.from(node.querySelectorAll('td, th')).filter(
				(el: any) => isDirectTableChild(el, node)
			);

			if (hasNestedTables || directCells.length <= 1) {
				const directRows = Array.from(node.querySelectorAll('tr')).filter(
					(el: any) => isDirectTableChild(el, node)
				);
				const cellCounts = directRows.map((tr: any) =>
					directCells.filter((cell: any) => cell.parentNode === tr).length
				);
				const isSingleColumn = directRows.length > 0
					&& new Set(cellCounts).size === 1
					&& cellCounts[0] <= 1;

				if (isSingleColumn) {
					// Layout table — extract content, don't convert to markdown table
					return '\n\n' + turndownService.turndown(
						directCells.map((cell: any) => serializeHTML(cell)).join('')
					) + '\n\n';
				}
			}

			// Check if the table has colspan or rowspan
			const cells = Array.from(node.querySelectorAll('td, th'));
			const hasComplexStructure = cells.some(cell =>
				isGenericElement(asGenericElement(cell)) && (cell.hasAttribute('colspan') || cell.hasAttribute('rowspan'))
			);

			if (hasComplexStructure) {
				// Clean up the table HTML
				const cleanedTable = cleanupTableHTML(node);
				return '\n\n' + cleanedTable + '\n\n';
			}

			// Process simple tables as before
			// Use node.rows/row.cells when available (browser/JSDOM), fall back to
			// querySelectorAll for environments like linkedom that lack these properties
			const tableEl = node as any;
			const rowElements: any[] = tableEl.rows && tableEl.rows.length > 0
				? Array.from(tableEl.rows)
				: Array.from(node.querySelectorAll('tr')).filter(
					(tr: any) => isDirectTableChild(tr, node)
				);
			const rows = rowElements.map((row: any) => {
				const cellElements: any[] = row.cells && row.cells.length > 0
					? Array.from(row.cells)
					: Array.from(row.querySelectorAll('td, th')).filter(
						(cell: any) => cell.parentNode === row
					);
				const cellContents = cellElements.map((cell: any) => {
					// Remove newlines and trim the content
					let cellContent = turndownService.turndown(serializeHTML(cell))
						.replace(/\n/g, ' ')
						.trim();
					// Escape pipe characters
					cellContent = cellContent.replace(/\|/g, '\\|');
					return cellContent;
				});
				return `| ${cellContents.join(' | ')} |`;
			});

			if (!rows.length) return content;

			// Create the separator row
			const separatorRow = `| ${Array(rows[0].split('|').length - 2).fill('---').join(' | ')} |`;

			// Combine all rows
			const tableContent = [rows[0], separatorRow, ...rows.slice(1)].join('\n');

			return `\n\n${tableContent}\n\n`;
		}
	});

	turndownService.remove(['style', 'script']);

	// Keep iframes, video, audio, sup, and sub elements
	// @ts-ignore
	turndownService.keep(['iframe', 'video', 'audio', 'sup', 'sub', 'svg', 'math']);
	turndownService.remove(['button']);

	turndownService.addRule('list', {
		filter: ['ul', 'ol'],
		replacement: function (content: string, node: Node) {
			// Remove trailing newlines/spaces from content
			content = content.trim();
			
			// Add a newline before the list if it's a top-level list
			const element = node as unknown as GenericElement;
			const isTopLevel = !(element.parentNode && (element.parentNode.nodeName === 'UL' || element.parentNode.nodeName === 'OL'));
			return (isTopLevel ? '\n' : '') + content + '\n';
		}
	});

	// Lists with tab indentation
	turndownService.addRule('listItem', {
		filter: 'li',
		replacement: function (content: string, node: Node, options: TurndownService.Options) {
			if (!isGenericElement(node)) return content;

			// Handle task list items
			const isTaskListItem = node.classList?.contains('task-list-item');
			const checkbox = node.querySelector('input[type="checkbox"]');
			let taskListMarker = '';
			
			if (isTaskListItem && checkbox && isGenericElement(checkbox)) {
				// Remove the checkbox from content since we'll add markdown checkbox
				content = content.replace(/<input[^>]*>/, '');
				taskListMarker = checkbox.getAttribute('checked') ? '[x] ' : '[ ] ';
			}

			content = content
				// Remove trailing newlines
				.replace(/\n+$/, '')
				// Split into lines
				.split('\n')
				// Remove empty lines
				.filter(line => line.length > 0)
				// Add indentation to continued lines
				.join('\n\t');

			let prefix = options.bulletListMarker + ' ';
			let parent = node.parentNode;

			// Calculate the nesting level
			let level = 0;
			let currentParent = node.parentNode;
			while (currentParent && isGenericElement(currentParent)) {
				if (currentParent.nodeName === 'UL' || currentParent.nodeName === 'OL') {
					level++;
				} else if (currentParent.nodeName !== 'LI') {
					break;
				}
				currentParent = currentParent.parentNode;
			}

			// Add tab indentation based on nesting level, ensuring it's never negative
			const indentLevel = Math.max(0, level - 1);
			prefix = '\t'.repeat(indentLevel) + prefix;

			if (parent && isGenericElement(parent) && parent.nodeName === 'OL') {
				let start = parent.getAttribute('start');
				let index = 1;
				const children = Array.from(parent.children || []);
				for (let i = 0; i < children.length; i++) {
					if (children[i] === node) {
						index = i + 1;
						break;
					}
				}
				prefix = '\t'.repeat(level - 1) + (start ? Number(start) + index - 1 : index) + '. ';
			}

			return prefix + taskListMarker + content.trim() + (node.nextSibling && !/\n$/.test(content) ? '\n' : '');
		}
	});

	turndownService.addRule('figure', {
		filter: 'figure',
		replacement: function(content, node) {
			if (!isGenericElement(node)) return content;

			const img = node.querySelector('img');
			const figcaption = node.querySelector('figcaption');

			if (!img || !isGenericElement(img)) return content;

			// If the figure contains <p> elements outside of <figcaption>, it's a
			// content wrapper (e.g. Medium's layout), not an image figure. Let
			// Turndown process its children normally instead of treating the whole
			// thing as a single image.
			const hasParagraphsOutsideFigcaption = Array.from(node.querySelectorAll('p')).some((p) => {
				let ancestor = asGenericElement(p).parentNode;
				while (ancestor && ancestor !== node) {
					if (ancestor.nodeName === 'FIGCAPTION') return false;
					ancestor = ancestor.parentNode;
				}
				return true;
			});
			if (hasParagraphsOutsideFigcaption) return content;

			const alt = img.getAttribute('alt') || '';
			const src = getBestImageSrc(img);
			let caption = '';

			if (figcaption && isGenericElement(figcaption)) {
				const tagSpan = figcaption.querySelector('.ltx_tag_figure');
				const tagText = tagSpan && isGenericElement(tagSpan) ? tagSpan.textContent?.trim() : '';
				
				// Process the caption content, including math elements
				let captionContent = serializeHTML(figcaption);
				const ownerDoc = (node as any).ownerDocument;
				captionContent = captionContent.replace(/<math.*?>(.*?)<\/math>/g, (match, mathContent, offset, string) => {
					let latex = '';
					if (ownerDoc) {
						const fragment = parseHTML(ownerDoc, match);
						const mathElement = fragment.querySelector('math');
						latex = mathElement && isGenericElement(mathElement) ? extractLatex(mathElement) : '';
					}
					const prevChar = string[offset - 1] || '';
					const nextChar = string[offset + match.length] || '';

					const isStartOfLine = offset === 0 || /\s/.test(prevChar);
					const isEndOfLine = offset + match.length === string.length || /\s/.test(nextChar);

					const leftSpace = (!isStartOfLine && !/[\s$]/.test(prevChar)) ? ' ' : '';
					const rightSpace = (!isEndOfLine && !/[\s$]/.test(nextChar)) ? ' ' : '';

					return `${leftSpace}$${latex}$${rightSpace}`;
				});

				// Convert the processed caption content to markdown
				const captionMarkdown = turndownService.turndown(captionContent);
				
				// Combine tag and processed caption
				caption = `${tagText} ${captionMarkdown}`.trim();
			}

			// Handle references in the caption
			caption = caption.replace(/\[([^\]]+)\]\(([^)]+)\)/g, (match, text, href) => {
				return `[${text}](${href})`;
			});

			return `![${alt}](${src})\n\n${caption}\n\n`;
		}
	});

	// Prefer the highest-resolution image from srcset over the small fallback in src
	turndownService.addRule('image', {
		filter: 'img',
		replacement: function(content, node) {
			if (!isGenericElement(node)) return content;
			const alt = node.getAttribute('alt') || '';
			const src = getBestImageSrc(node);
			const title = node.getAttribute('title') || '';
			const titlePart = title ? ` "${title}"` : '';
			return src ? `![${alt}](${src}${titlePart})` : '';
		}
	});

	// Use Obsidian format for YouTube embeds and tweets
	turndownService.addRule('embedToMarkdown', {
		filter: function (node: Node): boolean {
			if (!isGenericElement(node)) return false;
			const src = node.getAttribute('src');
			return !!src && (
				!!src.match(/(?:youtube\.com|youtube-nocookie\.com|youtu\.be)/) ||
				!!src.match(/(?:twitter\.com|x\.com)/)
			);
		},
		replacement: function (content: string, node: Node): string {
			if (!isGenericElement(node)) return content;
			const src = node.getAttribute('src');
			if (src) {
				const youtubeMatch = src.match(/(?:https?:\/\/)?(?:www\.)?(?:youtube\.com|youtube-nocookie\.com|youtu\.be)\/(?:embed\/|watch\?v=)?([a-zA-Z0-9_-]+)/);
				if (youtubeMatch && youtubeMatch[1]) {
					return `\n![](https://www.youtube.com/watch?v=${youtubeMatch[1]})\n`;
				}
				// Direct URL: /user/status/id
				const tweetDirectMatch = src.match(/(?:https?:\/\/)?(?:www\.)?(?:twitter\.com|x\.com)\/([^/]+)\/status\/([0-9]+)/);
				if (tweetDirectMatch) {
					return `\n![](https://x.com/${tweetDirectMatch[1]}/status/${tweetDirectMatch[2]})\n`;
				}
				// Platform embed: ?id=
				const tweetEmbedMatch = src.match(/(?:https?:\/\/)?(?:platform\.)?twitter\.com\/embed\/Tweet\.html\?.*?id=([0-9]+)/);
				if (tweetEmbedMatch) {
					return `\n![](https://x.com/i/status/${tweetEmbedMatch[1]})\n`;
				}
			}
			return content;
		}
	});

	turndownService.addRule('highlight', {
		filter: 'mark',
		replacement: function(content) {
			return '==' + content + '==';
		}
	});

	turndownService.addRule('strikethrough', {
		filter: (node: Node) => 
			node.nodeName === 'DEL' || 
			node.nodeName === 'S' || 
			node.nodeName === 'STRIKE',
		replacement: function(content) {
			return '~~' + content + '~~';
		}
	});

	// Add a new custom rule for complex link structures
	turndownService.addRule('complexLinkStructure', {
		filter: function (node, options) {
			return (
				node.nodeName === 'A' &&
				node.childNodes.length > 1 &&
				Array.from(node.childNodes).some(child => ['H1', 'H2', 'H3', 'H4', 'H5', 'H6'].includes(child.nodeName))
			);
		},
		replacement: function (content, node, options) {
			if (!isGenericElement(node)) return content;
			const href = node.getAttribute('href');
			const title = node.getAttribute('title');
			
			// Extract the heading — use outerHTML to preserve the heading tag
			const headingNode = node.querySelector('h1, h2, h3, h4, h5, h6');
			const headingContent = headingNode ? turndownService.turndown((headingNode as any).outerHTML) : '';
			
			// Remove the heading from the content
			if (headingNode) {
				headingNode.remove();
			}
			
			// Convert the remaining content
			const remainingContent = turndownService.turndown(serializeHTML(node));
			
			// Construct the new markdown
			let markdown = `${headingContent}\n\n${remainingContent}\n\n`;
			if (href) {
				markdown += `[View original](${href})`;
				if (title) {
					markdown += ` "${title}"`;
				}
			}
			
			return markdown;
		}
	});

	turndownService.addRule('arXivEnumerate', {
		filter: (node) => {
			return node.nodeName === 'OL' && isGenericElement(node) && (node.classList?.contains('ltx_enumerate') ?? false);
		},
		replacement: function(content, node) {
			if (!isGenericElement(node)) return content;
			
			const items = Array.from(node.children || []).map((item, index) => {
				if (isGenericElement(item)) {
					const itemContent = (serializeHTML(item) || '').replace(/^<span class="ltx_tag ltx_tag_item">\d+\.<\/span>\s*/, '');
					return `${index + 1}. ${turndownService.turndown(itemContent)}`;
				}
				return '';
			});
			
			return '\n\n' + items.join('\n\n') + '\n\n';
		}
	});

	turndownService.addRule('citations', {
		filter: (node: Node): boolean => {
			if (isGenericElement(node)) {
				const id = node.getAttribute('id');
				return node.nodeName === 'SUP' && id !== null && id.startsWith('fnref:');
			}
			return false;
		},
		replacement: (content, node) => {
			if (isGenericElement(node)) {
				const id = node.getAttribute('id');
				if (node.nodeName === 'SUP' && id !== null && id.startsWith('fnref:')) {
					const primaryNumber = id.replace('fnref:', '').split('-')[0];
					return `[^${primaryNumber}]`;
				}
			}
			return content;
		}
	});

	// Footnotes list
	turndownService.addRule('footnotesList', {
		filter: (node: Node): boolean => {
			if (isGenericElement(node)) {
				const parentNode = node.parentNode;
				return (
					node.nodeName === 'OL' &&
					parentNode !== null &&
					isGenericElement(parentNode) &&
					parentNode.getAttribute('id') === 'footnotes'
				);
			}
			return false;
		},
		replacement: (content, node) => {
			if (!isGenericElement(node)) return content;
			
			const references = Array.from(node.children || []).map(li => {
				let id;
				if (isGenericElement(li)) {
					const liId = li.getAttribute('id');
					if (liId !== null) {
						if (liId.startsWith('fn:')) {
							id = liId.replace('fn:', '');
						} else {
							const match = liId.split('/').pop()?.match(/cite_note-(.+)/);
							id = match ? match[1] : liId;
						}
					}
					
					// Remove the leading sup element if its content matches the footnote id
					const supElement = li.querySelector('sup');
					if (supElement && isGenericElement(supElement) && supElement.textContent?.trim() === id) {
						supElement.remove();
					}
					
					const referenceContent = turndownService.turndown(serializeHTML(li));
					// Remove the backlink from the footnote content
					const cleanedContent = referenceContent.replace(/\s*↩︎$/, '').trim();
					return `[^${id?.toLowerCase()}]: ${cleanedContent}`;
				}
				return '';
			});
			return '\n\n' + references.join('\n\n') + '\n\n';
		}
	});

	// General removal rules for varous website elements
	turndownService.addRule('removals', {
		filter: function (node) {
			if (!isGenericElement(node)) return false;
			// Remove the Defuddle backlink from the footnote content
			if (node.getAttribute('href')?.includes('#fnref')) return true;
			if (node.classList?.contains('footnote-backref')) return true;
			return false;
		},
		replacement: function (content, node) {
			return '';
		}
	});

	turndownService.addRule('handleTextNodesInTables', {
		filter: function (node: any): boolean {
			return isTextNode(node) && 
				   node.parentNode !== null && 
				   node.parentNode.nodeName === 'TD';
		},
		replacement: function (content: string): string {
			return content;
		}
	});

	turndownService.addRule('preformattedCode', {
		filter: (node) => {
			return node.nodeName === 'PRE';
		},
		replacement: (content, node) => {
			if (!isGenericElement(node)) return content;
			
			const codeElement = node.querySelector('code');
			if (!codeElement || !isGenericElement(codeElement)) return content;
			
			const language = codeElement.getAttribute('data-lang')
				|| codeElement.getAttribute('data-language')
				|| codeElement.getAttribute('class')?.match(/language-(\w+)/)?.[1]
				|| node.getAttribute('data-language')
				|| '';
			const code = codeElement.textContent || '';
			
			// Clean up the content and escape backticks
			const cleanCode = code
				.trim()
				.replace(/`/g, '\\`');
			
			return `\n\`\`\`${language}\n${cleanCode}\n\`\`\`\n`;
		}
	});

	turndownService.addRule('math', {
		filter: (node) => {
			return node.nodeName.toLowerCase() === 'math' || 
				(isGenericElement(node) && 
				(node.classList?.contains('mwe-math-element') || 
				node.classList?.contains('mwe-math-fallback-image-inline') || 
				node.classList?.contains('mwe-math-fallback-image-display')));
		},
		replacement: (content, node) => {
			if (!isGenericElement(node)) return content;

			let latex = extractLatex(node);

			// Remove leading and trailing whitespace
			latex = latex.trim();

			// Check if the math element is within a table
			const isInTable = typeof node.closest === 'function' ? node.closest('table') !== null : false;

			// Check if it's an inline or block math element
			if (!isInTable && (
				node.getAttribute('display') === 'block' || 
				node.classList?.contains('mwe-math-fallback-image-display') || 
				(node.parentNode && isGenericElement(node.parentNode) && 
				node.parentNode.classList?.contains('mwe-math-element') && 
				node.parentNode.previousSibling && isGenericElement(node.parentNode.previousSibling) && 
				node.parentNode.previousSibling.nodeName.toLowerCase() === 'p')
			)) {
				return `\n$$\n${latex}\n$$\n`;
			} else {
				// For inline math, ensure there's a space before and after only if needed
				const prevNode = node.previousSibling;
				const nextNode = node.nextSibling;
				const prevChar = prevNode && isGenericElement(prevNode) ? prevNode.textContent?.slice(-1) || '' : '';
				const nextChar = nextNode && isGenericElement(nextNode) ? nextNode.textContent?.[0] || '' : '';

				const isStartOfLine = !prevNode || (isTextNode(prevNode) && prevNode.textContent?.trim() === '');
				const isEndOfLine = !nextNode || (isTextNode(nextNode) && nextNode.textContent?.trim() === '');

				const leftSpace = (!isStartOfLine && prevChar && !/[\s$]/.test(prevChar)) ? ' ' : '';
				const rightSpace = (!isEndOfLine && nextChar && !/[\s$]/.test(nextChar)) ? ' ' : '';

				return `${leftSpace}$${latex}$${rightSpace}`;
			}
		}
	});

	turndownService.addRule('katex', {
		filter: (node) => {
			return isGenericElement(node) && 
				   (node.classList?.contains('math') || node.classList?.contains('katex'));
		},
		replacement: (content, node) => {
			if (!isGenericElement(node)) return content;

			// Try to find the original LaTeX content
			// 1. Check data-latex attribute
			let latex = node.getAttribute('data-latex');
			
			// 2. If no data-latex, try to get from .katex-mathml
			if (!latex) {
				const mathml = node.querySelector('.katex-mathml annotation[encoding="application/x-tex"]');
				latex = mathml && isGenericElement(mathml) ? mathml.textContent || '' : '';
			}

			// 3. If still no content, use text content as fallback
			if (!latex) {
				latex = node.textContent?.trim() || '';
			}

			// Determine if it's an inline formula
			const mathElement = node.querySelector('.katex-mathml math');
			const isInline = node.classList?.contains('math-inline') || 
				(mathElement && isGenericElement(mathElement) && mathElement.getAttribute('display') !== 'block');
			
			if (isInline) {
				return `$${latex}$`;
			} else {
				return `\n$$\n${latex}\n$$\n`;
			}
		}
	});

	// All callout types (GitHub alerts, Bootstrap alerts, callout asides) are
	// standardized to div.callout[data-callout] in callouts.ts
	turndownService.addRule('callout', {
		filter: (node) => {
			return (
				isGenericElement(node) &&
				!!node.getAttribute('data-callout') &&
				node.classList?.contains('callout')
			);
		},
		replacement: (content, node) => {
			if (!isGenericElement(node)) return content;
			const type = node.getAttribute('data-callout') || 'note';

			// Extract title from .callout-title-inner
			const titleInner = node.querySelector('.callout-title-inner');
			const title = titleInner?.textContent?.trim() || type.charAt(0).toUpperCase() + type.slice(1);

			// Remove the title from the DOM so it doesn't appear in content
			const titleDiv = node.querySelector('.callout-title');
			if (titleDiv) {
				titleDiv.remove();
			}

			// Re-convert without the title element
			const contentEl = node.querySelector('.callout-content');
			const calloutContent = contentEl
				? turndownService.turndown(contentEl.innerHTML)
				: turndownService.turndown(node.innerHTML);

			const lines = calloutContent.trim().split('\n');
			const quotedContent = lines.map(line => `> ${line}`).join('\n');

			return `\n\n> [!${type}] ${title}\n${quotedContent}\n\n`;
		}
	});

	function handleNestedEquations(element: GenericElement): string {
		const mathElements = element.querySelectorAll('math[alttext]');
		if (mathElements.length === 0) return '';

		return Array.from(mathElements).map(mathElement => {
			const alttext = mathElement.getAttribute('alttext');
			if (alttext) {
				// Check if it's an inline or block equation
				const isInline = mathElement.closest('.ltx_eqn_inline') !== null;
				return isInline ? `$${alttext.trim()}$` : `\n$$\n${alttext.trim()}\n$$`;
			}
			return '';
		}).join('\n\n');
	}

	function cleanupTableHTML(element: GenericElement): string {
		const allowedAttributes = ['src', 'href', 'style', 'align', 'width', 'height', 'rowspan', 'colspan', 'bgcolor', 'scope', 'valign', 'headers'];
		
		const cleanElement = (element: Element) => {
			Array.from(element.attributes).forEach(attr => {
				if (!allowedAttributes.includes(attr.name)) {
					element.removeAttribute(attr.name);
				}
			});
			element.childNodes.forEach(child => {
				if (isElement(child)) {
					cleanElement(child);
				}
			});
		};

		// Create a clone of the table to avoid modifying the original DOM
		const tableClone = element.cloneNode(true) as HTMLTableElement;
		cleanElement(tableClone);

		// outerHTML encodes & as &amp;, which breaks LaTeX alignment
		// characters inside math delimiters. Decode common entities since
		// the output goes into markdown, not back through an HTML parser.
		return tableClone.outerHTML
			.replace(/&amp;/g, '&')
			.replace(/&lt;/g, '<')
			.replace(/&gt;/g, '>');
	}

	function extractLatex(element: GenericElement): string {
		let latex = element.getAttribute('data-latex');
		const alttext = element.getAttribute('alttext');
		if (latex) {
			return latex.trim();
		} else if (alttext) {
			return alttext.trim();
		}
		// Fallback: convert MathML → LaTeX for renderers like MathJax SVG that embed no LaTeX.
		// Fails silently when mathml-to-latex is unavailable (core bundle).
		if (element.nodeName.toLowerCase() === 'math') {
			try {
				const { MathMLToLaTeX } = require('mathml-to-latex');
				return MathMLToLaTeX.convert(`<math>${element.innerHTML}</math>`).trim();
			} catch (e) {
				// not available or conversion failed
			}
		}
		return '';
	}

	try {
		// Strip <wbr> tags — word break opportunity hints that are invisible in
		// browsers but would insert unwanted spaces during Turndown conversion.
		content = content.replace(/<wbr\s*\/?>/gi, '');

		let markdown = turndownService.turndown(content);

		// Remove the title from the beginning of the content if it exists
		const titleMatch = markdown.match(/^# .+\n+/);
		if (titleMatch) {
			markdown = markdown.slice(titleMatch[0].length);
		}

		// Remove any empty links e.g. [](example.com) that remain, along with surrounding newlines
		// But don't affect image links like ![](image.jpg)
		markdown = markdown.replace(/\n*(?<!!)\[]\([^)]+\)\n*/g, '');

		// Add a space between exclamation marks and image syntax ![
		// e.g. "Yey!![IMG](url)" becomes "Yey! ![IMG](url)" to prevent
		// the parser from misinterpreting the ! as part of the image markup.
		// Also handles linked images: "Yey![![IMG](src)](href)"
		markdown = markdown.replace(/!(?=!\[|\[!\[)/g, '! ');

		// Remove any consecutive newlines more than two
		markdown = markdown.replace(/\n{3,}/g, '\n\n');

		// Append footnotes at the end of the document
		if (Object.keys(footnotes).length > 0) {
			markdown += '\n\n---\n\n';
			for (const [id, content] of Object.entries(footnotes)) {
				markdown += `[^${id}]: ${content}\n\n`;
			}
		}
		
		return markdown.trim();
	} catch (error) {
		console.error('Error converting HTML to Markdown:', error);
		console.log('Problematic content:', content.substring(0, 1000) + '...');
		return `Partial conversion completed with errors. Original HTML:\n\n${content}`;
	}
}

export function toMarkdown(
	result: DefuddleResponse,
	options: DefuddleOptions,
	url: string
): void {
	if (options.markdown) {
		result.content = createMarkdownContent(result.content, url);
	} else if (options.separateMarkdown) {
		result.contentMarkdown = createMarkdownContent(result.content, url);
	}
}
