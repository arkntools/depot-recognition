import { babel } from '@rollup/plugin-babel';
import externalGlobals from 'rollup-plugin-external-globals';
import copy from 'rollup-plugin-copy';
import del from 'rollup-plugin-delete';

const { ROLLUP_WATCH, CI } = process.env;

const getConfig = (plugins = []) => ({
  external: [/^lodash/, /^@arkntools/, 'jimp', 'jszip', 'simple-statistics'],
  output: {
    dir: 'dist',
    format: 'esm',
  },
  plugins: [babel({ babelHelpers: 'bundled' }), ...plugins.filter(v => v)],
});

export default [
  {
    input: 'src/index.js',
    ...getConfig([
      !ROLLUP_WATCH && del({ targets: 'dist/*' }),
      CI && copy({ targets: [{ src: ['package.json', 'README.md'], dest: 'dist' }] }),
    ]),
  },
  {
    input: 'src/worker.js',
    ...getConfig([
      externalGlobals({
        lodash: '_',
        jimp: 'Jimp',
        jszip: 'JSZip',
        'simple-statistics': 'ss',
        '@arkntools/scripts/dist/ocrad': 'OCRAD',
      }),
    ]),
  },
  {
    input: 'src/tools.js',
    ...getConfig(),
  },
];
