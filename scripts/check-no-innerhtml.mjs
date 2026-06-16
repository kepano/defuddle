// Enforces the CLAUDE.md rule: never assign innerHTML/outerHTML directly.
// Untrusted HTML must go through parseHTML() in src/utils/dom.ts, which parses
// via <template> (no script execution, no resource loading). Reads are allowed;
// only assignments (a write vector) are banned, and only outside dom.ts.
import { readFileSync, readdirSync } from 'node:fs';
import { join, relative } from 'node:path';

const ROOT = join(import.meta.dirname, '..');
const SRC = join(ROOT, 'src');
const ALLOWED = new Set(['src/utils/dom.ts']);
const ASSIGN = /\.(inner|outer)HTML\s*=(?!=)/;

function walk(dir) {
	const out = [];
	for (const entry of readdirSync(dir, { withFileTypes: true })) {
		const full = join(dir, entry.name);
		if (entry.isDirectory()) out.push(...walk(full));
		else if (entry.name.endsWith('.ts')) out.push(full);
	}
	return out;
}

const violations = [];
for (const file of walk(SRC)) {
	const rel = relative(ROOT, file);
	if (ALLOWED.has(rel)) continue;
	readFileSync(file, 'utf8').split('\n').forEach((line, i) => {
		if (ASSIGN.test(line)) violations.push(`${rel}:${i + 1}  ${line.trim()}`);
	});
}

if (violations.length) {
	console.error('Direct innerHTML/outerHTML assignment is not allowed. Use parseHTML() from src/utils/dom.ts:\n');
	for (const v of violations) console.error('  ' + v);
	process.exit(1);
}
console.log('✓ No direct innerHTML/outerHTML assignment outside src/utils/dom.ts.');
