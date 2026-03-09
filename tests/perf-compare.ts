/**
 * Fetch real-world articles and parse them with Defuddle.
 * Saves results to tests/perf-results/<branch>/
 *
 * Usage: npx tsx tests/perf-compare.ts <output-dir>
 */
import { writeFileSync, mkdirSync, existsSync } from 'fs';
import { join } from 'path';
import { Defuddle } from '../src/node';
import { toMarkdown } from '../src/markdown';

const URLS = [
	'https://silly.business/blog/we-should-revisit-literate-programming-in-the-agent-era/',
	'https://bret.dk/every-single-board-computer-i-tested-in-2025/',
	'https://basicappleguy.com/basicappleblog/lil-finder-guy',
	'https://offlinemark.com/an-obscure-quirk-of-proc/',
	'https://jonathan-frere.com/posts/reactivity-algorithms/',
	'https://www.ethanhein.com/wp/2019/why-cant-you-tune-your-guitar/',
	'https://utcc.utoronto.ca/~cks/space/blog/programming/LogMessagesAreForOperation',
	'https://mufeedvh.com/posts/i-made-a-programming-language-with-mnms/',
	'https://sqg.dev/blog/java-streams-and-list-types/',
	'https://blog.yoshuawuyts.com/a-grand-vision-for-rust/',
	'https://blog.documentfoundation.org/blog/2026/02/04/libreoffice-26-2-is-here/',
	'https://notes.brooklynzelenka.com/Blog/Notes-on-Writing-Wasm',
	'https://nicole.express/2026/the-apple-that-wasnt.html',
	'https://bryananthonio.com/blog/my-homelab-setup/',
	'https://dailydot.com/mojave-phone-booth-back-number',
	'https://dl.acm.org/doi/10.1145/3676151.3719370',
	'https://agent-safehouse.dev/',
	'https://en.wikipedia.org/wiki/Hacker_News',
	'https://www.paulgraham.com/best.html',
	'https://www.joelonsoftware.com/2000/04/06/things-you-should-never-do-part-i/',
	'https://danluu.com/input-lag/',
	'https://jvns.ca/blog/2024/11/18/how-to-import-a-javascript-library/',
	'https://simonwillison.net/2024/Oct/29/claude-computer-use/',
	'https://martinfowler.com/articles/continuousIntegration.html',
	'https://www.gwern.net/Scaling-hypothesis',
	'https://norvig.com/21-days.html',
	'https://www.lesswrong.com/posts/uMQ3cqWDPHhjtiesc/agi-ruin-a-list-of-lethalities',
	'https://waitbutwhy.com/2015/01/artificial-intelligence-revolution-1.html',
	'https://steveklabnik.com/writing/the-language-strangeness-budget',
	'https://ciechanow.ski/color-spaces/',
	'https://tonsky.me/blog/unicode/',
	'https://ncase.me/trust/',
];

async function fetchHTML(url: string): Promise<string | null> {
	try {
		const controller = new AbortController();
		const timeout = setTimeout(() => controller.abort(), 15000);
		const res = await fetch(url, {
			signal: controller.signal,
			headers: { 'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) Defuddle/1.0' },
			redirect: 'follow',
		});
		clearTimeout(timeout);
		if (!res.ok) return null;
		return await res.text();
	} catch {
		return null;
	}
}

function slugify(url: string): string {
	return url.replace(/^https?:\/\//, '').replace(/[^a-zA-Z0-9]/g, '_').substring(0, 80);
}

async function main() {
	const outputDir = process.argv[2] || 'tests/perf-results/default';
	mkdirSync(outputDir, { recursive: true });

	const results: { url: string; slug: string; parseTime: number; wordCount: number; contentLength: number }[] = [];

	for (const url of URLS) {
		const slug = slugify(url);
		process.stderr.write(`  ${slug.substring(0, 50)}...`);

		const html = await fetchHTML(url);
		if (!html) {
			process.stderr.write(' SKIP (fetch failed)\n');
			continue;
		}

		try {
			const response = await Defuddle(html, url, { separateMarkdown: true });
			const md = response.contentMarkdown || '';

			writeFileSync(join(outputDir, `${slug}.md`), md);
			writeFileSync(join(outputDir, `${slug}.json`), JSON.stringify({
				url,
				parseTime: response.parseTime,
				wordCount: response.wordCount,
				title: response.title,
				author: response.author,
				contentLength: response.content.length,
			}, null, 2));

			results.push({
				url,
				slug,
				parseTime: response.parseTime,
				wordCount: response.wordCount,
				contentLength: response.content.length,
			});

			process.stderr.write(` ${response.parseTime}ms (${response.wordCount} words)\n`);
		} catch (e) {
			process.stderr.write(` ERROR: ${e}\n`);
		}
	}

	// Write summary
	const summary = {
		totalArticles: results.length,
		totalParseTime: results.reduce((s, r) => s + r.parseTime, 0),
		avgParseTime: Math.round(results.reduce((s, r) => s + r.parseTime, 0) / results.length),
		results: results.map(r => ({ url: r.url, parseTime: r.parseTime, wordCount: r.wordCount })),
	};
	writeFileSync(join(outputDir, '_summary.json'), JSON.stringify(summary, null, 2));
	console.log(JSON.stringify(summary, null, 2));
}

main();
