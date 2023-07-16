const { readdirSync, writeFileSync, existsSync, mkdirSync } = require('fs');
const { resolve } = require('path');
const fetch = require('node-fetch').default;
const _ = require('lodash');

// const SPEC_CONTENT = `import { run } from '../../index.jm';
// run(__dirname);`;

const rp = rpath => resolve(__dirname, rpath);

// readdirSync(rp('cases')).forEach(name => {
//   if (name.startsWith('.')) return;
//   writeFileSync(rp(`cases/${name}/index.spec.ts`), SPEC_CONTENT);
// });

if (!existsSync(rp('cache'))) mkdirSync(rp('cache'));
[
  'https://github.com/arkntools/arknights-toolbox/raw/3209a2a03afea450b60f79b0067adfcc51621ad1/src/data/itemOrder.json',
  'https://github.com/arkntools/arknights-toolbox/raw/4f4fc9e5ce91a1bcb2799e2e69f6c399c5a7eddb/src/assets/pkg/item.pkg',
].forEach(async url => {
  const file = rp(`cache/${_.last(url.split('/'))}`);
  if (existsSync(rp(`cache/${file}`))) return;
  const buffer = await fetch(url).then(r => r.buffer());
  writeFileSync(file, buffer);
});
