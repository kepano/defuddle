#!/usr/bin/env node

import { Command } from 'commander';
import { Defuddle } from './node';
import { writeFile, readFile } from 'fs/promises';
import { resolve } from 'path';
import { parseLinkedomHTML } from './utils/linkedom-compat';

interface ParseOptions {
	output?: string;
	markdown?: boolean;
	md?: boolean;
	json?: boolean;
	debug?: boolean;
	property?: string;
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
	.action(async (source: string, options: ParseOptions) => {
		try {
			// Handle --md alias
			if (options.md) {
				options.markdown = true;
			}

			let html: string;
			let url: string | undefined;

			// Determine if source is a URL or file path
			if (source.startsWith('http://') || source.startsWith('https://')) {
				url = source;
				const response = await fetch(source);
				if (!response.ok) {
					throw new Error(`Failed to fetch ${source}: ${response.status} ${response.statusText}`);
				}
				html = await response.text();
			} else {
				const filePath = resolve(process.cwd(), source);
				html = await readFile(filePath, 'utf-8');
			}

			const doc = parseLinkedomHTML(html);

			const result = await Defuddle(doc, url, {
				debug: options.debug,
				markdown: options.markdown,
				separateMarkdown: options.markdown || options.md || options.json
			});

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
