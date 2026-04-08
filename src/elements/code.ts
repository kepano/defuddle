import { isTextNode, isElement, countWords } from '../utils';

// Language patterns
const HIGHLIGHTER_PATTERNS = [
	/^language-(\w+)$/,          // language-javascript
	/^lang-(\w+)$/,              // lang-javascript
	/^(\w+)-code$/,              // javascript-code
	/^code-(\w+)$/,              // code-javascript
	/^syntax-(\w+)$/,            // syntax-javascript
	/^code-snippet__(\w+)$/,     // code-snippet__javascript
	/^highlight-(\w+)$/,         // highlight-javascript
	/^(\w+)-snippet$/,           // javascript-snippet

	// fallback
	/(?:^|\s)(?:language|lang|brush|syntax)-(\w+)(?:\s|$)/i
];

// Languages to detect in code blocks
const CODE_LANGUAGES = new Set([
	'abap',
	'actionscript',
	'ada',
	'adoc',
	'agda',
	'antlr4',
	'applescript',
	'arduino',
	'armasm',
	'asciidoc',
	'aspnet',
	'atom',
	'bash',
	'batch',
	'c',
	'clojure',
	'cmake',
	'cobol',
	'coffeescript',
	'cpp', 'c++',
	'crystal',
	'csharp', 'cs',
	'dart',
	'django',
	'dockerfile',
	'dotnet',
	'elixir',
	'elm',
	'erlang',
	'fortran',
	'fsharp',
	'gdscript',
	'gitignore',
	'glsl',
	'golang',
	'gradle',
	'graphql',
	'groovy',
	'haskell', 'hs',
	'haxe',
	'hlsl',
	'html',
	'idris',
	'java',
	'javascript', 'js', 'jsx',
	'jsdoc',
	'json', 'jsonp',
	'julia',
	'kotlin',
	'latex',
	'lean', 'lean4',
	'lisp', 'elisp',
	'livescript',
	'lua',
	'makefile',
	'markdown', 'md',
	'markup',
	'masm',
	'mathml',
	'matlab',
	'mongodb',
	'mysql',
	'nasm',
	'nginx',
	'nim',
	'nix',
	'objc',
	'ocaml',
	'pascal',
	'perl',
	'php',
	'postgresql',
	'powershell',
	'prolog',
	'puppet',
	'python',
	'regex',
	'rss',
	'ruby', 'rb',
	'rust',
	'scala',
	'scheme',
	'shell', 'sh',
	'solidity',
	'sparql',
	'sql',
	'ssml',
	'svg',
	'swift',
	'tcl',
	'terraform',
	'tex',
	'toml',
	'typescript', 'ts', 'tsx',
	'unrealscript',
	'verilog',
	'vhdl',
	'webassembly', 'wasm',
	'xml',
	'yaml', 'yml',
	'zig'
]);

