import { resolve } from 'path';
import { getBabelOutputPlugin } from '@rollup/plugin-babel';
import typescript from '@rollup/plugin-typescript';
import externalGlobals from 'rollup-plugin-external-globals';
import copy from 'rollup-plugin-copy';
import del from 'rollup-plugin-delete';
import dts from 'rollup-plugin-dts';
import write from './plugins/rollup-plugin-write';

const { ROLLUP_WATCH } = process.env;

const defaultConfig = {
  external: [/^lodash/, /^@arkntools/, 'jimp', 'jszip', 'simple-statistics', './tools'],
  plugins: [
    typescript(ROLLUP_WATCH ? {} : { declaration: !ROLLUP_WATCH, declarationDir: 'dist/types' }),
  ],
};

const defaultDtsConfig = {
  plugins: [dts()],
};

const getConfig = name => ({
  ...defaultConfig,
  input: `src/${name}.ts`,
  output: [
    {
      dir: 'dist',
      format: 'es',
      plugins: [
        getBabelOutputPlugin({
          comments: false,
          plugins: ['@babel/plugin-transform-modules-commonjs'],
        }),
      ],
    },
    {
      file: `dist/es/${name}.js`,
      format: 'es',
    },
  ],
});

const dtsConfig = [
  {
    ...defaultDtsConfig,
    input: 'dist/types/tools.d.ts',
    output: {
      file: 'dist/tools.d.ts',
      format: 'es',
    },
  },
  {
    ...defaultDtsConfig,
    input: 'dist/types/lib/index.d.ts',
    output: {
      file: 'dist/lib.d.ts',
      format: 'es',
    },
  },
];

const config = [
  getConfig('index'),
  getConfig('tools'),
  ...(ROLLUP_WATCH ? [] : dtsConfig),
  {
    input: 'src/worker/index.ts',
    external: defaultConfig.external,
    plugins: [
      ...defaultConfig.plugins,
      externalGlobals({
        lodash: '_',
        jimp: 'Jimp',
        jszip: 'JSZip',
        'simple-statistics': 'ss',
        '@arkntools/scripts/dist/ocrad': 'OCRAD',
      }),
    ],
    output: {
      file: 'dist/es/worker.js',
      format: 'es',
    },
  },
];

config[0].plugins.push(
  del({
    targets: 'dist',
    runOnce: true,
  }),
);

if (!ROLLUP_WATCH) {
  config[config.length - 1].plugins.push(
    copy({
      hook: 'buildStart',
      targets: [
        {
          src: ['package.json', 'README.md', 'README_zh.md', 'LICENSE'],
          dest: 'dist',
        },
        {
          src: 'dist/types/index.d.ts',
          dest: 'dist',
        },
        {
          src: 'dist/types/worker/comlinkLoader.d.ts',
          dest: 'dist/es',
        },
      ],
    }),
    write({
      targets: [
        {
          path: 'dist/es/index.d.ts',
          data: `export * from '../index'`,
        },
        {
          path: 'dist/es/tools.d.ts',
          data: `export * from '../tools'`,
        },
        {
          path: 'dist/es/worker.d.ts',
          data: `export * from '../lib'`,
        },
      ],
    }),
    del({
      targets: 'dist/types',
      hook: 'buildEnd',
    }),
  );
}

export default config;
