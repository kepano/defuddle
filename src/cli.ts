#!/usr/bin/env node

import { Command } from 'commander';
import { Defuddle } from './node';
import { writeFile, readFile } from 'fs/promises';
import { resolve } from 'path';
import { parseLinkedomHTML } from './utils/linkedom-compat';
import { countWords } from './utils';
import { buildFrontmatter } from './frontmatter';
import { getInitialUA, fetchPage, extractRawMarkdown, cleanMarkdownContent, BOT_UA } from './fetch';
import type { DebugInfo, DebugRemoval } from './types';

export interface ParseOptions {
	output?: string;
	markdown?: boolean;
	md?: boolean;
	json?: boolean;
	debug?: boolean;
	property?: string;
	lang?: string;
	userAgent?: string;
	frontmatter?: boolean;
}

interface ParseResult {
	output: string;
	/** Human-readable debug log, present only when --debug and not --json. */
	debugLog?: string;
}

// ANSI color helpers (avoids chalk dependency which is ESM-only)
const useColor = process.stdout.isTTY ?? false;
const ansi = {
	red: (s: string) => useColor ? `\x1b[31m${s}\x1b[39m` : s,
	green: (s: string) => useColor ? `\x1b[32m${s}\x1b[39m` : s,
};

// Read version from package.json
const version = require('../package.json').version;

export async function readStdin(input: NodeJS.ReadStream = process.stdin): Promise<string> {
	return new Promise((resolve, reject) => {
		const chunks: string[] = [];
		input.setEncoding('utf8');
		input.on('data', (chunk: string) => {
			chunks.push(chunk);
		});
		input.on('end', () => resolve(chunks.join('')));
		input.on('error', reject);
	});
}

export async function parseSource(source: string | undefined, options: ParseOptions, input: NodeJS.ReadStream = process.stdin): Promise<ParseResult> {
	// Handle --md alias
	if (options.md) {
		options.markdown = true;
	}

	const defuddleOpts = {
		debug: options.debug,
		markdown: options.markdown,
		separateMarkdown: options.markdown || options.json,
		language: options.lang,
	};

	let html: string;
	let url: string | undefined;

	const usesStdin = !source || source === '-';
	const isUrl = !usesStdin && (source.startsWith('http://') || source.startsWith('https://'));

	if (usesStdin) {
		if (input.isTTY) {
			throw new Error('No input source provided. Pass a file path or URL, or pipe HTML to stdin.');
		}
		html = await readStdin(input);
	} else if (isUrl) {
		url = source;
		const initialUA = options.userAgent || getInitialUA(source);
		html = await fetchPage(source, initialUA, options.lang);
	} else {
		const filePath = resolve(process.cwd(), source);
		html = await readFile(filePath, 'utf-8');
	}

	const doc = parseLinkedomHTML(html);
	let result = await Defuddle(doc, url, defuddleOpts);

	// If no content was extracted from a URL, retry with bot UA.
	// Some sites (e.g. Obsidian Publish) serve pre-rendered content to bots.
	// Skipped when the user set a UA explicitly — respect their choice.
	if (isUrl && result.wordCount === 0 && !options.userAgent) {
		try {
			const botHtml = await fetchPage(source, BOT_UA, options.lang);

			// Check for raw markdown before DOM parsing destroys whitespace
			const rawMarkdown = extractRawMarkdown(botHtml);
			if (rawMarkdown) {
				const botDoc = parseLinkedomHTML(botHtml);
				const botResult = await Defuddle(botDoc, url, defuddleOpts);
				botResult.content = cleanMarkdownContent(rawMarkdown);
				botResult.wordCount = countWords(botResult.content);
				result = botResult;
			} else {
				const botDoc = parseLinkedomHTML(botHtml);
				const botResult = await Defuddle(botDoc, url, defuddleOpts);
				if (botResult.wordCount > 0) {
					result = botResult;
				}
			}
		} catch {
			// Bot UA may be blocked — use original result
		}
	}

	// Check if parsing produced meaningful content
	const textContent = parseLinkedomHTML(`<!DOCTYPE html><html><body>${result.content}</body></html>`)
		.body.textContent?.trim() || '';
	if (!textContent) {
		throw new Error(`No content could be extracted from ${usesStdin ? 'stdin' : source}`);
	}

	// Format output
	let output: string;

	if (options.property) {
		const property = options.property;
		if (property in result) {
			output = result[property as keyof typeof result]?.toString() || '';
		} else {
			throw new Error(`Property "${property}" not found in response`);
		}
	} else if (options.json) {
		output = JSON.stringify({
			content: result.content,
			title: result.title,
			description: result.description,
			domain: result.domain,
			favicon: result.favicon,
			image: result.image,
			language: result.language,
			metaTags: result.metaTags,
			parseTime: result.parseTime,
			published: result.published,
			author: result.author,
			site: result.site,
			schemaOrgData: result.schemaOrgData,
			wordCount: result.wordCount,
			...(result.contentMarkdown ? { contentMarkdown: result.contentMarkdown } : {}),
			...(result.variables ? { variables: result.variables } : {}),
			...(result.debug ? { debug: result.debug } : {}),
		}, null, 2);
	} else {
		output = options.frontmatter ? buildFrontmatter(result, url) + result.content : result.content;
	}

	// Surface debug info when --debug was set without --json. The content
	// goes to stdout (unchanged); the debug log goes to stderr so it does
	// not corrupt the primary output stream. We format it here so callers
	// (tests, action wrapper) can route it wherever they want.
	const debugLog = options.debug && !options.json && result.debug
		? formatDebugLog(result.debug)
		: undefined;

	return { output, debugLog };
}

