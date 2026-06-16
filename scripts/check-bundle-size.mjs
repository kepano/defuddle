// Fails CI if a browser bundle exceeds its gzip budget.
// Budgets have ~10% headroom over the current size; bump them deliberately
// in the same PR that grows a bundle, so size regressions are never silent.
import { gzipSync } from 'node:zlib';
import { readFileSync } from 'node:fs';

const BUDGETS_KB = {
	'dist/index.js': 92,       // core UMD bundle (defuddle)
	'dist/index.full.js': 215, // full bundle with math (defuddle/full)
};

let failed = false;
for (const [file, budgetKb] of Object.entries(BUDGETS_KB)) {
	const gzipKb = gzipSync(readFileSync(file)).length / 1024;
	const ok = gzipKb <= budgetKb;
	failed ||= !ok;
	const status = ok ? 'ok' : 'OVER';
	console.log(
		`${ok ? '✓' : '✗'} ${file}  ${gzipKb.toFixed(1)} KB gzip / ${budgetKb} KB budget  [${status}]`
	);
}

if (failed) {
	console.error('\nBundle size budget exceeded. Reduce size or raise the budget in scripts/check-bundle-size.mjs.');
	process.exit(1);
}
console.log('\nAll bundles within budget.');
