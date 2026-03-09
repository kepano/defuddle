import { describe, test, expect } from 'vitest';
import { readFileSync } from 'fs';
import { basename } from 'path';
import { JSDOM, VirtualConsole } from 'jsdom';
import DefuddleClass from '../src/index';
import { Defuddle } from '../src/node';
import { getFixtures } from './helpers';

describe('Performance', () => {
	const fixtures = getFixtures();

	test('parse time per fixture (total including JSDOM)', async () => {
		const results: { name: string; parseTime: number; jsdomTime: number; totalTime: number; size: number }[] = [];

		for (const { name, path } of fixtures) {
			const html = readFileSync(path, 'utf-8');
			const urlName = basename(path, '.html').replace(/^[a-z]+--/, '');
			const url = `https://${urlName.replace(/:/g, '/')}`;

			const totalStart = performance.now();

			// Measure JSDOM parsing separately
			const jsdomStart = performance.now();
			const dom = new JSDOM(html, {
				url,
				storageQuota: 10000000,
				virtualConsole: new VirtualConsole().sendTo(console, { omitJSDOMErrors: true })
			});
			const jsdomTime = performance.now() - jsdomStart;

			// Measure Defuddle parsing
			const defuddleStart = performance.now();
			const defuddle = new DefuddleClass(dom.window.document, { url });
			const result = await defuddle.parseAsync();
			const defuddleTime = performance.now() - defuddleStart;

			const totalTime = performance.now() - totalStart;

			results.push({
				name,
				parseTime: Math.round(defuddleTime),
				jsdomTime: Math.round(jsdomTime),
				totalTime: Math.round(totalTime),
				size: html.length
			});
		}

		// Sort by totalTime descending
		results.sort((a, b) => b.totalTime - a.totalTime);

		console.log('\n=== Performance Breakdown (ms) ===');
		console.log('  Total  JSDOM  Parse  Size    Fixture');
		console.log('  -----  -----  -----  -----   -------');
		for (const r of results) {
			const sizeKB = (r.size / 1024).toFixed(0);
			console.log(
				`  ${r.totalTime.toString().padStart(5)}  ${r.jsdomTime.toString().padStart(5)}  ${r.parseTime.toString().padStart(5)}  ${sizeKB.padStart(5)}KB  ${r.name}`
			);
		}

		const totalParse = results.reduce((sum, r) => sum + r.parseTime, 0);
		const totalJsdom = results.reduce((sum, r) => sum + r.jsdomTime, 0);
		const totalAll = results.reduce((sum, r) => sum + r.totalTime, 0);
		console.log(`\n  Total:  ${totalAll}ms (JSDOM: ${totalJsdom}ms, Parse: ${totalParse}ms)  Count: ${results.length}`);
		console.log(`  JSDOM is ${((totalJsdom / totalAll) * 100).toFixed(0)}% of total time`);
	});
});
