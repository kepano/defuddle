import { describe, expect, test } from 'vitest';
import { spawn } from 'node:child_process';
import { createServer } from 'node:http';
import { join } from 'node:path';

// Load the CLI source in a separate Node process without depending on dist.
const cliScript = `
	const ts = require('typescript');
	const fs = require('node:fs');
	require.extensions['.ts'] = (module, filename) => {
		const { outputText } = ts.transpileModule(fs.readFileSync(filename, 'utf8'), {
			compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020, esModuleInterop: true }
		});
		module._compile(outputText, filename);
	};
	process.on('beforeExit', () => console.log('CLI cleanup complete'));
	require('./src/cli.ts').createProgram().parseAsync(process.argv);
`;

describe('CLI graceful failure', () => {
	test.each([
		{ status: 503, headers: { 'Content-Type': 'text/html' }, error: 'Failed to fetch: 503' },
		{ status: 200, headers: { 'Content-Type': 'text/event-stream' }, error: 'Not an HTML page' },
		{ status: 200, headers: { 'Content-Type': 'text/html', 'Content-Length': '6291456' }, error: 'Page too large' },
	])('exits after rejecting a streaming response: $error', async ({ status, headers, error }) => {
		const server = createServer((_request, response) => {
			response.writeHead(status, headers);
			response.write('streaming body\n');
			const timer = setInterval(() => response.write('still streaming\n'), 100);
			response.on('close', () => clearInterval(timer));
		});
		await new Promise<void>((resolve, reject) => {
			server.once('error', reject);
			server.listen(0, '127.0.0.1', resolve);
		});

		const address = server.address() as { port: number };
		const child = spawn(process.execPath, ['-e', cliScript, 'defuddle', 'parse', `http://127.0.0.1:${address.port}/`], {
			cwd: join(__dirname, '..'),
			env: { ...process.env, NO_PROXY: '*', no_proxy: '*', FORCE_COLOR: '0' },
			stdio: ['ignore', 'pipe', 'pipe'],
		});
		let stdout = '';
		let stderr = '';
		child.stdout.on('data', chunk => stdout += chunk);
		child.stderr.on('data', chunk => stderr += chunk);
		const timeout = setTimeout(() => child.kill('SIGKILL'), 5000);

		try {
			const result = await new Promise<{ code: number | null; signal: string | null }>((resolve, reject) => {
				child.once('error', reject);
				child.once('close', (code, signal) => resolve({ code, signal }));
			});
			expect(stderr).toContain(error);
			expect(result).toEqual({ code: 1, signal: null });
			// A forced process.exit() would skip beforeExit and pending cleanup.
			expect(stdout).toContain('CLI cleanup complete');
		} finally {
			clearTimeout(timeout);
			child.kill();
			server.closeAllConnections();
			await new Promise<void>(resolve => server.close(() => resolve()));
		}
	});
});
