const path = require('path');

const defineConfig = (entry, name, filename) => ({
  module: {
    rules: [
      {
        test: /\.(ts|js)$/,
        enforce: 'pre',
        use: ['minify-html-literals-loader'],
      },
      {
        test: /\.(ts|js)$/,
        exclude: /node_modules/,
        use: {
          loader: 'builtin:swc-loader',
          options: {
            jsc: {
              parser: { syntax: 'typescript', decorators: true },
              transform: { legacyDecorator: false, decoratorMetadata: true },
            },
          },
        },
      },
    ],
  },
  resolve: {
    extensions: ['.ts', '.js'],
    alias: {
      $hwc: path.resolve(__dirname, './src/js/hwc'),
    },
  },
  entry: entry,
  output: {
    path: path.resolve(__dirname, 'dist'),
    filename: filename,
    library: { name: name, type: 'window' },
    iife: true,
  },
});

module.exports = [
  defineConfig('./src/js/hwc/minimal.ts', '0B_MINIMAL', 'js/hwc/minimal.min.js'),
  defineConfig('./src/js/hwc/essential.ts', '0B_ESSENTIAL', 'js/hwc/essential.min.js'),
  defineConfig('./src/js/hwc/full.ts', '0B_FULL', 'js/hwc/full.min.js'),
  defineConfig('./src/js/runtime/main.ts', '0B_RT', 'js/runtime.min.js'),
];
