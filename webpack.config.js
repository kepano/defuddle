const path = require('path');

const commonConfig = {
	mode: process.env.NODE_ENV === 'production' ? 'production' : 'development',
	devtool: process.env.NODE_ENV === 'production' ? false : 'source-map',
	module: {
		rules: [
			{
				test: /\.tsx?$/,
				use: 'ts-loader',
				exclude: /node_modules/,
			},
		],
	},
	resolve: {
		extensions: ['.tsx', '.ts', '.js'],
	},
	optimization: {
		usedExports: true,
	},
	experiments: {
		outputModule: true
	}
};

const coreConfig = {
	...commonConfig,
	entry: './src/index.ts',
	output: {
		filename: 'index.js',
		path: path.resolve(__dirname, 'dist'),
		library: {
			type: 'module'
		}
	},
	target: 'web'
};

const fullConfig = {
	...commonConfig,
	entry: './src/index.full.ts',
	output: {
		filename: 'index.full.js',
		path: path.resolve(__dirname, 'dist'),
		library: {
			type: 'module'
		}
	},
	target: 'web'
};

module.exports = [coreConfig, fullConfig]; 