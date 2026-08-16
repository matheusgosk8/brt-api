/* eslint-disable @typescript-eslint/no-require-imports */
const path = require('path');
const webpack = require('webpack');

module.exports = (env, argv) => {
  const isProd = argv.mode === 'production';

  return {
    mode: isProd ? 'production' : 'development',
    entry: './src/index.ts',
    target: 'node',
    devtool: isProd ? false : 'source-map',
    module: {
      rules: [
        {
          test: /\.ts$/,
          use: 'ts-loader',
          exclude: /node_modules/,
        },
      ],
    },
    resolve: {
      extensions: ['.ts', '.js'],
      alias: {
        '@src': path.resolve(__dirname, 'src'),
      },
    },
    output: {
      path: path.resolve(__dirname, 'dist'),
      filename: 'index.js',
      library: { type: 'commonjs2' },
      clean: true,
      asyncChunks: false,
    },
    // Bundle deps into the zip (no Lambda Layer). Single file for Lambda.
    externals: {},
    optimization: {
      minimize: isProd,
      splitChunks: false,
      runtimeChunk: false,
    },
    plugins: [
      new webpack.optimize.LimitChunkCountPlugin({ maxChunks: 1 }),
      new webpack.IgnorePlugin({ resourceRegExp: /^pg-native$/ }),
    ],
  };
};
