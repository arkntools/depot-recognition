import { babel } from '@rollup/plugin-babel';
import externalGlobals from 'rollup-plugin-external-globals';
import copy from 'rollup-plugin-copy';
import del from 'rollup-plugin-delete';

const commonConfig = {
  external: [/^lodash/, /^@arkntools/, 'jimp', 'jszip', 'simple-statistics'],
  output: {
    dir: 'dist',
    format: 'esm',
  },
};

const config = [
  {
    input: 'src/index.js',
    plugins: [
      ...(process.env.ROLLUP_WATCH ? [] : [del({ targets: 'dist/*' })]),
      copy({ targets: [{ src: 'package.json', dest: 'dist' }] }),
      babel({ babelHelpers: 'bundled' }),
    ],
    ...commonConfig,
  },
  {
    input: 'src/worker.js',
    plugins: [
      babel({ babelHelpers: 'bundled' }),
      externalGlobals({
        lodash: '_',
        jimp: 'Jimp',
        jszip: 'JSZip',
        'simple-statistics': 'ss',
        '@arkntools/scripts/dist/ocrad': 'OCRAD',
      }),
    ],
    ...commonConfig,
  },
  {
    input: 'src/tools.js',
    plugins: [babel({ babelHelpers: 'bundled' })],
    ...commonConfig,
  },
];

export default config;