// Convert code blocks with different syntax highlighters and line numbers
// to a standard <pre> and <code> element with a language attribute
export const codeBlockRules = [
	{
		selector: [
			// Basic code blocks
			'pre',
			
			// Common syntax highlighter containers
			'div[class*="prismjs"]',
			'.syntaxhighlighter',
			'.highlight',
			'.highlight-source',
			'.wp-block-syntaxhighlighter-code',
			'.wp-block-code',
			'div[class*="language-"]',

			// JetBrains Writerside documentation code blocks
			'.code-block[data-lang]',

			// Verso/Lean docs style highlighted code blocks
			'code.hl.block'
		].join(', '),
		element: 'pre',
		transform: (el: Element, doc: Document): Element => {
			// Helper function to check if an element has specific properties
			const hasHTMLElementProps = (el: Element): boolean => {
				return 'classList' in el && 'getAttribute' in el && 'querySelector' in el;
			};

			if (!hasHTMLElementProps(el)) return el;

			const getCodeLanguage = (element: Element): string => {
				// Check data-lang attribute first
				const dataLang = element.getAttribute('data-lang') || element.getAttribute('data-language') || element.getAttribute('language');
				if (dataLang) {
					return dataLang.toLowerCase();
				}

				// Check class names for patterns and supported languages
				const classNames = Array.from(element.classList || []);
				
				// Check for syntax highlighter specific format
				if (element.classList?.contains('syntaxhighlighter')) {
					const langClass = classNames.find(c => !['syntaxhighlighter', 'nogutter'].includes(c));
					if (langClass && CODE_LANGUAGES.has(langClass.toLowerCase())) {
						return langClass.toLowerCase();
					}
				}

				// Check patterns
				for (const className of classNames) {
					for (const pattern of HIGHLIGHTER_PATTERNS) {
						const match = className.toLowerCase().match(pattern);
						if (match && match[1] && CODE_LANGUAGES.has(match[1].toLowerCase())) {
							return match[1].toLowerCase();
						}
					}
				}

				// If all else fails, check for bare language names
				for (const className of classNames) {
					if (CODE_LANGUAGES.has(className.toLowerCase())) {
						return className.toLowerCase();
					}
				}

				return '';
			};

			// Try to get the language from the element and its ancestors.
			// Only search inside the element itself (not ancestors) to avoid
			// picking up language from already-processed sibling code blocks.
			let language = '';
			let currentElement: Element | null = el;

			while (currentElement && !language) {
				language = getCodeLanguage(currentElement);

				if (!language && currentElement === el) {
					// Prefer a code element that already has language attributes;
					// fall back to the first code element if none found.
					// (In table-based layouts like Hugo/Chroma, the first <code>
					// is the line-number column and has no language attribute.)
					const codeEl = currentElement.querySelector('code[data-lang], code[class*="language-"]')
						|| currentElement.querySelector('code');
					if (codeEl) {
						language = getCodeLanguage(codeEl);
					}
				}

				currentElement = currentElement.parentElement;
			}

			// Detect CodeMirror-based code blocks (e.g. ChatGPT's runnable code blocks).
			// The language is only in the header text, not in class/data attributes.
			const cmContent = el.querySelector('.cm-content');
			if (cmContent && !language) {
				const allDivs = Array.from(el.querySelectorAll('div'));
				for (const div of allDivs) {
					if (div.contains(cmContent)) continue; // skip code area and its ancestors
					const text = (div.textContent || '').trim().toLowerCase();
					if (text && CODE_LANGUAGES.has(text)) {
						language = text;
						break;
					}
				}
			}

			// Extract content from WordPress syntax highlighter
			const extractWordPressContent = (element: Element): string => {
				// Handle WordPress syntax highlighter table format
				const codeContainer = element.querySelector('.syntaxhighlighter table .code .container');
				if (codeContainer) {
					return Array.from(codeContainer.children)
						.map(line => {
							const codeParts = Array.from(line.querySelectorAll('code'))
								.map(code => {
									let text = code.textContent || '';
									if (code.classList?.contains('spaces')) {
										text = ' '.repeat(text.length);
									}
									return text;
								})
								.join('');
							return codeParts || line.textContent || '';
						})
						.join('\n');
				}

				// Handle WordPress syntax highlighter non-table format
				const codeLines = element.querySelectorAll('.code .line');
				if (codeLines.length > 0) {
					return Array.from(codeLines)
						.map(line => {
							const codeParts = Array.from(line.querySelectorAll('code'))
								.map(code => code.textContent || '')
								.join('');
							return codeParts || line.textContent || '';
						})
						.join('\n');
				}

				return '';
			};

			// Recursively extract text content while preserving structure
			const extractStructuredText = (element: Node): string => {
				if (isTextNode(element)) {
					// Skip whitespace-only text nodes between line spans
					// (e.g. rehype-pretty-code / Shiki), since line handling
					// already appends a newline per line.
					if (element.parentElement?.querySelector('[data-line], .line') &&
						!(element.textContent || '').trim()) {
						return '';
					}
					return element.textContent || '';
				}
				
				let text = '';
				if (isElement(element)) {
					// Verso hover tooltips duplicate inferred types/messages;
					// keep the visible code token stream only.
					if (element.matches('.hover-info, .hover-container')) {
						return '';
					}

					// Skip UI chrome injected into <code> elements (e.g. rehype-pretty-copy
					// buttons, injected <style> tags).
					if (element.tagName === 'BUTTON' || element.tagName === 'STYLE') {
						return '';
					}

					// Handle explicit line breaks.
					// Skip <br> that immediately follows a line-based span (e.g. Hexo/Highlight.js
					// `<span class="line">CODE</span><br>`) — the line span already appended '\n'.
					if (element.tagName === 'BR') {
						const prev = element.previousElementSibling;
						if (prev && prev.matches('div[class*="line"], span[class*="line"], .ec-line, [data-line-number], [data-line]')) {
							return '';
						}
						return '\n';
					}

					// Hugo/Chroma line-number spans (<span class="lnt">1\n</span>) live in a
					// separate table column from the code; skip them entirely.
					if (element.matches('span.lnt')) {
						return '';
					}

					// Pygments inline line number spans (<span class="lineno">1</span>)
					// are interspersed directly in the code content; skip them.
					if (element.matches('span.lineno')) {
						return '';
					}

					// react-syntax-highlighter inline line number spans are interspersed
					// directly in the code content; skip them.
					if (element.matches('.react-syntax-highlighter-line-number')) {
						return '';
					}

					// Rouge (Jekyll) line-number gutter lives in a separate table cell;
					// skip it so only the code column is extracted.
					if (element.matches('.rouge-gutter')) {
						return '';
					}

					// Two-child div/span where the first child is all-digits (line number gutter).
					// Some code viewers render each line as a row with a numeric gutter in
					// the first child and the actual code in the second (e.g. flex-row layout,
					// or Chroma inline line numbers: <span style="display:flex"><span>N</span><span>code</span></span>).
					// Without this, extractStructuredText concatenates them as "1AGENTS.md".
					if ((element.tagName === 'DIV' || element.tagName === 'SPAN') && element.children.length === 2) {
						const gutter = (element.children[0].textContent || '').trim();
						if (/^\d+$/.test(gutter)) {
							return extractStructuredText(element.children[1]).replace(/\n$/, '') + '\n';
						}
					}

					// Handle common line-based code formats
					// This covers various syntax highlighter implementations that use
					// divs or spans to represent individual lines
					if (element.matches('div[class*="line"], span[class*="line"], .ec-line, [data-line-number], [data-line]')) {
						// Try to find the actual code content in common structures:
						// 1. A dedicated code container
						const codeContainer = element.querySelector('.code:not(.token), .content:not(.token), [class*="code-"], [class*="content-"]');
						if (codeContainer) {
							return (codeContainer.textContent || '').replace(/\n$/, '') + '\n';
						}
						
						// 2. Line number is in a separate element
						const lineNumber = element.querySelector('.line-number, .gutter, [class*="line-number"], [class*="gutter"]');
						if (lineNumber) {
							const withoutLineNum = Array.from(element.childNodes)
								.filter(node => !lineNumber.contains(node))
								.map(node => extractStructuredText(node))
								.join('');
							return withoutLineNum.replace(/\n$/, '') + '\n';
						}
						
						// 3. Fallback to the entire line content
						return (element.textContent || '').replace(/\n$/, '') + '\n';
					}
					
					element.childNodes.forEach(child => {
						text += extractStructuredText(child);
					});
				}
				return text;
			};

			// Extract content based on element type
			let codeContent = '';
			if (el.matches('.syntaxhighlighter, .wp-block-syntaxhighlighter-code')) {
				codeContent = extractWordPressContent(el);
			}

			// If no content extracted from WordPress format, use structured text extraction.
			// For CodeMirror blocks (e.g. ChatGPT runnable snippets), only extract from
			// .cm-content to avoid mixing in UI chrome (header, copy/run buttons).
			if (!codeContent && cmContent) {
				codeContent = extractStructuredText(cmContent);
			} else if (!codeContent) {
				// If the matched element is a wrapper (not pre/code) that contains a <pre>,
				// extract from the code <pre> to avoid HTML template whitespace leaking in
				// from wrapper elements (e.g. .highlight wrapping a table with line numbers).
				let extractTarget = el;
				if (el.tagName !== 'PRE' && el.tagName !== 'CODE') {
					// Find the <pre> with actual code content (has language-annotated <code>,
					// or contains .line spans). Avoids picking the line-number <pre> in
					// table-based layouts (Chroma, Rouge, etc.).
					const pres = Array.from(el.querySelectorAll('pre'));
					const codePre = pres.find(p =>
						p.querySelector('code[data-lang], code[class*="language-"], .line, [data-line]')
					) || pres.find(p =>
						p.querySelector('span[class]') && !p.classList.contains('lineno')
					);
					if (codePre) {
						extractTarget = codePre;
					}
				}
				codeContent = extractStructuredText(extractTarget);
			}

			// Clean up the content
			const isVersoLeanBlock = el.matches('code.hl.block');
			if (isVersoLeanBlock) {
				// Preserve trailing newlines for Verso blocks so section gaps survive merging.
				codeContent = codeContent
					.replace(/^[ \t]+|[ \t]+$/g, '') // Trim spaces/tabs at boundaries only
					.replace(/\t/g, '    ')          // Convert tabs to spaces
					.replace(/\u00a0/g, ' ')         // Replace non-breaking spaces
					.replace(/^\n+/, '');            // Remove extra newlines at start
			} else {
				codeContent = codeContent
					.replace(/\t/g, '    ')         // Convert tabs to spaces
					.replace(/\u00a0/g, ' ');       // Replace non-breaking spaces

				// Dedent: remove common leading whitespace (e.g. HTML template indentation
				// in non-pre containers like JetBrains Writerside <div class="code-block">).
				// Runs before trimming so the first line's indent is still present.
				const lines = codeContent.split('\n');
				let minIndent = Infinity;
				for (const line of lines) {
					const firstChar = line.search(/\S/);
					if (firstChar > -1) {
						minIndent = Math.min(minIndent, firstChar);
					}
				}
				if (minIndent === Infinity) minIndent = 0;
				if (minIndent > 0) {
					codeContent = lines.map(line => line.slice(minIndent)).join('\n');
				}

				codeContent = codeContent
					.replace(/^\s+|\s+$/g, '')      // Trim start/end whitespace
					.replace(/\n{3,}/g, '\n\n')     // Normalize multiple newlines
					.replace(/^\n+/, '')            // Remove extra newlines at start
					.replace(/\n+$/, '');           // Remove extra newlines at end
			}

			// Remove code block header/toolbar siblings (e.g. filename labels, copy buttons)
			// before replacing, so they don't leak into content when wrappers are flattened.
			// Only remove non-semantic divs/spans, not headings, paragraphs, etc.
			// Check a few levels up since pre may be nested inside wrapper divs.
			let ancestor: Element | null = el;
			for (let i = 0; i < 3 && ancestor; i++) {
				const container: Element | null = ancestor.parentElement;
				if (!container || container.tagName === 'BODY') break;

				// Stop if the container has many children — it's the main
				// content area, not a tight code block wrapper.
				if (container.children.length > 5) break;

				// Don't clean up siblings inside callouts — those are callout
				// structure (title, content), not code block chrome.
				if (container.closest?.('[data-callout]')) break;

				const siblings = Array.from(container.children) as Element[];
				for (const sib of siblings) {
					if (sib.contains(el)) continue;
					const sibTag = sib.tagName;
					if (sibTag !== 'DIV' && sibTag !== 'SPAN') continue;
					const sibText = (sib.textContent || '').trim();
					const sibWords = countWords(sibText);
					if (sibWords <= 5 && !sib.querySelector('pre, code, img, svg, table, h1, h2, h3, h4, h5, h6, p, blockquote, ul, ol, hr')) {
						sib.remove();
					}
				}
				ancestor = container;
			}

			// Create new pre element
			const newPre = doc.createElement('pre');
			if (el.matches('code.hl.block, pre.hl.lean.lean-output')) {
				newPre.setAttribute('data-verso-code', 'true');
			}

			// Create code element
			const code = doc.createElement('code');
			if (language) {
				code.setAttribute('data-lang', language);
				code.setAttribute('class', `language-${language}`);
			}
			code.textContent = codeContent;

			newPre.appendChild(code);
			return newPre;
		}
	}
];
