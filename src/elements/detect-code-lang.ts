type LangRule = { test: (s: string) => boolean; lang: string };

function isMarkdown(s: string): boolean {
	const lines = s.split('\n');
	let headingCount = 0;
	let blockquoteCount = 0;
	for (const line of lines) {
		if (/^#{1,6}\s+/.test(line)) headingCount++;
		if (/^>\s+/.test(line)) blockquoteCount++;
	}
	const linkCount = (s.match(/\[.+?\]\(.*?\)/g) || []).length;
	const fenceCount = (s.match(/^(`{3,}|~{3,})/gm) || []).length;
	const boldItalicCount = (s.match(/(\*\*|__).*?\1/g) || []).length;

	let features = 0;
	if (headingCount >= 2) features++;
	if (linkCount >= 2) features++;
	if (fenceCount >= 1) features++;
	if (boldItalicCount >= 1) features++;
	if (blockquoteCount >= 1) features++;
	if (headingCount >= 1 && linkCount >= 1) features++;
	if (headingCount >= 1 && fenceCount >= 1) features++;
	// Blockquote content (like callout examples) is almost certainly markdown
	if (blockquoteCount >= 2) features += 2;
	if (blockquoteCount >= 1 && linkCount >= 1) features += 1;

	return features >= 2;
}

const LANG_RULES: LangRule[] = [
	// Specific markers first
	{ test: s => /^\s*<\?php\b/i.test(s), lang: 'php' },
	{ test: s => /^\s*<!DOCTYPE\b/i.test(s) || /^\s*<html[\s>]/i.test(s) || /^<!DOCTYPE/i.test(s), lang: 'html' },
	{ test: s => /^\s*<\?xml\b/.test(s), lang: 'xml' },

	// Shebang
	{ test: s => /^#!\/.*(?:bash|sh|zsh)/.test(s), lang: 'bash' },
	{ test: s => /^#!\/.*(?:python|python3)/.test(s), lang: 'python' },
	{ test: s => /^#!\/.*node/.test(s), lang: 'javascript' },

	// Dockerfile
	{ test: s => /^(?:FROM|RUN|CMD|ENTRYPOINT|COPY|ADD|WORKDIR|ENV|EXPOSE)\s+/im.test(s), lang: 'dockerfile' },

	// C / C++
	{ test: s => /^#include\s+[<"].*[>"]/m.test(s) && /\bint\s+main\s*\(/.test(s), lang: 'cpp' },

	// Java
	{ test: s => /\bpublic\s+(?:class|interface|enum)\s+\w+/.test(s) || /\bpublic\s+static\s+void\s+main\s*\(/.test(s), lang: 'java' },

	// Go
	{ test: s => /\bpackage\s+\w+/.test(s) && /\bfunc\s+/.test(s), lang: 'go' },

	// Rust
	{ test: s => /\bfn\s+\w+/.test(s) && /\blet\s+mut\b/.test(s), lang: 'rust' },

	// Ruby
	{ test: s => /\bdef\s+\w+/.test(s) && /\bend\b/.test(s), lang: 'ruby' },
	{ test: s => /\brequire\s+['"]/.test(s) && /\bmodule\s+\w+/.test(s), lang: 'ruby' },

	// Python
	{ test: s => /^\s*(?:def|class)\s+\w+.*:$/m.test(s), lang: 'python' },
	{ test: s => /\bimport\s+\w+/.test(s) && /\bprint\s*\(/.test(s), lang: 'python' },

	// TypeScript / TSX
	{ test: s => /\b(?:interface|type|enum)\s+\w+/.test(s) && /:\s*\w+[\s;,\)]/.test(s), lang: 'typescript' },
	{ test: s => /\bimport\b[\s\S]*?\bfrom\s+['"]/.test(s) && /<[A-Z]\w+[\s/>]/.test(s), lang: 'tsx' },

	// SQL
	{ test: s => /\b(?:SELECT|INSERT|CREATE TABLE|ALTER TABLE|DELETE FROM|UPDATE|DROP TABLE)\b/im.test(s) && /\b(?:FROM|INTO|SET|WHERE)\b/im.test(s), lang: 'sql' },

	// LaTeX
	{ test: s => /\\documentclass\b/.test(s) || /\\(?:section|subsection|begin|end)\{/.test(s), lang: 'latex' },

	// CSS (must come after HTML)
	{ test: s => /[.#@][a-z][\w-]*\s*\{/i.test(s) && /:\s*[^;]+;/.test(s), lang: 'css' },

	// YAML (key: value patterns, no braces/brackets)
	{ test: s => /^\w[\w-]*:\s+/m.test(s) && !/[{};\[\]]/.test(s), lang: 'yaml' },

	// Markdown (heuristic — requires multiple features)
	{ test: isMarkdown, lang: 'markdown' },

	// JSON (must come after YAML to avoid matching `key: "value"` as JSON)
	{ test: s => /^\s*[\[{]/.test(s) && /"[^"]+"\s*:/.test(s) && /[\}\]]\s*$/.test(s), lang: 'json' },

	// Bash fallback: common CLI patterns
	{ test: s => /^\s*\$\s+\w/.test(s) || /\b(?:sudo|apt|brew|npm|yarn|bun|pip|curl|wget|git)\b/.test(s), lang: 'bash' },
];

function detectJavaScript(sample: string): string | null {
	const hasDeclarations = /\b(?:const|let|var)\s+\w+\s*=/.test(sample) || /\bfunction\s+\w+\s*\(/.test(sample);
	if (hasDeclarations) {
		return /<[A-Z]\w+[\s/>]/.test(sample) ? 'jsx' : 'javascript';
	}
	if (/\bimport\b[\s\S]*?\bfrom\s+['"]/.test(sample)) return 'javascript';
	if (/\bexport\s+default\s*\{/.test(sample)) return 'javascript';
	if (/\bdata\s*\(\)/.test(sample) && /\bcomputed\s*:\s*\{/.test(sample)) return 'javascript';
	return null;
}

export function guessCodeLanguage(code: string): string | null {
	const sample = code.split('\n').slice(0, 30).join('\n');
	for (const rule of LANG_RULES) {
		if (rule.test(sample)) return rule.lang;
	}
	return detectJavaScript(sample);
}
