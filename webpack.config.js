const path = require('path');
const TerserPlugin = require('terser-webpack-plugin');

module.exports = (env, argv) => {
  const isDevelopment = argv.mode === 'development';

  // Common configuration for both bundles
  const commonConfig = {
    mode: argv.mode || 'production',
    devtool: isDevelopment ? 'inline-source-map' : false,
    resolve: {
      extensions: ['.ts', '.js']
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
    output: {
      path: path.resolve(__dirname, 'dist'),
      filename: 'index.js',
      library: {
        name: 'Defuddle',
        type: 'umd'
      },
      globalObject: 'typeof self !== "undefined" ? self : this'
    },
    resolve: {
      ...commonConfig.resolve,
      alias: {
        // Alias the math module to use core version
        './math': path.resolve(__dirname, 'src/math.core.ts')
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
        type: 'umd'
      },
      globalObject: 'typeof self !== "undefined" ? self : this'
    },
    resolve: {
      ...commonConfig.resolve,
      alias: {
        // Alias the math module to use full version
        './math': path.resolve(__dirname, 'src/math.full.ts')
      }
    }
  };

  return [coreConfig, fullConfig];
}; 