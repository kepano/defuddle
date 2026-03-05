import { defineConfig } from 'vitest/config';
import path from 'path';

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
