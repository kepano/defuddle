// Fails CI if the extractor class names are lost in the browser bundles.
// `extractorType` is read from `constructor.name` at runtime (src/defuddle.ts),
// so a minifier that renames the classes reports `a`, `i`, `v` instead of the
// site's name (#414).
import { readFileSync } from 'node:fs';

const BUNDLES = ['dist/index.js', 'dist/index.full.js'];
// One from each bundle half, plus the base every extractor extends.
const EXPECTED = ['BaseExtractor', 'GitHubExtractor', 'YoutubeExtractor'];

let failed = false;
for (const file of BUNDLES) {
	const source = readFileSync(file, 'utf8');
	const missing = EXPECTED.filter((name) => !source.includes(`class ${name}`));
	const ok = missing.length === 0;
	failed ||= !ok;
	console.log(
		`${ok ? '✓' : '✗'} ${file}  ${ok ? 'keeps the extractor class names' : `is missing ${missing.join(', ')}`}  [${ok ? 'ok' : 'OVER'}]`
	);
}

if (failed) {
	console.error(
		'\nExtractor class names must survive minification: extractorType is derived from constructor.name.\n' +
			'Check keep_classnames in webpack.config.js.'
	);
	process.exit(1);
}
console.log('\nExtractor class names are intact.');
