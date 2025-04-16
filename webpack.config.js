const path = require('path');
const TerserPlugin = require('terser-webpack-plugin');

module.exports = (env, argv) => {
	const isDevelopment = argv.mode === 'development';

	// Common configuration for both bundles
	const commonConfig = {
		mode: argv.mode || 'production',
		devtool: isDevelopment ? 'source-map' : false,
		resolve: {
			extensions: ['.tsx', '.ts', '.js'],
		},
		module: {
			rules: [
				{
				test: /\.ts$/,
				use: [
					{
					loader: 'ts-loader',
					options: {
						configFile: 'tsconfig.json'
					}
					}
				],
				exclude: /node_modules/
				}
			]
			},
			optimization: {
			// Ensure consistent output in both dev and prod
			moduleIds: 'deterministic',
			// Disable eval
			minimize: !isDevelopment,
			minimizer: [
				new TerserPlugin({
				terserOptions: {
					output: {
					ascii_only: true
					}
				}
				})
			]
		}
	};

	// Core bundle configuration
	const coreConfig = {
		...commonConfig,
		name: 'core',
		entry: './src/index.ts',
		externals: {
			'mathml-to-latex': 'mathml-to-latex',
			'temml': 'temml'
		},
		output: {
			path: path.resolve(__dirname, 'dist'),
			filename: 'index.js',
			library: {
				name: 'Defuddle',
				type: 'umd',
				export: 'default'
			},
			globalObject: 'typeof self !== "undefined" ? self : this'
		},
		target: 'web',
		resolve: {
			...commonConfig.resolve,
			alias: {
				// Alias the math module to use core version
				'./elements/math': path.resolve(__dirname, 'src/elements/math.core.ts')
			}
		}
	};

	// Full bundle configuration
	const fullConfig = {
		...commonConfig,
		name: 'full',
		entry: './src/index.full.ts',
		output: {
				path: path.resolve(__dirname, 'dist'),
				filename: 'index.full.js',
				library: {
				name: 'Defuddle',
				type: 'umd',
				export: 'default'
			},
			globalObject: 'typeof self !== "undefined" ? self : this'
		},
		target: 'web',
		resolve: {
			...commonConfig.resolve,
			alias: {
				// Alias the math module to use full version
				'./elements/math': path.resolve(__dirname, 'src/elements/math.full.ts')
			}
		}
	};

	return [coreConfig, fullConfig];
}; 