import { babel, getBabelOutputPlugin } from '@rollup/plugin-babel';
import externalGlobals from 'rollup-plugin-external-globals';
import copy from 'rollup-plugin-copy';
import del from 'rollup-plugin-delete';

const { ROLLUP_WATCH, CI } = process.env;

const getConfig = (plugins = []) => ({
  external: [/^lodash/, /^@arkntools/, 'jimp', 'jszip', 'simple-statistics'],
  plugins: [...plugins.filter(v => v), babel({ babelHelpers: 'bundled' })],
  output: [
    {
      dir: 'dist',
      format: 'esm',
      plugins: [getBabelOutputPlugin({ plugins: ['@babel/plugin-transform-modules-commonjs'] })],
    },
    {
      dir: 'dist/es',
      format: 'esm',
    },
  ],
});

const config = [
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

config[1].output.splice(0, 1);

export default config;
