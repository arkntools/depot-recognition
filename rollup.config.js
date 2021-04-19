import { babel } from '@rollup/plugin-babel';
import del from 'rollup-plugin-delete';
import externalGlobals from 'rollup-plugin-external-globals';

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
    plugins: [del({ targets: 'dist/*' }), babel({ babelHelpers: 'bundled' })],
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
