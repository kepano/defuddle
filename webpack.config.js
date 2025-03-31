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
	}
};

const webConfig = {
	...commonConfig,
	experiments: {
		outputModule: true
	}
};

const coreConfig = {
	...webConfig,
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
	...webConfig,
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

const nodeConfig = {
	...commonConfig,
	entry: './src/node.ts',
	output: {
		filename: 'node.js',
		path: path.resolve(__dirname, 'dist'),
		library: {
			type: 'commonjs2'
		}
	},
	target: 'node'
};

module.exports = [coreConfig, fullConfig, nodeConfig]; 