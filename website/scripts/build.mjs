import { build } from 'esbuild';
import { compile } from 'sass';
import { mkdir, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('../', import.meta.url));
await mkdir(`${root}public/build`, { recursive: true });
await build({
	absWorkingDir: root,
	entryPoints: ['src/client/playground.ts', 'src/client/docs.ts', 'src/client/home.ts'],
	outdir: 'public/build',
	bundle: true,
	format: 'esm',
	target: 'es2022',
	minify: true,
});
for (const page of ['playground', 'docs', 'home']) {
	const { css } = compile(`${root}src/${page}-styles/index.scss`, { style: 'compressed' });
	await writeFile(`${root}public/build/${page}.css`, css);
}
