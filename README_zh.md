<div align="center">

[![logo](https://github.com/arkntools/arknights-toolbox/raw/master/public/assets/icons/texas-icon-192x192-v2.png)](https://github.com/arkntools)

# Arkntools - Depot Recognition

[明日方舟工具箱](https://github.com/arkntools/arknights-toolbox)使用的仓库识别模块

[![NPM version](https://img.shields.io/npm/v/@arkntools/depot-recognition?style=flat-square)](https://www.npmjs.com/package/@arkntools/depot-recognition)
[![GitHub license](https://img.shields.io/github/license/arkntools/depot-recognition?style=flat-square)](https://github.com/arkntools/depot-recognition/blob/main/LICENSE)
[![GitHub Workflow Status](https://img.shields.io/github/workflow/status/arkntools/depot-recognition/Publish?style=flat-square)](https://github.com/arkntools/depot-recognition/actions/workflows/publish.yml)
[![Feedback](https://img.shields.io/badge/feedback-here-blueviolet?style=flat-square)](https://github.com/arkntools/arknights-toolbox/discussions/101)

</div>

## 安装

```bash
# npm
npm i @arkntools/depot-recognition
# yarn
yarn add @arkntools/depot-recognition
```

## 使用

初始化需要提供 [材料图片的压缩包](https://github.com/arkntools/arknights-toolbox/blob/master/src/assets/pkg/item.zip) 和 [材料在仓库中的排序顺序](https://github.com/arkntools/arknights-toolbox/blob/master/src/data/itemOrder.json)

对 [材料图片](https://github.com/arkntools/arknights-toolbox/tree/master/public/assets/img/item) 有一定要求，目前以 [PRTS 使用的材料图片](http://prts.wiki/w/%E9%81%93%E5%85%B7%E4%B8%80%E8%A7%88) 为准

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
  const trustData = data.filter(({ sim }) => isTrustSim(sim)); // 筛选置信度高的结果
  console.log(trustData); // 详细结果：包含切图坐标、与其它材料比较的相似度等
  console.log(toUniversalResult(trustData)); // 简单结果：{ 材料ID: 数量 }
})();
```

### Web worker

需要 [comlink-loader](https://www.npmjs.com/package/comlink-loader)

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
  const { data } = await dr.recognize('IMG_URL'); // 可以是 Blob URL
  const trustData = data.filter(({ sim }) => isTrustSim(sim)); // 筛选置信度高的结果
  console.log(trustData); // 详细结果：包含切图坐标、与其它材料比较的相似度等
  console.log(toUniversalResult(trustData)); // 简单结果：{ 材料ID: 数量 }
})();
```

## API

### `new DeportRecognizer(config)`

#### Parameters

| Name   | Type               | Description |
| ------ | ------------------ | ----------- |
| config | `RecognizerConfig` | 初始化配置  |

##### `RecognizerConfig`

| Name  | Type       | Description                                                       |
| ----- | ---------- | ----------------------------------------------------------------- |
| order | `string[]` | 材料在仓库中的排序顺序                                            |
| pkg   | `any`      | 材料图片的压缩包，是 JSZip.loadAsync 可接受的一个参数或参数的数组 |

### `DeportRecognizer.recognize(file, updateStepCallback)`

#### Parameters

| Name       | Type               | Description                                                            |
| ---------- | ------------------ | ---------------------------------------------------------------------- |
| file       | `string \| Buffer` | 图片地址或 buffer，支持 Blob URL                                       |
| onProgress | `Function`         | 一个会在识别进度更新时被执行的回调，回调参数为进度 `number`，从 0 开始 |

#### Returns

| Name  | Type                  | Description |
| ----- | --------------------- | ----------- |
| data  | `RecognitionResult[]` |             |
| debug | `string[]`            |             |

TODO
