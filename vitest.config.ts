import { defineConfig } from 'vitest/config';
import path from 'path';

// Set here rather than in the npm script so it also works on Windows
process.env.TZ = 'UTC';

export default defineConfig({
	resolve: {
		alias: {
			'./elements/math': path.resolve(__dirname, 'src/elements/math.full.ts'),
		},
	},
	test: {
		testTimeout: 30000,
	},
});
