#!/usr/bin/env node

import { Command } from 'commander';
import { Defuddle } from './node';
import { writeFile, readFile, mkdir, access } from 'fs/promises';
import { resolve, dirname, basename, extname, relative } from 'path';
import { parseLinkedomHTML } from './utils/linkedom-compat';
import { countWords } from './utils';
import { getInitialUA, fetchPage, extractRawMarkdown, cleanMarkdownContent, BOT_UA } from './fetch';

interface ParseOptions {
	output?: string;
	markdown?: boolean;
	md?: boolean;
	json?: boolean;
	downloadImages?: boolean;
	imageDir?: string;
	imageDirFromOutput?: boolean;
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

const IMAGE_MARKDOWN_RE = /!\[([^\]]*)\]\(\s*<?([^>\s]+)>?(?:\s+(["'][^"']*["']))?\s*\)/g;

const CLI_CONFIG_FILES = ['defuddle.config.json', '.defuddlerc', '.defuddlerc.json'];

async function loadDefaultCliOptions(): Promise<Partial<ParseOptions>> {
	for (const fileName of CLI_CONFIG_FILES) {
		const configPath = resolve(process.cwd(), fileName);
		try {
			const content = await readFile(configPath, 'utf-8');
			const parsed = JSON.parse(content);
			if (typeof parsed === 'object' && parsed !== null) {
				return parsed as Partial<ParseOptions>;
			}
		} catch {
			// ignore missing/invalid config
		}
	}
	return {};
}

function hasManualCliFlags(argv: string[]): boolean {
	// If user passed any flag (e.g. --markdown, -o), treat as manual override.
	return argv.slice(2).some(arg => arg.startsWith('-'));
}

