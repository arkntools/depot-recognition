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

You need to provide [a zip of material images](https://github.com/arkntools/arknights-toolbox/blob/master/src/assets/pkg/item.zip) and [sorting order of materials in deport](https://github.com/arkntools/arknights-toolbox/blob/master/src/data/itemOrder.json). The name of the material must be material ID

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

### `DeportRecognizer(config)`

```js
new DeportRecognizer(config)
```

#### Parameters

| Name   | Type                                    | Description     |
| ------ | --------------------------------------- | --------------- |
| config | [`RecognizerConfig`](#recognizerconfig) | Initial config. |

##### `RecognizerConfig`

| Name  | Type       | Description                                                                                                                                                                       |
| ----- | ---------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| order | `string[]` | Sorting order of materials in deport.                                                                                                                                             |
| pkg   | `any`      | A zip of material images, which is a parameter or an array of parameters that [JSZip.loadAsync](https://stuk.github.io/jszip/documentation/api_jszip/load_async.html) can accept. |

### `DeportRecognizer.recognize(file, updateStepCallback): Object`

Recognize deport image.

#### Parameters

| Name       | Type               | Description                                                                                          |
| ---------- | ------------------ | ---------------------------------------------------------------------------------------------------- |
| file       | `string \| Buffer` | Image URL or buffer. Can be a blob URL.                                                              |
| onProgress | `Function`         | A callback function, will be called when progress update. Its argument is a `number` start from `0`. |

#### Returns

| Name  | Type                                      | Description                                                                                                 |
| ----- | ----------------------------------------- | ----------------------------------------------------------------------------------------------------------- |
| data  | [`SimilarityResult[]`](#similarityresult) | Array of recognition similarity result.                                                                     |
| debug | `string[]`                                | Will contain some base64 images after using [setDebug](#deportrecognizersetdebugisdebug) to set debug mode. |

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
    img: string, // Processed digital picture in base64
    text: string, // The recognition result, may contain non-numeric characters such as spaces ( ) or underscores (_)
    value: number, // The numerical result after removing the non-numeric character, the default is 1 when the number is not recognized
    warn: boolean, // Whether the recognition result (text) is the same as the recognition number (value) after excluding the influence of spaces
  },
}
```

### `DeportRecognizer.setDebug(enable): void`

Set debug mode.

#### Parameters

| Name   | Type      | Description                                                         |
| ------ | --------- | ------------------------------------------------------------------- |
| enable | `boolean` | Will out put some base64 images in recognition result when enabled. |

### `isTrustSim(sim): boolean`

Determine whether a similarity result is trustable.

#### Parameters

| Name | Type                                    | Description                    |
| ---- | --------------------------------------- | ------------------------------ |
| sim  | [`SimilarityResult`](#similarityresult) | Recognition similarity result. |

### `toUniversalResult(data): Object`

Convert the similarity result array into a simple result object.

#### Parameters

| Name | Type                                      | Description                             |
| ---- | ----------------------------------------- | --------------------------------------- |
| data | [`SimilarityResult[]`](#similarityresult) | Array of recognition similarity result. |

#### Returns

| Name                                             | Type     | Description           |
| ------------------------------------------------ | -------- | --------------------- |
| [`SimilarityResult.sim.name`](#similarityresult) | `number` | Material ID: quantity |
