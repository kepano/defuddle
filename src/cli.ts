#!/usr/bin/env node

import { Command } from 'commander';
import { Defuddle } from './node';
import { writeFile, readFile } from 'fs/promises';
import { resolve } from 'path';
import { parseLinkedomHTML } from './utils/linkedom-compat';
import { countWords } from './utils';
import { getInitialUA, fetchPage, extractRawMarkdown, cleanMarkdownContent, BOT_UA } from './fetch';

export interface ParseOptions {
	output?: string;
	markdown?: boolean;
	md?: boolean;
	json?: boolean;
	debug?: boolean;
	property?: string;
	lang?: string;
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
		const initialUA = getInitialUA(source);
		html = await fetchPage(source, initialUA, options.lang);
	} else {
		const filePath = resolve(process.cwd(), source);
		html = await readFile(filePath, 'utf-8');
	}

	const doc = parseLinkedomHTML(html);
	let result = await Defuddle(doc, url, defuddleOpts);

	// If no content was extracted from a URL, retry with bot UA.
	// Some sites (e.g. Obsidian Publish) serve pre-rendered content to bots.
	if (isUrl && result.wordCount === 0) {
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
		output = result.content;
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
		.option('-p, --property <name>', 'Extract a specific property (e.g., title, description, domain)')
		.option('--debug', 'Enable debug mode')
		.option('-l, --lang <code>', 'Preferred language (BCP 47, e.g. en, fr, ja)')
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