function sanitizeFileName(raw: string): string {
	return raw
		.trim()
		.normalize('NFKC')
		.replace(/[\/:*?"<>|]+/g, '-')
		.replace(/[^a-zA-Z0-9._-]+/g, '-')
		.replace(/^-+|[-]+$/g, '')
		|| 'image';
}

function getPageName(url?: string, outputPath?: string): string {
	if (url) {
		try {
			const parsed = new URL(url);
			let name = parsed.hostname;
			const lastSegment = basename(parsed.pathname);
			if (lastSegment && lastSegment !== '/') {
				name = `${parsed.hostname}-${lastSegment}`;
			}
			name = sanitizeFileName(name);
			return name || 'homepage';
		} catch {
			// fall through
		}
	}
	if (outputPath) {
		const outBase = basename(outputPath, extname(outputPath));
		return sanitizeFileName(outBase) || 'page';
	}
	return 'homepage';
}

function extensionFromContentType(contentType?: string): string {
	if (!contentType) return '.jpg';
	if (contentType.includes('png')) return '.png';
	if (contentType.includes('gif')) return '.gif';
	if (contentType.includes('webp')) return '.webp';
	if (contentType.includes('svg')) return '.svg';
	if (contentType.includes('jpeg')) return '.jpg';
	if (contentType.includes('bmp')) return '.bmp';
	if (contentType.includes('avif')) return '.avif';
	return '.jpg';
}

async function fileExists(path: string): Promise<boolean> {
	try {
		await access(path);
		return true;
	} catch {
		return false;
	}
}

const MIN_IMAGE_BYTES = 1024;
const FETCH_RETRY_COUNT = 3;
const FETCH_RETRY_DELAY_MS = 1500;

async function fetchImageWithRetry(imageUrl: string): Promise<{ data: Buffer; ext: string } | null> {
	let referer = '';
	try { referer = new URL(imageUrl).origin; } catch { /* ignore */ }

	const headers: Record<string, string> = {
		'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
	};
	if (referer) headers['Referer'] = referer;

	for (let attempt = 1; attempt <= FETCH_RETRY_COUNT; attempt++) {
		try {
			const response = await fetch(imageUrl, { method: 'GET', headers });

			// 4xx: server explicitly rejected — no point retrying
			if (response.status >= 400 && response.status < 500) {
				return null;
			}

			if (!response.ok) {
				throw new Error(`HTTP ${response.status}`);
			}

			// Validate Content-Type: skip non-image responses (e.g. HTML error pages)
			const contentType = response.headers.get('content-type') || '';
			const isImage = contentType.startsWith('image/');
			const isBinary = contentType.includes('application/octet-stream') || contentType === '';
			if (!isImage && !isBinary) {
				return null;
			}

			const arrayBuffer = await response.arrayBuffer();

			// Skip tracking pixels (< 1 KB)
			if (arrayBuffer.byteLength < MIN_IMAGE_BYTES) {
				return null;
			}

			const finalUrl = response.url || imageUrl;
			let ext = extname(new URL(finalUrl).pathname);
			if (!ext) {
				ext = extensionFromContentType(contentType || undefined);
			}

			return { data: Buffer.from(arrayBuffer), ext };
		} catch (err) {
			if (attempt === FETCH_RETRY_COUNT) return null;
			await new Promise(r => setTimeout(r, FETCH_RETRY_DELAY_MS));
		}
	}
	return null;
}

async function downloadImagesInMarkdown(markdown: string, outputPath: string, imageDir: string, baseUrl: string | undefined, pageName: string): Promise<string> {
	const outputDir = dirname(outputPath);
	const saveDir = resolve(outputDir, imageDir || 'attachments');
	await mkdir(saveDir, { recursive: true });

	const urlToLocal = new Map<string, string>();
	let imageIndex = 0;
	let result = '';
	let lastIndex = 0;
	let match: RegExpExecArray | null;
	IMAGE_MARKDOWN_RE.lastIndex = 0;

	while ((match = IMAGE_MARKDOWN_RE.exec(markdown)) !== null) {
		const [fullMatch, altText, rawUrl, titlePart] = match;
		const matchStart = match.index;
		const matchEnd = IMAGE_MARKDOWN_RE.lastIndex;
		result += markdown.slice(lastIndex, matchStart);
		lastIndex = matchEnd;

		let imageUrl = rawUrl;
		if (imageUrl.startsWith('//')) {
			imageUrl = 'https:' + imageUrl;
		}
		if (!imageUrl.startsWith('http://') && !imageUrl.startsWith('https://') && baseUrl) {
			try {
				imageUrl = new URL(imageUrl, baseUrl).toString();
			} catch {
				// leave as-is
			}
		}

		const isRemote = imageUrl.startsWith('http://') || imageUrl.startsWith('https://');
		if (!isRemote || imageUrl.startsWith('data:')) {
			result += fullMatch;
			continue;
		}

		let localPath = urlToLocal.get(imageUrl);
		if (!localPath) {
			const fetched = await fetchImageWithRetry(imageUrl);
			if (!fetched) {
				result += fullMatch;
				continue;
			}

			const { data, ext } = fetched;
			let candidateName = `${pageName}-${imageIndex}${ext || '.jpg'}`;
			candidateName = sanitizeFileName(candidateName);
			if (!extname(candidateName)) {
				candidateName += ext || '.jpg';
			}

			let destination = resolve(saveDir, candidateName);
			let collision = 1;
			while (await fileExists(destination)) {
				candidateName = `${pageName}-${imageIndex}-${collision}${ext || '.jpg'}`;
				candidateName = sanitizeFileName(candidateName);
				destination = resolve(saveDir, candidateName);
				collision += 1;
			}

			try {
				await writeFile(destination, data);
			} catch {
				result += fullMatch;
				continue;
			}

			localPath = relative(outputDir, destination).replace(/\\/g, '/');
			urlToLocal.set(imageUrl, localPath);
			imageIndex += 1;
		}

		const linkTitle = titlePart ? ` ${titlePart}` : '';
		result += `![${altText}](${localPath}${linkTitle})`;
	}

	result += markdown.slice(lastIndex);
	return result;
}

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
	.option('--download-images', 'Download linked images inside markdown and rewrite markup to local paths')
	.option('--image-dir <dir>', 'Local image directory relative to output markdown file (default: attachments)')
	.option('--image-dir-from-output', 'Save images in a folder named after the output markdown file base name')
	.option('-p, --property <name>', 'Extract a specific property (e.g., title, description, domain)')
	.option('--debug', 'Enable debug mode')
	.option('-l, --lang <code>', 'Preferred language (BCP 47, e.g. en, fr, ja)')
	.action(async (source: string, options: ParseOptions) => {
		try {
			// Handle --md alias
			if (options.md) {
				options.markdown = true;
			}

			// Load default CLI options from configuration file if user did not provide manual flags.
			if (!hasManualCliFlags(process.argv)) {
				const defaults = await loadDefaultCliOptions();
				options = {
					...defaults,
					...options,
				};
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
			if (options.downloadImages && !options.markdown) {
				console.error(ansi.red('Error: --download-images can only be used with --markdown')); 
				process.exit(1);
			}

			if (options.downloadImages) {
				if (!options.output) {
					// Auto-generate output filename from URL or source when not specified
					const autoName = getPageName(url, source) + '.md';
					options.output = autoName;
				}
				const outputPath = resolve(process.cwd(), options.output);
				const imageDir = options.imageDirFromOutput
					? basename(outputPath, extname(outputPath))
					: options.imageDir || 'attachments';
				const pageName = getPageName(url, outputPath);
				output = await downloadImagesInMarkdown(output, outputPath, imageDir, url, pageName);
				await writeFile(outputPath, output, 'utf-8');
				console.log(ansi.green(`Output written to ${options.output}`));
			} else if (options.output) {
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
