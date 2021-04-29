import _ from 'lodash';
import Jimp from 'jimp';
import './jimp.toBase64';
import JSZip from 'jszip';
import { itemDetection } from './itemDetection';
import { splitNumbers, recognizeNumbers } from './number';
import { getSims } from './similarity';

const IMG_SL = 100;

const IMG_ORIG_SL = 183;
const IMG_CROP_SL = 151;
const IMG_CROP_XY = (IMG_ORIG_SL - IMG_CROP_SL) / 2;

const NUM_MASK_IMG = new Jimp(54, 28, 'white');
const NUM_MASK_X = 39;
const NUM_MASK_Y = 70;

export const setDebug = isDebug => {
  self.IS_DEBUG = isDebug;
};

export class DeportRecognizer {
  /**
   * @typedef {Object} RecognizerConfig
   * @property {string[]} order Item order
   * @property {*} pkg Item images zip, can be any parameter or an array of parameters accepted by JSZip.loadAsync
   */

  /**
   * @param {RecognizerConfig} config Recognizer config
   */
  constructor(config) {
    this.config = config;
  }

  /**
   * @private
   */
  async loadResource() {
    if (this.itemImgs) return this.itemImgs;
    const zip = await JSZip.loadAsync(..._.castArray(this.config.pkg));
    const items = await Promise.all(
      this.config.order.map(async id =>
        Jimp.read(await zip.file(`${id}.png`).async('arraybuffer')),
      ),
    );
    this.itemImgs = _.zip(
      this.config.order,
      items.map(item =>
        item
          .crop(IMG_CROP_XY, IMG_CROP_XY, IMG_CROP_SL, IMG_CROP_SL)
          .resize(IMG_SL, IMG_SL, Jimp.RESIZE_BEZIER)
          .composite(NUM_MASK_IMG, NUM_MASK_X, NUM_MASK_Y)
          .circle(),
      ),
    );
    return this.itemImgs;
  }

  /**
   * @param {string | Buffer} file Image file URL or buffer, support blob URL
   * @param {(text: number) => void} onProgress A callback function to transfer recognition progress
   * @returns Recognition result
   */
  async recognize(file, onProgress = () => {}) {
    const debugImgs = [];
    const nextProgress = (() => {
      let progress = 0;
      return () => onProgress(progress++);
    })();

    // 加载
    nextProgress();
    const [origImg, itemImgs] = await Promise.all([Jimp.read(file), this.loadResource()]);

    // 切图
    nextProgress();
    const { posisions, itemWidth, debugImgs: itemDetectionDebugImgs } = itemDetection(origImg);
    if (self.IS_DEBUG) debugImgs.push(...itemDetectionDebugImgs);
    const splitedImgs = posisions.map(({ pos: { x, y } }) =>
      origImg.clone().crop(x, y, itemWidth, itemWidth),
    );
    const compareImgs = splitedImgs.map(img =>
      img.clone().resize(IMG_SL, IMG_SL).composite(NUM_MASK_IMG, NUM_MASK_X, NUM_MASK_Y).circle(),
    );

    // 相似度计算
    nextProgress();
    const simResults = getSims(compareImgs, itemImgs);

    // 切数字图
    nextProgress();
    const numImgs = splitNumbers({ splitedImgs, itemWidth, simResults, IMG_SL });

    // 识别数字
    nextProgress();
    const numResults = await recognizeNumbers(numImgs);

    return {
      data: _.merge(
        posisions,
        simResults.map(sim => ({ sim })),
        numResults.map(num => ({ num })),
      ),
      debug: await Promise.all(debugImgs.map(img => img.toBase64())),
    };
  }
}
