import { getBabelOutputPlugin } from '@rollup/plugin-babel';
import { optimizeLodashImports } from '@optimize-lodash/rollup-plugin';
import externalGlobals from 'rollup-plugin-external-globals';
import localResolve from 'rollup-plugin-local-resolve';
import replace from '@rollup/plugin-replace';
import copy from 'rollup-plugin-copy';
import del from 'rollup-plugin-delete';
import write from './plugins/rollup-plugin-write';

const { ROLLUP_WATCH } = process.env;

const external = [/^lodash/, /^@arkntools/, 'jimp', 'jszip', /^simple-statistics/, './tools'];
const localResolvePlugin = localResolve();
const lodashPlugin = optimizeLodashImports();
const babelOutputPlugin = getBabelOutputPlugin({
  comments: false,
  plugins: ['@babel/plugin-transform-modules-commonjs'],
});

const getConfig = name => ({
  input: `dist/${name}.js`,
  external,
  plugins: [
    localResolvePlugin,
    lodashPlugin,
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

const workerConfigPlugins = [
  localResolvePlugin,
  externalGlobals({
    lodash: '_',
    jimp: 'Jimp',
    jszip: 'JSZip',
    'simple-statistics': 'ss',
    '@arkntools/scripts/dist/ocrad': 'OCRAD',
  }),
];

const workerConfigs = [
  {
    input: 'dist/worker/index.js',
    external,
    plugins: [
      localResolvePlugin,
      lodashPlugin,
      replace({
        values: {
          "from 'jimp';": "from '@arkntools/scripts/dist/jimp4worker';",
          "import { linearRegressionLine, linearRegression } from 'simple-statistics';":
            "import linearRegression from 'simple-statistics/src/linear_regression.js';\nimport linearRegressionLine from 'simple-statistics/src/linear_regression_line.js';",
        },
        delimiters: ['', ''],
        preventAssignment: true,
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
  },
];

if (!ROLLUP_WATCH) {
  workerConfigs.push(
    {
      input: 'dist/worker/index.importScriptsJsDelivr.js',
      external,
      plugins: workerConfigPlugins,
      output: {
        file: 'dist/worker/index.importScriptsJsDelivr.js',
        format: 'es',
      },
    },
    {
      input: 'dist/lib/index.js',
      external,
      plugins: workerConfigPlugins,
      output: {
        file: 'dist/worker/index.noImportScripts.js',
        format: 'es',
      },
    },
  );
  workerConfigs[workerConfigs.length - 1].plugins.push(
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

export default [getConfig('index'), getConfig('tools'), ...workerConfigs];
