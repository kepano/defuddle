import TurndownService from 'turndown';

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
			if (!(node instanceof HTMLTableElement)) return content;

			// Check if it's an ArXiv equation table
			if (node.classList.contains('ltx_equation') || node.classList.contains('ltx_eqn_table')) {
				return handleNestedEquations(node);
			}

			// Check if the table has colspan or rowspan
			const hasComplexStructure = Array.from(node.querySelectorAll('td, th')).some(cell => 
				cell.hasAttribute('colspan') || cell.hasAttribute('rowspan')
			);

			if (hasComplexStructure) {
				// Clean up the table HTML
				const cleanedTable = cleanupTableHTML(node);
				return '\n\n' + cleanedTable + '\n\n';
			}

			// Process simple tables as before
			const rows = Array.from(node.rows).map(row => {
				const cells = Array.from(row.cells).map(cell => {
					// Remove newlines and trim the content
					let cellContent = turndownService.turndown(cell.innerHTML)
						.replace(/\n/g, ' ')
						.trim();
					// Escape pipe characters
					cellContent = cellContent.replace(/\|/g, '\\|');
					return cellContent;
				});
				return `| ${cells.join(' | ')} |`;
			});

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
			const isTopLevel = !(node.parentNode && (node.parentNode.nodeName === 'UL' || node.parentNode.nodeName === 'OL'));
			return (isTopLevel ? '\n' : '') + content + '\n';
		}
	});

	// Lists with tab indentation
	turndownService.addRule('listItem', {
		filter: 'li',
		replacement: function (content: string, node: Node, options: TurndownService.Options) {
			if (!(node instanceof HTMLElement)) return content;

			// Handle task list items
			const isTaskListItem = node.classList.contains('task-list-item');
			const checkbox = node.querySelector('input[type="checkbox"]') as HTMLInputElement | null;
			let taskListMarker = '';
			
			if (isTaskListItem && checkbox) {
				// Remove the checkbox from content since we'll add markdown checkbox
				content = content.replace(/<input[^>]*>/, '');
				taskListMarker = checkbox.checked ? '[x] ' : '[ ] ';
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
			while (currentParent && (currentParent.nodeName === 'UL' || currentParent.nodeName === 'OL')) {
				level++;
				currentParent = currentParent.parentNode;
			}

			// Add tab indentation based on nesting level, ensuring it's never negative
			const indentLevel = Math.max(0, level - 1);
			prefix = '\t'.repeat(indentLevel) + prefix;

			if (parent instanceof HTMLOListElement) {
				let start = parent.getAttribute('start');
				let index = Array.from(parent.children).indexOf(node as HTMLElement) + 1;
				prefix = '\t'.repeat(level - 1) + (start ? Number(start) + index - 1 : index) + '. ';
			}

			return prefix + taskListMarker + content.trim() + (node.nextSibling && !/\n$/.test(content) ? '\n' : '');
		}
	});

	turndownService.addRule('figure', {
		filter: 'figure',
		replacement: function(content, node) {
			const figure = node as HTMLElement;
			const img = figure.querySelector('img');
			const figcaption = figure.querySelector('figcaption');
			
			if (!img) return content;

			const alt = img.getAttribute('alt') || '';
			const src = img.getAttribute('src') || '';
			let caption = '';

			if (figcaption) {
				const tagSpan = figcaption.querySelector('.ltx_tag_figure');
				const tagText = tagSpan ? tagSpan.textContent?.trim() : '';
				
				// Process the caption content, including math elements
				let captionContent = figcaption.innerHTML;
				captionContent = captionContent.replace(/<math.*?>(.*?)<\/math>/g, (match, mathContent, offset, string) => {
					const mathElement = new DOMParser().parseFromString(match, 'text/html').body.firstChild as Element;
					const latex = extractLatex(mathElement);
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
			if (node instanceof HTMLIFrameElement) {
				const src = node.getAttribute('src');
				return !!src && (
					!!src.match(/(?:youtube\.com|youtu\.be)/) ||
					!!src.match(/(?:twitter\.com|x\.com)/)
				);
			}
			return false;
		},
		replacement: function (content: string, node: Node): string {
			if (node instanceof HTMLIFrameElement) {
				const src = node.getAttribute('src');
				if (src) {
					const youtubeMatch = src.match(/(?:https?:\/\/)?(?:www\.)?(?:youtube\.com|youtu\.be)\/(?:embed\/|watch\?v=)?([a-zA-Z0-9_-]+)/);
					if (youtubeMatch && youtubeMatch[1]) {
						return `![](https://www.youtube.com/watch?v=${youtubeMatch[1]})`;
					}
					const tweetMatch = src.match(/(?:twitter\.com|x\.com)\/.*?(?:status|statuses)\/(\d+)/);
					if (tweetMatch && tweetMatch[1]) {
						return `![](https://x.com/i/status/${tweetMatch[1]})`;
					}
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
			if (!(node instanceof HTMLElement)) return content;
			const href = node.getAttribute('href');
			const title = node.getAttribute('title');
			
			// Extract the heading
			const headingNode = node.querySelector('h1, h2, h3, h4, h5, h6');
			const headingContent = headingNode ? turndownService.turndown(headingNode.innerHTML) : '';
			
			// Remove the heading from the content
			if (headingNode) {
				headingNode.remove();
			}
			
			// Convert the remaining content
			const remainingContent = turndownService.turndown(node.innerHTML);
			
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
			return node.nodeName === 'OL' && node.classList.contains('ltx_enumerate');
		},
		replacement: function(content, node) {
			if (!(node instanceof HTMLElement)) return content;
			
			const items = Array.from(node.children).map((item, index) => {
				if (item instanceof HTMLElement) {
					const itemContent = item.innerHTML.replace(/^<span class="ltx_tag ltx_tag_item">\d+\.<\/span>\s*/, '');
					return `${index + 1}. ${turndownService.turndown(itemContent)}`;
				}
				return '';
			});
			
			return '\n\n' + items.join('\n\n') + '\n\n';
		}
	});

	turndownService.addRule('citations', {
		filter: (node: Node): boolean => {
			if (node instanceof Element) {
				return (
					(node.nodeName === 'SUP' && node.id.startsWith('fnref:'))
				);
			}
			return false;
		},
		replacement: (content, node) => {
			if (node instanceof HTMLElement) {
				if (node.nodeName === 'SUP' && node.id.startsWith('fnref:')) {
					const id = node.id.replace('fnref:', '');
					// Extract only the primary number before any hyphen
					const primaryNumber = id.split('-')[0];
					return `[^${primaryNumber}]`;
				}
			}
			return content;
		}
	});

	// Footnotes list
	turndownService.addRule('footnotesList', {
		filter: (node: Node): boolean => {
			if (node instanceof HTMLOListElement) {
				return (
					node.parentElement?.id === 'footnotes'
				);
			}
			return false;
		},
		replacement: (content, node) => {
			if (node instanceof HTMLElement) {
				const references = Array.from(node.children).map(li => {
					let id;
					if (li.id.startsWith('fn:')) {
						id = li.id.replace('fn:', '');
					} else {
						const match = li.id.split('/').pop()?.match(/cite_note-(.+)/);
						id = match ? match[1] : li.id;
					}
					
					// Remove the leading sup element if its content matches the footnote id
					const supElement = li.querySelector('sup');
					if (supElement && supElement.textContent?.trim() === id) {
						supElement.remove();
					}
					
					const referenceContent = turndownService.turndown(li.innerHTML);
					// Remove the backlink from the footnote content
					const cleanedContent = referenceContent.replace(/\s*↩︎$/, '').trim();
					return `[^${id.toLowerCase()}]: ${cleanedContent}`;
				});
				return '\n\n' + references.join('\n\n') + '\n\n';
			}
			return content;
		}
	});

	// General removal rules for varous website elements
	turndownService.addRule('removals', {
		filter: function (node) {
			if (!(node instanceof HTMLElement)) return false;
			// Remove the Defuddle backlink from the footnote content
			if (node.getAttribute('href')?.includes('#fnref')) return true;
			if (node.classList.contains('footnote-backref')) return true;
			return false;
		},
		replacement: function (content, node) {
			return '';
		}
	});

	turndownService.addRule('handleTextNodesInTables', {
		filter: function (node: Node): boolean {
			return node.nodeType === Node.TEXT_NODE && 
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
			if (!(node instanceof HTMLElement)) return content;
			
			const codeElement = node.querySelector('code');
			if (!codeElement) return content;
			
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
				(node instanceof Element && node.classList && 
				(node.classList.contains('mwe-math-element') || 
				node.classList.contains('mwe-math-fallback-image-inline') || 
				node.classList.contains('mwe-math-fallback-image-display')));
		},
		replacement: (content, node) => {
			if (!(node instanceof Element)) return content;

			let latex = extractLatex(node);

			// Remove leading and trailing whitespace
			latex = latex.trim();

			// Check if the math element is within a table
			const isInTable = node.closest('table') !== null;

			// Check if it's an inline or block math element
			if (!isInTable && (
				node.getAttribute('display') === 'block' || 
				node.classList.contains('mwe-math-fallback-image-display') || 
				(node.parentElement && node.parentElement.classList.contains('mwe-math-element') && 
				node.parentElement.previousElementSibling && 
				node.parentElement.previousElementSibling.nodeName.toLowerCase() === 'p')
			)) {
				return `\n$$\n${latex}\n$$\n`;
			} else {
				// For inline math, ensure there's a space before and after only if needed
				const prevNode = node.previousSibling;
				const nextNode = node.nextSibling;
				const prevChar = prevNode?.textContent?.slice(-1) || '';
				const nextChar = nextNode?.textContent?.[0] || '';

				const isStartOfLine = !prevNode || (prevNode.nodeType === Node.TEXT_NODE && prevNode.textContent?.trim() === '');
				const isEndOfLine = !nextNode || (nextNode.nodeType === Node.TEXT_NODE && nextNode.textContent?.trim() === '');

				const leftSpace = (!isStartOfLine && prevChar && !/[\s$]/.test(prevChar)) ? ' ' : '';
				const rightSpace = (!isEndOfLine && nextChar && !/[\s$]/.test(nextChar)) ? ' ' : '';

				return `${leftSpace}$${latex}$${rightSpace}`;
			}
		}
	});

	turndownService.addRule('katex', {
		filter: (node) => {
			return node instanceof HTMLElement && 
				   (node.classList.contains('math') || node.classList.contains('katex'));
		},
		replacement: (content, node) => {
			if (!(node instanceof HTMLElement)) return content;

			// Try to find the original LaTeX content
			// 1. Check data-latex attribute
			let latex = node.getAttribute('data-latex');
			
			// 2. If no data-latex, try to get from .katex-mathml
			if (!latex) {
				const mathml = node.querySelector('.katex-mathml annotation[encoding="application/x-tex"]');
				latex = mathml?.textContent || '';
			}

			// 3. If still no content, use text content as fallback
			if (!latex) {
				latex = node.textContent?.trim() || '';
			}

			// Determine if it's an inline formula
			const mathElement = node.querySelector('.katex-mathml math');
			const isInline = node.classList.contains('math-inline') || 
				(mathElement && mathElement.getAttribute('display') !== 'block');
			
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
				node.classList.contains('markdown-alert')
			);
		},
		replacement: (content, node) => {
			const element = node as HTMLElement;
			
			// Get alert type from the class (e.g., markdown-alert-note -> NOTE)
			const alertClasses = Array.from(element.classList);
			const typeClass = alertClasses.find(c => c.startsWith('markdown-alert-') && c !== 'markdown-alert');
			const type = typeClass ? typeClass.replace('markdown-alert-', '').toUpperCase() : 'NOTE';

			// Find the title element and content
			const titleElement = element.querySelector('.markdown-alert-title');
			const contentElement = element.querySelector('p:not(.markdown-alert-title)');
			
			// Extract content, removing the title from it if present
			let alertContent = content;
			if (titleElement && titleElement.textContent) {
				alertContent = contentElement?.textContent || content.replace(titleElement.textContent, '');
			}

			// Format as Obsidian callout
			return `\n> [!${type}]\n> ${alertContent.trim().replace(/\n/g, '\n> ')}\n`;
		}
	});

	function handleNestedEquations(table: Element): string {
		const mathElements = table.querySelectorAll('math[alttext]');
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

	function cleanupTableHTML(table: HTMLTableElement): string {
		const allowedAttributes = ['src', 'href', 'style', 'align', 'width', 'height', 'rowspan', 'colspan', 'bgcolor', 'scope', 'valign', 'headers'];
		
		const cleanElement = (element: Element) => {
			Array.from(element.attributes).forEach(attr => {
				if (!allowedAttributes.includes(attr.name)) {
					element.removeAttribute(attr.name);
				}
			});
			
			element.childNodes.forEach(child => {
				if (child instanceof Element) {
					cleanElement(child);
				}
			});
		};

		// Create a clone of the table to avoid modifying the original DOM
		const tableClone = table.cloneNode(true) as HTMLTableElement;
		cleanElement(tableClone);

		return tableClone.outerHTML;
	}

	function extractLatex(element: Element): string {
		// Check if the element is a <math> element and has an alttext attribute
		if (element.nodeName.toLowerCase() === 'math') {
			let latex = element.getAttribute('data-latex');
			let alttext = element.getAttribute('alttext');
			if (latex) {
				return latex.trim();
			} else if (alttext) {
				return alttext.trim();
			}
			console.log('No latex or alttext found for math element:', element);
		}
		return ''; // Return empty string for non-math elements
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
