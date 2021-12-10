import { getBabelOutputPlugin } from '@rollup/plugin-babel';
import externalGlobals from 'rollup-plugin-external-globals';
import localResolve from 'rollup-plugin-local-resolve';
import copy from 'rollup-plugin-copy';
import del from 'rollup-plugin-delete';
import write from './plugins/rollup-plugin-write';

const { ROLLUP_WATCH } = process.env;

const external = [/^lodash/, /^@arkntools/, 'jimp', 'jszip', 'simple-statistics', './tools'];
const localResolvePlugin = localResolve();
const babelOutputPlugin = getBabelOutputPlugin({
  comments: false,
  plugins: ['@babel/plugin-transform-modules-commonjs'],
});

const getConfig = name => ({
  input: `dist/${name}.js`,
  external,
  plugins: [
    localResolvePlugin,
    write({
      targets: [
        {
          path: `dist/dist/${name}.d.ts`,
          data: `export * from '../${name}';`,
        },
      ],
    }),
  ],
  output: {
    dir: 'dist/dist',
    format: 'es',
    plugins: [babelOutputPlugin],
  },
});

const workerConfig = {
  input: 'dist/worker/index.js',
  external,
  plugins: [
    localResolvePlugin,
    externalGlobals({
      lodash: '_',
      jimp: 'Jimp',
      jszip: 'JSZip',
      'simple-statistics': 'ss',
      '@arkntools/scripts/dist/ocrad': 'OCRAD',
    }),
    copy({
      copyOnce: true,
      targets: [
        {
          src: ['package.json', 'LICENSE', '*.md'],
          dest: 'dist',
        },
      ],
    }),
  ],
  output: {
    file: ROLLUP_WATCH ? 'dist/worker.js' : 'dist/worker/index.js',
    format: 'es',
  },
};

if (!ROLLUP_WATCH) {
  workerConfig.plugins.push(
    write({
      targets: [
        {
          path: 'dist/worker/index.d.ts',
          data: "export * from '../lib';",
        },
      ],
    }),
    del({
      hook: 'writeBundle',
      targets: ['dist/worker/importScripts.*', 'dist/worker/comlinkLoader.js'],
    }),
  );
}

export default [getConfig('index'), getConfig('tools'), workerConfig];
