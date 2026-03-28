import { describe, test, expect } from 'vitest';
import { readFileSync } from 'fs';
import { basename } from 'path';
import DefuddleClass from '../src/index';
import { getFixtures, parseDocument } from './helpers';

describe('Performance', () => {
	const fixtures = getFixtures();

	test('parse time per fixture (total including DOM parsing)', async () => {
		const results: { name: string; parseTime: number; domTime: number; totalTime: number; size: number; profile: Record<string, number> }[] = [];

		for (const { name, path } of fixtures) {
			const html = readFileSync(path, 'utf-8');
			const urlName = basename(path, '.html').replace(/^[a-z]+--/, '');
			const url = `https://${urlName.replace(/:/g, '/')}`;

			const totalStart = performance.now();

			// Measure DOM parsing separately
			const domStart = performance.now();
			const doc = parseDocument(html, url);
			const domTime = performance.now() - domStart;

			// Measure Defuddle parsing
			const defuddleStart = performance.now();
			const defuddle = new DefuddleClass(doc, { url, profile: true });
			const result = await defuddle.parseAsync();
			const defuddleTime = performance.now() - defuddleStart;

			const totalTime = performance.now() - totalStart;

			results.push({
				name,
				parseTime: Math.round(defuddleTime),
				domTime: Math.round(domTime),
				totalTime: Math.round(totalTime),
				size: html.length,
				profile: result.profile ?? {}
			});
		}

		// Sort by totalTime descending
		results.sort((a, b) => b.totalTime - a.totalTime);

		console.log('\n=== Performance Breakdown (ms) ===');
		console.log('  Total    DOM  Parse  Size    Fixture');
		console.log('  -----  -----  -----  -----   -------');
		for (const r of results) {
			const sizeKB = (r.size / 1024).toFixed(0);
			console.log(
				`  ${r.totalTime.toString().padStart(5)}  ${r.domTime.toString().padStart(5)}  ${r.parseTime.toString().padStart(5)}  ${sizeKB.padStart(5)}KB  ${r.name}`
			);
		}

		const totalParse = results.reduce((sum, r) => sum + r.parseTime, 0);
		const totalDom = results.reduce((sum, r) => sum + r.domTime, 0);
		const totalAll = results.reduce((sum, r) => sum + r.totalTime, 0);
		console.log(`\n  Total:  ${totalAll}ms (DOM: ${totalDom}ms, Parse: ${totalParse}ms)  Count: ${results.length}`);
		console.log(`  DOM is ${((totalDom / totalAll) * 100).toFixed(0)}% of total time`);

		// Aggregate per-step totals across all fixtures
		const stepTotals: Record<string, number> = {};
		for (const r of results) {
			for (const [step, ms] of Object.entries(r.profile)) {
				stepTotals[step] = (stepTotals[step] ?? 0) + ms;
			}
		}

		const steps = Object.entries(stepTotals).sort((a, b) => b[1] - a[1]);
		const profileTotal = steps.reduce((sum, [, ms]) => sum + ms, 0);

		console.log('\n=== Per-Step Totals (across all fixtures) ===');
		console.log('    ms    %   Step');
		console.log('  ----  ---   ----');
		for (const [step, ms] of steps) {
			const pct = profileTotal > 0 ? ((ms / profileTotal) * 100).toFixed(0) : '0';
			console.log(`  ${ms.toString().padStart(4)}  ${pct.toString().padStart(3)}%  ${step}`);
		}
		console.log(`  ${profileTotal.toString().padStart(4)}       total`);
	});
});
