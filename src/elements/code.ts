import { NODE_TYPE } from '../constants';

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
			'div[class*="language-"]'
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
				const dataLang = element.getAttribute('data-lang') || element.getAttribute('data-language');
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

			// Try to get the language from the element and its ancestors
			let language = '';
			let currentElement: Element | null = el;
			
			while (currentElement && !language) {
				language = getCodeLanguage(currentElement);
				
				// Also check for code elements within the current element
				const codeEl = currentElement.querySelector('code');
				if (!language && codeEl) {
					language = getCodeLanguage(codeEl);
				}
				
				currentElement = currentElement.parentElement;
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
				if (element.nodeType === NODE_TYPE.TEXT_NODE) {
					return element.textContent || '';
				}
				
				let text = '';
				if (element instanceof HTMLElement) {
					// Handle explicit line breaks
					if (element.tagName === 'BR') {
						return '\n';
					}

					// Handle common line-based code formats
					// This covers various syntax highlighter implementations that use
					// divs or spans to represent individual lines
					if (element.matches('div[class*="line"], span[class*="line"], .ec-line, [data-line-number], [data-line]')) {
						// Try to find the actual code content in common structures:
						// 1. A dedicated code container
						const codeContainer = element.querySelector('.code, .content, [class*="code-"], [class*="content-"]');
						if (codeContainer) {
							return (codeContainer.textContent || '') + '\n';
						}
						
						// 2. Line number is in a separate element
						const lineNumber = element.querySelector('.line-number, .gutter, [class*="line-number"], [class*="gutter"]');
						if (lineNumber) {
							const withoutLineNum = Array.from(element.childNodes)
								.filter(node => !lineNumber.contains(node))
								.map(node => extractStructuredText(node))
								.join('');
							return withoutLineNum + '\n';
						}
						
						// 3. Fallback to the entire line content
						return element.textContent + '\n';
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
			
			// If no content extracted from WordPress format, use structured text extraction
			if (!codeContent) {
				codeContent = extractStructuredText(el);
			}

			// Clean up the content
			codeContent = codeContent
				.replace(/^\s+|\s+$/g, '')      // Trim start/end whitespace
				.replace(/\t/g, '    ')         // Convert tabs to spaces
				.replace(/\n{3,}/g, '\n\n')     // Normalize multiple newlines
				.replace(/\u00a0/g, ' ')        // Replace non-breaking spaces
				.replace(/^\n+/, '')            // Remove extra newlines at start
				.replace(/\n+$/, '');           // Remove extra newlines at end

			// Create new pre element
			const newPre = doc.createElement('pre');

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