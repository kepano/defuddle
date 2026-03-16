#!/usr/bin/env node

import { Command } from 'commander';
import { Defuddle } from './node';
import { writeFile, readFile } from 'fs/promises';
import { resolve } from 'path';
import { parseLinkedomHTML } from './utils/linkedom-compat';
import { countWords } from './utils';
import { getInitialUA, fetchPage, extractRawMarkdown, cleanMarkdownContent, BOT_UA } from './fetch';

interface ParseOptions {
	output?: string;
	markdown?: boolean;
	md?: boolean;
	json?: boolean;
	debug?: boolean;
	property?: string;
	lang?: string;
}

// ANSI color helpers (avoids chalk dependency which is ESM-only)
const useColor = process.stdout.isTTY ?? false;
const ansi = {
	red: (s: string) => useColor ? `\x1b[31m${s}\x1b[39m` : s,
	green: (s: string) => useColor ? `\x1b[32m${s}\x1b[39m` : s,
};

// Read version from package.json
const version = require('../package.json').version;

const program = new Command();

program
	.name('defuddle')
	.description('Extract article content from web pages')
	.version(version);

program
	.command('parse')
	.description('Parse HTML content from a file or URL')
	.argument('<source>', 'HTML file path or URL to parse')
	.option('-o, --output <file>', 'Output file path (default: stdout)')
	.option('-m, --markdown', 'Convert content to markdown format')
	.option('--md', 'Alias for --markdown')
	.option('-j, --json', 'Output as JSON with metadata and content')
	.option('-p, --property <name>', 'Extract a specific property (e.g., title, description, domain)')
	.option('--debug', 'Enable debug mode')
	.option('-l, --lang <code>', 'Preferred language (BCP 47, e.g. en, fr, ja)')
	.action(async (source: string, options: ParseOptions) => {
		try {
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

			// Determine if source is a URL or file path
			const isUrl = source.startsWith('http://') || source.startsWith('https://');
			if (isUrl) {
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
			const textContent = result.content.replace(/<[^>]*>/g, '').trim();
			if (!textContent) {
				console.error(ansi.red(`Error: No content could be extracted from ${source}`));
				process.exit(1);
			}

			// Format output
			let output: string;

			if (options.property) {
				const property = options.property;
				if (property in result) {
					output = result[property as keyof typeof result]?.toString() || '';
				} else {
					console.error(ansi.red(`Error: Property "${property}" not found in response`));
					process.exit(1);
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

program.parse();
