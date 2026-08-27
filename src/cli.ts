#!/usr/bin/env node

import { Command } from 'commander';
import { Defuddle } from './node';
import { writeFile, readFile } from 'fs/promises';
import { resolve } from 'path';
import { parseLinkedomHTML } from './utils/linkedom-compat';
import { countWords } from './utils';
import { buildFrontmatter } from './frontmatter';
import { getInitialUA, fetchPage, extractRawMarkdown, cleanMarkdownContent, BOT_UA } from './fetch';

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
	// Removal toggles — default to enabled (the existing pipeline). The
	// `--no-*` flag form lets users disable each step individually so they
	// can inspect what would otherwise be stripped. Useful for developing
	// site-specific extractors against a known-clean baseline.
	contentPatterns?: boolean;
	lowScoring?: boolean;
	exactSelectors?: boolean;
	partialSelectors?: boolean;
	hiddenElements?: boolean;
	smallImages?: boolean;
	// `removeImages` defaults to `false` in the API; expose as positive flag.
	removeImages?: boolean;
}

interface ParseResult {
	output: string;
}

// ANSI color helpers (avoids chalk dependency which is ESM-only)
const useColor = process.stdout.isTTY ?? false;
const ansi = {
	red: (s: string) => useColor ? `\x1b[31m${s}\x1b[39m` : s,
	green: (s: string) => useColor ? `\x1b[32m${s}\x1b[39m` : s,
};

// Read version from package.json
const version = require('../package.json').version;

// Helper: emit a single-key object only when the value is defined. Used to
// avoid passing `undefined` into the defuddle options spread, which would
// override the library's default with `undefined`.
function maybe<K extends string, V>(key: K, value: V | undefined): Partial<Record<K, V>> {
	return value === undefined ? {} : ({ [key]: value } as Record<K, V>);
}

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

	// Build defuddle options. Removal toggles are only included when the
	// caller actually specified a value — Defuddle's internal merge does
	// `{ defaults, ...this.options }`, so an explicit `undefined` would
	// shadow the default `true` and silently disable the removal pass.
	const defuddleOpts = {
		debug: options.debug,
		markdown: options.markdown,
		separateMarkdown: options.markdown || options.json,
		language: options.lang,
		...maybe('removeContentPatterns', options.contentPatterns),
		...maybe('removeLowScoring', options.lowScoring),
		...maybe('removeExactSelectors', options.exactSelectors),
		...maybe('removePartialSelectors', options.partialSelectors),
		...maybe('removeHiddenElements', options.hiddenElements),
		...maybe('removeSmallImages', options.smallImages),
		...maybe('removeImages', options.removeImages),
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
		}, null, 2);
	} else {
		output = options.frontmatter ? buildFrontmatter(result, url) + result.content : result.content;
	}

	return { output };
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
		// Removal toggles. Each `--no-*` flag disables a single removal pass
		// so users (especially extractor authors) can isolate which step is
		// stripping a given element.
		.option('--no-content-patterns', 'Keep boilerplate patterns (read time, breadcrumb, metadata lists, newsletter signups, etc.)')
		.option('--no-low-scoring', 'Keep low-scoring elements (skip the content scoring pass)')
		.option('--no-exact-selectors', 'Keep elements matched by the exact-selector denylist (ads, scripts, JW Player, etc.)')
		.option('--no-partial-selectors', 'Keep elements matched by the partial-selector denylist (class/id containing "ad-", "sidebar", "comment", etc.)')
		.option('--no-hidden-elements', 'Keep CSS-hidden elements (display:none, visibility:hidden, opacity:0)')
		.option('--no-small-images', 'Keep small images (skip the <100px image filter)')
		.option('--remove-images', 'Remove all images, picture, and figure elements')
		.action(async (source: string | undefined, options: ParseOptions) => {
			try {
				const { output } = await parseSource(source, options);

				// Handle output
				if (options.output) {
					const outputPath = resolve(process.cwd(), options.output);
					await writeFile(outputPath, output, 'utf-8');
					console.log(ansi.green(`Output written to ${options.output}`));
				} else {
					console.log(output);
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
