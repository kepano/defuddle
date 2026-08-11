import { isTextNode, isElement, countWords } from '../utils';

// Class patterns where the prefix states "what follows is the language".
// CommonMark, Prism and highlight.js all use these, so the page is declaring
// the language rather than hinting at it: the captured value is validated by
// shape (LANG_TOKEN_RE) instead of membership in CODE_LANGUAGES, which would
// silently drop any language the list happens not to mention.
const EXPLICIT_LANGUAGE_PATTERNS = [
	/^language-([\w.+#-]+)$/,    // language-shellsession
	/^lang-([\w.+#-]+)$/,        // lang-hcl
	/^syntax-([\w.+#-]+)$/,      // syntax-jsonc

	// fallback, also covers SyntaxHighlighter's brush- prefix
	/(?:^|\s)(?:language|lang|brush|syntax)-([\w.+#-]+)(?:\s|$)/i
];

// Class patterns where the captured value is a guess. These also match layout
// classes — "code-container", "highlight-line", "line-code" — so the value is
// only used when it is a language we already know about.
const AMBIGUOUS_LANGUAGE_PATTERNS = [
	/^(\w+)-code$/,              // javascript-code
	/^code-(\w+)$/,              // code-javascript
	/^code-snippet__(\w+)$/,     // code-snippet__javascript
	/^highlight-(\w+)$/,         // highlight-javascript
	/^(\w+)-snippet$/            // javascript-snippet
];

// Shape of a language name: one word, optionally joined to a second by a
// single hyphen or underscore ("objective-c", "shell-session"), allowing the
// punctuation real names contain ("c++", "f#", "asp.net"). The single-separator
// limit is what keeps multi-word layout classes out: "language-in-header-enabled"
// and "syntax-highlighter-line-number" both appear in the wild and would
// otherwise be read as languages.
const LANG_TOKEN_RE = /^[a-z][a-z0-9.+#]{0,19}(?:[-_][a-z0-9.+#]{1,19})?$/;

// Tokens carried by the explicit patterns that do not name a programming
// language. Emitting them would tag a fence with something no highlighter
// understands.
const NON_LANGUAGE_TOKENS = new Set([
	// Explicit "no highlighting" markers.
	'none', 'plain', 'plaintext', 'text', 'txt', 'undefined', 'null', 'auto',
	// Structural words that appear as `lang-code`, `syntax-example`, etc.
	'code', 'snippet', 'example', 'output', 'unknown', 'default',
	// BCP 47 primary subtags: `lang-en`, `language-pt-br` mark natural
	// language, not source code. Subtags that are also language aliases are
	// left out so they keep resolving: 'cs', 'sh', 'ts', 'md' and 'rb' are
	// matched by CODE_LANGUAGES first, while 'go' and 'pl' are absent from
	// both sets and pass on shape — a `language-` class naming those far
	// more often means Go or Perl than Czech or Polish.
	'ar', 'bg', 'bn', 'ca', 'da', 'de', 'el', 'en', 'es', 'et', 'eu', 'fa',
	'fi', 'fr', 'he', 'hi', 'hr', 'hu', 'id', 'it', 'ja', 'ko', 'lt', 'lv',
	'ms', 'nb', 'nl', 'nn', 'no', 'pt', 'ro', 'ru', 'sk', 'sl', 'sr', 'sv',
	'th', 'tr', 'uk', 'ur', 'vi', 'zh'
]);

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

// Resolve the value captured by an EXPLICIT_LANGUAGE_PATTERN. Known aliases
// are taken as-is so nothing that worked before changes; anything else is
// accepted on shape alone, which is the point — the page said it was a
// language, and a fixed list cannot keep up with every highlighter.
const resolveDeclaredLanguage = (token: string): string => {
	const value = token.toLowerCase();
	if (CODE_LANGUAGES.has(value)) return value;
	if (NON_LANGUAGE_TOKENS.has(value)) return '';

	// Prism's diff-highlight plugin declares `language-diff-<lang>`. The block
	// is a diff, and no renderer resolves the combined token.
	if (value.startsWith('diff-')) return 'diff';

	// Locale forms with a region or script subtag: `pt-br`, `zh-hans`,
	// `sr-latn`. Checked on the primary subtag, and only for a two-letter
	// primary, so hyphenated language names like `objective-c` are unaffected.
	const regional = value.match(/^([a-z]{2})-[a-z]{2,8}$/);
	if (regional && NON_LANGUAGE_TOKENS.has(regional[1])) return '';

	return LANG_TOKEN_RE.test(value) ? value : '';
};

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

			// Remove UI buttons (copy, fullscreen, etc.) added by sites
			// like Discourse, GitHub, etc. These survive normal button
			// removal because elements inside <pre>/<code> are protected.
			el.querySelectorAll('button, [class*="codeblock-button"]').forEach(btn => btn.remove());

			// Language labels and toolbars placed beside <code> inside the <pre>.
			// Utility-first CSS names classes after appearance, not role, so a
			// Tailwind label reads class="float-end absolute top-0" and matches
			// none of the name-based patterns below. Structure is the reliable
			// signal instead: once a <pre> contains a <code>, the code lives in
			// that <code> and short element siblings of it are chrome.
			const pre = el.tagName === 'PRE' ? el : el.querySelector('pre');
			const siblingCodeEl = pre?.querySelector('code');
			if (pre && siblingCodeEl) {
				const candidates = Array.from(pre.children).filter(child =>
					child !== siblingCodeEl
					&& !child.contains(siblingCodeEl)
					&& (child.tagName === 'DIV' || child.tagName === 'SPAN')
				);

				// Siblings repeated with the same tag and class are a rendering
				// pattern — one element per line — rather than chrome, which
				// appears once. Class names alone do not reveal this: Chroma
				// marks its line spans "cl", with no "line" anywhere in the name.
				const occurrences = new Map<string, number>();
				const keyOf = (child: Element) => `${child.tagName}.${child.getAttribute('class') || ''}`;
				candidates.forEach(child => {
					const key = keyOf(child);
					occurrences.set(key, (occurrences.get(key) || 0) + 1);
				});

				candidates.forEach(child => {
					if ((occurrences.get(keyOf(child)) || 0) > 1) return;
					// Never touch anything holding real content.
					if (child.querySelector('code, pre, table, img, svg')) return;
					// Per-line rendering (Shiki, rehype-pretty-code, Expressive
					// Code), whether the element is a line itself or wraps them.
					if (child.matches('[data-line], [data-line-number], .line, [class*="line"], .ec-line')) return;
					if (child.querySelector('[data-line], [data-line-number], .line, .ec-line')) return;
					// Shell prompt markers ("$", ">", "❯") are punctuation set
					// beside the command rather than a label over the block.
					const text = (child.textContent || '').trim();
					if (!/[a-z0-9]/i.test(text)) return;
					if (countWords(text) <= 5) child.remove();
				});
			}

			// Runs after button removal so header text is just labels, not "bash Copy".
			el.querySelectorAll(
				'[class*="header"], [class*="toolbar"], [class*="titlebar"], [class*="title-bar"]'
			).forEach(elem => {
				const tag = elem.tagName;
				if (tag !== 'DIV' && tag !== 'SPAN') return;
				const lineAncestor = elem.closest?.('[data-line], .line');
				if (lineAncestor && el.contains(lineAncestor)) return;
				if (elem.querySelector('[data-line], .line, pre')) return;
				const text = (elem.textContent || '').trim();
				if (countWords(text) <= 5) {
					elem.remove();
				}
			});

			// `trustDeclarations` is only set for the block itself and for
			// pre/code elements. A `language-` class there names the code; the
			// same class on an arbitrary wrapper up the tree usually does not
			// — "language-switcher", "syntax-highlighter" and "lang-english"
			// are all ordinary markup — so those keep going through the
			// whitelist, which is what made them harmless before.
			const getCodeLanguage = (element: Element, trustDeclarations: boolean): string => {
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
					const lowerClassName = className.toLowerCase();

					for (const pattern of EXPLICIT_LANGUAGE_PATTERNS) {
						const match = lowerClassName.match(pattern);
						if (!match || !match[1]) continue;
						const declared = trustDeclarations
							? resolveDeclaredLanguage(match[1])
							: (CODE_LANGUAGES.has(match[1]) ? match[1] : '');
						if (declared) return declared;
					}

					for (const pattern of AMBIGUOUS_LANGUAGE_PATTERNS) {
						const match = lowerClassName.match(pattern);
						if (match && match[1] && CODE_LANGUAGES.has(match[1])) {
							return match[1];
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
				language = getCodeLanguage(
					currentElement,
					currentElement === el
						|| currentElement.tagName === 'PRE'
						|| currentElement.tagName === 'CODE'
				);

				if (!language && currentElement === el) {
					// Prefer a code element that already has language attributes;
					// fall back to the first code element if none found.
					// (In table-based layouts like Hugo/Chroma, the first <code>
					// is the line-number column and has no language attribute.)
					const codeEl = currentElement.querySelector('code[data-lang], code[class*="language-"]')
						|| currentElement.querySelector('code');
					if (codeEl) {
						language = getCodeLanguage(codeEl, true);
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
