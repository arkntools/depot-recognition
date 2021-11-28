<div align="center">

[![logo](https://github.com/arkntools/arknights-toolbox/raw/master/public/assets/icons/texas-icon-192x192-v2.png)](https://github.com/arkntools)

# Arkntools - Depot Recognition

Depot recognition module for [Arknights Toolbox](https://github.com/arkntools/arknights-toolbox)

[![NPM version](https://img.shields.io/npm/v/@arkntools/depot-recognition?style=flat-square)](https://www.npmjs.com/package/@arkntools/depot-recognition)
[![GitHub license](https://img.shields.io/github/license/arkntools/depot-recognition?style=flat-square)](https://github.com/arkntools/depot-recognition/blob/main/LICENSE)
[![GitHub Workflow Status](https://img.shields.io/github/workflow/status/arkntools/depot-recognition/Publish?style=flat-square)](https://github.com/arkntools/depot-recognition/actions/workflows/publish.yml)
[![Feedback](https://img.shields.io/badge/feedback-here-blueviolet?style=flat-square)](https://github.com/arkntools/arknights-toolbox/discussions/101)

[中文文档](https://github.com/arkntools/depot-recognition/blob/main/README_zh.md)

</div>

## Install

```bash
# npm
npm i @arkntools/depot-recognition
# yarn
yarn add @arkntools/depot-recognition
```

## Usage

You need to provide [a zip of material images](https://github.com/arkntools/arknights-toolbox/blob/master/src/assets/pkg/item.pkg) and [sorting order of materials in deport](https://github.com/arkntools/arknights-toolbox/blob/master/src/data/itemOrder.json). The name of the material must be material ID.

### Node

```js
const fetch = require('node-fetch').default;
const { DeportRecognizer, isTrustedResult, toSimpleTrustedResult } = require('@arkntools/depot-recognition');

(async () => {
  const [order, pkg] = await Promise.all(
    [
      'https://github.com/arkntools/arknights-toolbox/raw/master/src/data/itemOrder.json',
      'https://github.com/arkntools/arknights-toolbox/raw/master/src/assets/pkg/item.pkg',
    ].map(url => fetch(url).then(r => (url.endsWith('.json') ? r.json() : r.buffer()))),
  );
  const dr = new DeportRecognizer({ order, pkg });
  const { data } = await dr.recognize('IMAGE_PATH');
  console.log(data.filter(isTrustedResult)); // full trust result
  console.log(toSimpleTrustedResult(data)); // simple trust result
})();
```

### Web worker

Need [comlink-loader](https://www.npmjs.com/package/comlink-loader)

```js
import DepotRecognitionWorker from 'comlink-loader!@arkntools/depot-recognition/es/worker';
import { isTrustedResult, toSimpleTrustedResult } from '@arkntools/depot-recognition/es/tools';
import { transfer } from 'comlink';

import order from 'path/to/order.json';
import pkgURL from 'file-loader!path/to/pkg.zip';

const initRecognizer = async () => {
  const pkg = await fetch(pkgURL).then(r => r.arrayBuffer());
  const worker = new DepotRecognitionWorker();
  return await new worker.DeportRecognizer(transfer({ order, pkg }, [pkg]));
};

(async () => {
  const dr = await initRecognizer();
  const { data } = await dr.recognize('IMG_URL'); // can be blob url
  console.log(data.filter(isTrustedResult)); // full trust result
  console.log(toSimpleTrustedResult(data)); // simple trust result
})();
```

#### Typescript

If you are using comlink-loader in typescript, you need to add a declaration:

```ts
declare module 'comlink-loader*!@arkntools/depot-recognition/es/worker' {
  import DepotRecognitionWorker from '@arkntools/depot-recognition/es/comlinkLoader';
  export * from '@arkntools/depot-recognition/es/comlinkLoader';
  export default DepotRecognitionWorker;
}
```

Then you can use it as normal:

```ts
import DepotRecognitionWorker, { DepotRecognitionWrap } from 'comlink-loader!@arkntools/depot-recognition/es/worker';

let recognizer: DepotRecognitionWrap | undefined;

(async () => {
  const worker = new DepotRecognitionWorker();
  recognizer = await new worker.DeportRecognizer(/* ... */);
})();
```

## API

### `DeportRecognizer(config)`

```js
new DeportRecognizer(config)
```

#### Parameters

| Name   | Type                                    | Description     |
| ------ | --------------------------------------- | --------------- |
| config | [`RecognizerConfig`](#recognizerconfig) | Initial config. |

##### `RecognizerConfig`

| Name  | Type       | Description                                                                                                                                                                   |
| ----- | ---------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| order | `string[]` | Item IDs, represent the sorting order of materials in deport.                                                                                                                 |
| pkg   | `any`      | A zip of material images, which is a parameter or an array of parameters accepted by [JSZip.loadAsync](https://stuk.github.io/jszip/documentation/api_jszip/load_async.html). |

### `DeportRecognizer.recognize(file, onProgress): Object`

Recognize deport image.

#### Parameters

| Name       | Type               | Description                                                                                          |
| ---------- | ------------------ | ---------------------------------------------------------------------------------------------------- |
| file       | `string \| Buffer` | Image URL or buffer. Can be a blob URL.                                                              |
| onProgress | `Function`         | A callback function, will be called when progress update. Its argument is a `number` start from `0`. |

#### Returns

| Name  | Type                                      | Description                                                                                                     |
| ----- | ----------------------------------------- | --------------------------------------------------------------------------------------------------------------- |
| data  | [`SimilarityResult[]`](#similarityresult) | Array of recognition similarity result.                                                                         |
| debug | `string[]`                                | Will contain some base64 images after using [setDebug](#deportrecognizersetdebugenable-void) to set debug mode. |

##### `SimilarityResult`

```js
{
  debug: {
    scale: number, // The scaling ratio when the material slice is scaled to 60 * 60
  },
  // Material position
  pos: {
    x: number, // Top left x
    y: number, // Top left y
    l: number, // Side length
  },
  // The distance ratio (0~1) between the four sides of the material and the four sides of the whole image
  view: {
    left: number,
    right: number,
    top: number,
    bottom: number,
  },
  // Similarity
  sim: {
    name: string, // ID of most similar material
    diff: number, // The degree of difference (0~1) between them
    // Comparative record of the material
    diffs: [
      [
        string, // Material ID
        number, // Difference degree
      ],
    ],
  },
  // Material quantity
  num: {
    img: string,   // Processed digital picture in base64
    text: string,  // The recognition result, may contain non-numeric characters such as spaces ( ) or underscores (_)
    value: number, // The numerical result after removing the non-numeric character, the default is 1 when the number is not recognized
    warn: boolean, // Whether the recognition result (text) is the same as the recognition number (value) after excluding the influence of spaces
  },
}
```

### `DeportRecognizer.setDebug(enable): void`

Set debug mode.

#### Parameters

| Name   | Type      | Description                                                        |
| ------ | --------- | ------------------------------------------------------------------ |
| enable | `boolean` | Will output some base64 images in recognition result when enabled. |

### `isTrustedResult(result): boolean`

Determine whether a similarity result is trustable.

#### Parameters

| Name   | Type                                    | Description                    |
| ------ | --------------------------------------- | ------------------------------ |
| result | [`SimilarityResult`](#similarityresult) | Recognition similarity result. |

### `toSimpleTrustedResult(data): Record<string, number>`

Convert the similarity result array into a simple result object.

#### Parameters

| Name | Type                                      | Description                             |
| ---- | ----------------------------------------- | --------------------------------------- |
| data | [`SimilarityResult[]`](#similarityresult) | Array of recognition similarity result. |

#### Returns

| Name                                               | Type     | Description           |
| -------------------------------------------------- | -------- | --------------------- |
| [`[SimilarityResult.sim.name]`](#similarityresult) | `number` | Material ID: quantity |
