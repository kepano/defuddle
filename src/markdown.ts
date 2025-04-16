import TurndownService from 'turndown';
import { NODE_TYPE } from './constants';

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
		cells?: ArrayLike<{
			innerHTML?: string;
		}>;
	}>;
	parentNode?: GenericElement | null;
	nextSibling?: GenericElement | null;
	nodeName: string;
	innerHTML?: string;
	children?: ArrayLike<GenericElement>;
	cloneNode: (deep?: boolean) => Node;
	textContent?: string | null;
	attributes?: NamedNodeMap;
	className?: string;
	tagName?: string;
	nodeType: number;
	closest?: (selector: string) => Element | null;
};

// Helper functions for type assertions
function isGenericElement(node: unknown): node is GenericElement {
	return node !== null && typeof node === 'object' && 'getAttribute' in node;
}

function isElement(node: Node): node is Element {
	return node.nodeType === NODE_TYPE.ELEMENT_NODE;
}

function asGenericElement(node: any): GenericElement {
	return node as unknown as GenericElement;
}

const footnotes: { [key: string]: string } = {};

export function createMarkdownContent(content: string, url: string) {
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
			const rows = Array.from(node.rows || []).map(row => {
				const cells = Array.from(row.cells || []).map(cell => {
					// Remove newlines and trim the content
					let cellContent = turndownService.turndown(cell.innerHTML || '')
						.replace(/\n/g, ' ')
						.trim();
					// Escape pipe characters
					cellContent = cellContent.replace(/\|/g, '\\|');
					return cellContent;
				});
				return `| ${cells.join(' | ')} |`;
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
			while (currentParent && isGenericElement(currentParent) && (currentParent.nodeName === 'UL' || currentParent.nodeName === 'OL')) {
				level++;
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

			const alt = img.getAttribute('alt') || '';
			const src = img.getAttribute('src') || '';
			let caption = '';

			if (figcaption && isGenericElement(figcaption)) {
				const tagSpan = figcaption.querySelector('.ltx_tag_figure');
				const tagText = tagSpan && isGenericElement(tagSpan) ? tagSpan.textContent?.trim() : '';
				
				// Process the caption content, including math elements
				let captionContent = figcaption.innerHTML || '';
				captionContent = captionContent.replace(/<math.*?>(.*?)<\/math>/g, (match, mathContent, offset, string) => {
					const mathElement = new DOMParser().parseFromString(match, 'text/html').body.firstChild;
					const latex = mathElement && isGenericElement(mathElement) ? extractLatex(mathElement) : '';
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

	// Use Obsidian format for YouTube embeds and tweets
	turndownService.addRule('embedToMarkdown', {
		filter: function (node: Node): boolean {
			if (!isGenericElement(node)) return false;
			const src = node.getAttribute('src');
			return !!src && (
				!!src.match(/(?:youtube\.com|youtu\.be)/) ||
				!!src.match(/(?:twitter\.com|x\.com)/)
			);
		},
		replacement: function (content: string, node: Node): string {
			if (!isGenericElement(node)) return content;
			const src = node.getAttribute('src');
			if (src) {
				const youtubeMatch = src.match(/(?:https?:\/\/)?(?:www\.)?(?:youtube\.com|youtu\.be)\/(?:embed\/|watch\?v=)?([a-zA-Z0-9_-]+)/);
				if (youtubeMatch && youtubeMatch[1]) {
					return `\n![[${youtubeMatch[1]}]]\n`;
				}
				const tweetMatch = src.match(/(?:https?:\/\/)?(?:www\.)?(?:twitter\.com|x\.com)\/([^/]+)\/status\/([0-9]+)/);
				if (tweetMatch && tweetMatch[2]) {
					return `\n![[${tweetMatch[2]}]]\n`;
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
			
			// Extract the heading
			const headingNode = node.querySelector('h1, h2, h3, h4, h5, h6');
			const headingContent = headingNode ? turndownService.turndown(headingNode.innerHTML || '') : '';
			
			// Remove the heading from the content
			if (headingNode) {
				headingNode.remove();
			}
			
			// Convert the remaining content
			const remainingContent = turndownService.turndown(node.innerHTML || '');
			
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
					const itemContent = item.innerHTML?.replace(/^<span class="ltx_tag ltx_tag_item">\d+\.<\/span>\s*/, '') || '';
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
					
					const referenceContent = turndownService.turndown(li.innerHTML || '');
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
			return node.nodeType === NODE_TYPE.TEXT_NODE && 
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
			
			const language = codeElement.getAttribute('data-lang') || '';
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

				const isStartOfLine = !prevNode || (prevNode.nodeType === NODE_TYPE.TEXT_NODE && prevNode.textContent?.trim() === '');
				const isEndOfLine = !nextNode || (nextNode.nodeType === NODE_TYPE.TEXT_NODE && nextNode.textContent?.trim() === '');

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

	turndownService.addRule('callout', {
		filter: (node) => {
			return (
				node.nodeName.toLowerCase() === 'div' && 
				isGenericElement(node) &&
				node.classList?.contains('markdown-alert')
			);
		},
		replacement: (content, node) => {
			if (!isGenericElement(node)) return content;
			
			// Get alert type from the class (e.g., markdown-alert-note -> NOTE)
			const alertClasses = Array.from(node.classList ? Object.keys(node.classList) : []);
			const typeClass = alertClasses.find(c => c.startsWith('markdown-alert-') && c !== 'markdown-alert');
			const type = typeClass ? typeClass.replace('markdown-alert-', '').toUpperCase() : 'NOTE';

			// Find the title element and content
			const titleElement = node.querySelector('.markdown-alert-title');
			const contentElement = node.querySelector('p:not(.markdown-alert-title)');
			
			// Extract content, removing the title from it if present
			let alertContent = content;
			if (titleElement && isGenericElement(titleElement) && titleElement.textContent) {
				alertContent = contentElement && isGenericElement(contentElement) ? contentElement.textContent || '' : content.replace(titleElement.textContent, '');
			}

			// Format as Obsidian callout
			return `\n> [!${type}]\n> ${alertContent.trim().replace(/\n/g, '\n> ')}\n`;
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

		return tableClone.outerHTML;
	}

	function extractLatex(element: GenericElement): string {
		// Check if the element is a <math> element and has an alttext attribute
		let latex = element.getAttribute('data-latex');
			let alttext = element.getAttribute('alttext');
			if (latex) {
				return latex.trim();
			} else if (alttext) {
				return alttext.trim();
		}
		return '';
	}

	try {
		let markdown = turndownService.turndown(content);

		// Remove the title from the beginning of the content if it exists
		const titleMatch = markdown.match(/^# .+\n+/);
		if (titleMatch) {
			markdown = markdown.slice(titleMatch[0].length);
		}

		// Remove any empty links e.g. [](example.com) that remain, along with surrounding newlines
		// But don't affect image links like ![](image.jpg)
		markdown = markdown.replace(/\n*(?<!!)\[]\([^)]+\)\n*/g, '');

		// Remove any consecutive newlines more than two
		markdown = markdown.replace(/\n{3,}/g, '\n\n');

		// Append footnotes at the end of the document
		if (Object.keys(footnotes).length > 0) {
			markdown += '\n\n---\n\n';
			for (const [id, content] of Object.entries(footnotes)) {
				markdown += `[^${id}]: ${content}\n\n`;
			}
		}
		
		// Clear the footnotes object for the next conversion
		Object.keys(footnotes).forEach(key => delete footnotes[key]);

		return markdown.trim();
	} catch (error) {
		console.error('Error converting HTML to Markdown:', error);
		console.log('Problematic content:', content.substring(0, 1000) + '...');
		return `Partial conversion completed with errors. Original HTML:\n\n${content}`;
	}
}