function formatDebugLog(debug: DebugInfo): string {
	const lines: string[] = [];
	lines.push(`# defuddle --debug`);
	lines.push(`contentSelector: ${debug.contentSelector || '(none)'}`);
	lines.push(`removals: ${debug.removals.length}`);
	for (const r of debug.removals) {
		lines.push(formatRemoval(r));
	}
	return lines.join('\n') + '\n';
}

function formatRemoval(r: DebugRemoval): string {
	const parts: string[] = [];
	parts.push(`[${r.step}]`);
	if (r.reason) parts.push(r.reason);
	if (r.selector) parts.push(`(${r.selector})`);
	// `text` is a short preview from the source; keep it on one line.
	const preview = r.text.replace(/\s+/g, ' ').trim();
	parts.push(`— ${preview}`);
	return parts.join(' ');
}

export function createProgram(): Command {
	const program = new Command();

	program
		.name('defuddle')
		.description('Extract article content from web pages')
		.version(version);

	program
		.command('parse')
		.description('Parse HTML content from a file, URL, or stdin')
		.argument('[source]', 'HTML file path, URL, or "-" to read from stdin')
		.option('-o, --output <file>', 'Output file path (default: stdout)')
		.option('-m, --markdown', 'Convert content to markdown format')
		.option('--md', 'Alias for --markdown')
		.option('-j, --json', 'Output as JSON with metadata and content')
		.option('-f, --frontmatter', 'Prepend YAML frontmatter (title, author, source, etc.) to the output')
		.option('-p, --property <name>', 'Extract a specific property (e.g., title, description, domain)')
		.option('--debug', 'Enable debug mode')
		.option('-l, --lang <code>', 'Preferred language (BCP 47, e.g. en, fr, ja)')
		.option('-u, --user-agent <string>', 'Custom User-Agent header for HTTP requests (helps with 403/FORBIDDEN responses)')
		.action(async (source: string | undefined, options: ParseOptions) => {
			try {
				const { output, debugLog } = await parseSource(source, options);

				// Handle output
				if (options.output) {
					const outputPath = resolve(process.cwd(), options.output);
					await writeFile(outputPath, output, 'utf-8');
					console.log(ansi.green(`Output written to ${options.output}`));
				} else {
					console.log(output);
				}

				// In --debug mode without --json, surface the removal log on
				// stderr so it does not interleave with the primary output.
				if (debugLog) {
					process.stderr.write(debugLog);
				}
			} catch (error) {
				console.error(ansi.red('Error:'), error instanceof Error ? error.message : 'Unknown error occurred');
				process.exit(1);
			}
		});

	return program;
}

const program = createProgram();

if (require.main === module) {
	program.parse();
}
