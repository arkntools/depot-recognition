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

初始化需要提供 [材料图片的压缩包](https://github.com/arkntools/arknights-toolbox/blob/master/src/assets/pkg/item.zip) 和 [材料在仓库中的排序顺序](https://github.com/arkntools/arknights-toolbox/blob/master/src/data/itemOrder.json)，材料的命名必须为材料ID

对 [材料图片](https://github.com/arkntools/arknights-toolbox/tree/master/public/assets/img/item) 有一定要求，目前以 [PRTS 使用的材料图片](http://prts.wiki/w/%E9%81%93%E5%85%B7%E4%B8%80%E8%A7%88) 为准

### Node

```js
const fetch = require('node-fetch').default;
const { DeportRecognizer, isTrustedResult, toSimpleTrustedResult } = require('@arkntools/depot-recognition');

(async () => {
  const [order, pkg] = await Promise.all(
    [
      'https://github.com/arkntools/arknights-toolbox/raw/master/src/data/itemOrder.json',
      'https://github.com/arkntools/arknights-toolbox/raw/master/src/assets/pkg/item.zip',
    ].map(url => fetch(url).then(r => (url.endsWith('.json') ? r.json() : r.buffer()))),
  );
  const dr = new DeportRecognizer({ order, pkg });
  const { data } = await dr.recognize('IMAGE_PATH');
  console.log(data.filter(isTrustedResult)); // 详细的置信度高的结果：包含切图坐标、与其它材料比较的相似度等
  console.log(toSimpleTrustedResult(data)); // 简单的置信度高的结果：{ 材料ID: 数量 }
})();
```

### Web worker

需要 [comlink-loader](https://www.npmjs.com/package/comlink-loader)

```js
import DepotRecognitionWorker from 'comlink-loader!@arkntools/depot-recognition/es/worker';
import { isTrustedResult, toSimpleTrustedResult } from '@arkntools/depot-recognition/es/tools';
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
  console.log(data.filter(isTrustedResult)); // 详细的置信度高的结果：包含切图坐标、与其它材料比较的相似度等
  console.log(toSimpleTrustedResult(data)); // 简单的置信度高的结果：{ 材料ID: 数量 }
})();
```

## API

### `DeportRecognizer(config)`

```js
new DeportRecognizer(config)
```

#### Parameters

| Name   | Type                                    | Description |
| ------ | --------------------------------------- | ----------- |
| config | [`RecognizerConfig`](#recognizerconfig) | 初始化配置  |

##### `RecognizerConfig`

| Name  | Type       | Description                                                                                                                               |
| ----- | ---------- | ----------------------------------------------------------------------------------------------------------------------------------------- |
| order | `string[]` | 材料在仓库中的排序顺序                                                                                                                    |
| pkg   | `any`      | 材料图片的压缩包，是 [JSZip.loadAsync](https://stuk.github.io/jszip/documentation/api_jszip/load_async.html) 可接受的一个参数或参数的数组 |

### `DeportRecognizer.recognize(file, onProgress): Object`

识别仓库图片

#### Parameters

| Name       | Type               | Description                                                              |
| ---------- | ------------------ | ------------------------------------------------------------------------ |
| file       | `string \| Buffer` | 图片地址或 buffer，可以是 Blob URL                                       |
| onProgress | `Function`         | 一个会在识别进度更新时被执行的回调，回调参数为进度 `number`，从 `0` 开始 |

#### Returns

| Name  | Type                                      | Description                                                                                      |
| ----- | ----------------------------------------- | ------------------------------------------------------------------------------------------------ |
| data  | [`SimilarityResult[]`](#similarityresult) | 识别相似度结果的数组                                                                             |
| debug | `string[]`                                | 使用 [setDebug](#deportrecognizersetdebugenable-void) 设置调试模式后会输出一些 base64 形式的过程图片 |

##### `SimilarityResult`

```js
{
  debug: {
    scale: number, // 材料切图被缩放到 60*60 时的缩放比例
  },
  // 材料位置
  pos: {
    x: number, // 左上顶点 x
    y: number, // 左上顶点 y
    l: number, // 边长
  },
  // 材料四边与全图四边的距离比例，0~1
  view: {
    left: number,
    right: number,
    top: number,
    bottom: number,
  },
  // 相似度信息
  sim: {
    name: string, // 最相似的材料ID
    diff: number, // 与其相比的差异度，0~1
    // 该材料的对比记录
    diffs: [
      [
        string, // 材料ID
        number, // 差异度
      ],
    ],
  },
  // 材料数量信息
  num: {
    img: string, // 处理后的数字图片，base64
    text: string, // 识别结果，可能含有空格( )或下划线(_)等非数字字符
    value: number, // 去除非数字字符后的数字结果，若没识别出数字则默认为 1
    warn: boolean, // 排除空格影响后识别结果(text)是否与识别数字(value)不一致
  },
}
```

### `DeportRecognizer.setDebug(enable): void`

设置调试模式

#### Parameters

| Name   | Type      | Description                                  |
| ------ | --------- | -------------------------------------------- |
| enable | `boolean` | 设置为调试模式，识别时会额外输出一些过程图片 |

### `isTrustedResult(result): boolean`

判定一个相似度结果是否可信

#### Parameters

| Name   | Type                                    | Description    |
| ------ | --------------------------------------- | -------------- |
| result | [`SimilarityResult`](#similarityresult) | 识别相似度结果 |

### `toSimpleTrustedResult(data): Object`

将相似度结果数组转化为简单的结果对象

#### Parameters

| Name | Type                                      | Description        |
| ---- | ----------------------------------------- | ------------------ |
| data | [`SimilarityResult[]`](#similarityresult) | 识别相似度结果数组 |

#### Returns

| Name                                             | Type     | Description  |
| ------------------------------------------------ | -------- | ------------ |
| [`SimilarityResult.sim.name`](#similarityresult) | `number` | 材料ID: 数量 |
