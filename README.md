<div align="center">

[![logo](https://github.com/arkntools/arknights-toolbox/raw/master/public/assets/icons/texas-icon-192x192-v2.png)](https://github.com/arkntools)

# Arkntools - Depot Recognition

Depot recognition module for [Arknights Toolbox](https://github.com/arkntools/arknights-toolbox)

[![NPM version](https://img.shields.io/npm/v/@arkntools/depot-recognition?style=flat-square)](https://www.npmjs.com/package/@arkntools/depot-recognition)
[![GitHub license](https://img.shields.io/github/license/arkntools/depot-recognition?style=flat-square)](https://github.com/arkntools/depot-recognition/blob/main/LICENSE)
[![GitHub Workflow Status](https://img.shields.io/github/workflow/status/arkntools/depot-recognition/Publish?style=flat-square)](https://github.com/arkntools/depot-recognition/actions/workflows/publish.yml)
[![Feedback](https://img.shields.io/badge/feedback-here-blueviolet?style=flat-square)](https://github.com/arkntools/arknights-toolbox/discussions/101)

[中文文档](README_zh.md)

</div>

## Install 

```bash
# npm
npm i @arkntools/depot-recognition
# yarn
yarn add @arkntools/depot-recognition
```

## Usage

### Node

```js
const fetch = require('node-fetch').default;
const { DeportRecognizer, isTrustSim, toUniversalResult } = require('@arkntools/depot-recognition');

(async () => {
  const [order, pkg] = await Promise.all(
    [
      'https://github.com/arkntools/arknights-toolbox/raw/master/src/data/itemOrder.json',
      'https://github.com/arkntools/arknights-toolbox/raw/master/src/assets/pkg/item.zip',
    ].map(url => fetch(url).then(r => (url.endsWith('.json') ? r.json() : r.buffer()))),
  );
  const dr = new DeportRecognizer({ order, pkg });
  const { data } = await dr.recognize('IMAGE_PATH');
  const trustData = data.filter(({ sim }) => isTrustSim(sim)); // get trust result
  console.log(trustData); // full result
  console.log(toUniversalResult(trustData)); // simple result
})();
```

### Web worker

Need [comlink-loader](https://www.npmjs.com/package/comlink-loader)

```js
import DepotRecognitionWorker from 'comlink-loader!@arkntools/depot-recognition/es/worker';
import { isTrustSim, toUniversalResult } from '@arkntools/depot-recognition/es/tools';
import { transfer } from 'comlink';

import order from 'path/to/order.json';
import pkgURL from 'file-loader!path/to/pkg.zip';

const worker = new DepotRecognitionWorker();

const initRecognizer = async () => {
  const pkg = await fetch(pkgURL).then(r => r.arrayBuffer());
  const recognizer = await new worker.DeportRecognizer(transfer({ order, pkg }, [pkg]));
  return recognizer;
};

(async () => {
  const dr = await initRecognizer();
  const { data } = await dr.recognize('IMG_URL'); // can be blob url
  const trustData = data.filter(({ sim }) => isTrustSim(sim)); // get trust result
  console.log(trustData); // full result
  console.log(toUniversalResult(trustData)); // simple result
})();
```

## API

TODO
