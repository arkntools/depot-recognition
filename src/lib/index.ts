import _ from 'lodash';
import Jimp from 'jimp';
import JSZip, { JSZipLoadOptions } from 'jszip';
import { itemDetection } from './itemDetection';
import { splitNumbers, recognizeNumbers, RecognizeNumberResult } from './number';
import { getSims, CompareItemData, RecognizeSimilarityResult } from './similarity';
import { jimp2base64 } from '../utils/jimp2base64';

export type ZipData = string | ArrayBuffer | Uint8Array | Buffer | Blob;

export interface RecognizerConfig {
  /** Item IDs, represent the sorting order of materials in deport */
  order: string[];
  /**
   * Item images zip, which is a parameter or an array of parameters accepted by `JSZip.loadAsync`
   * @see https://stuk.github.io/jszip/documentation/api_jszip/load_async.html
   */
  pkg: ZipData | [ZipData, JSZipLoadOptions | undefined];
}

export interface RecognizeResult {
  debug: {
    /** The scaling ratio when the material slice is scaled to 60 * 60 */
    scale: number;
  };
  /** Material position */
  pos: {
    /** Top left x */
    x: number;
    /** Top left y */
    y: number;
    /** Side length */
    l: number;
  };
  /** The distance ratio (0~1) between the four sides of the material and the four sides of the whole image */
  view: {
    left: number;
    right: number;
    top: number;
    bottom: number;
  };
  /** Similarity */
  sim?: RecognizeSimilarityResult;
  /** Material quantity */
  num?: RecognizeNumberResult;
}

const IMG_SL = 100;

const IMG_ORIG_SL = 183;
const IMG_CROP_SL = 151;
const IMG_CROP_XY = (IMG_ORIG_SL - IMG_CROP_SL) / 2;

const NUM_MASK_IMG = new Jimp(54, 28, 'white');
const NUM_MASK_X = 39;
const NUM_MASK_Y = 70;

export class DeportRecognizer {
  protected config: RecognizerConfig;
  protected isDebug: boolean;
  protected itemImgs: CompareItemData | undefined;

  constructor(config: RecognizerConfig) {
    this.config = config;
    this.isDebug = false;
  }

  /** Some process images will be output in debug mode. */
  setDebug(enable: boolean) {
    this.isDebug = enable;
  }

  protected async loadResource() {
    if (this.itemImgs) return this.itemImgs;
    const zip = await JSZip.loadAsync(
      ...(_.castArray(this.config.pkg) as [ZipData, JSZipLoadOptions]),
    );
    const items = await Promise.all(
      this.config.order.map(async id => {
        try {
          const file = zip.file(`${id}.png`);
          if (!file) {
            console.warn(`[depot-recognition] ${id}.png not exist in pkg`);
            return;
          }
          // @ts-expect-error
          return await Jimp.read(await file.async('arraybuffer'));
        } catch (e) {
          console.error('[depot-recognition]', e);
        }
      }),
    );
    this.itemImgs = _.zip(
      this.config.order,
      items.map(item =>
        item
          ?.crop(IMG_CROP_XY, IMG_CROP_XY, IMG_CROP_SL, IMG_CROP_SL)
          .resize(IMG_SL, IMG_SL, Jimp.RESIZE_BEZIER)
          .composite(NUM_MASK_IMG, NUM_MASK_X, NUM_MASK_Y)
          .circle(),
      ),
    ).filter(([, img]) => img) as CompareItemData;
    return this.itemImgs;
  }

  /**
   * Recognize depot image.
   * @param file Image file URL or Buffer, support Blob URL
   * @param onProgress A callback function, will be called when progress update
   * @returns Recognition result
   */
  async recognize(
    file: string | Buffer,
    onProgress: (step: number) => void = () => {},
  ): Promise<{ data: RecognizeResult[]; debug: string[] }> {
    const debugImgs = [];
    const nextProgress = (() => {
      let progress = 0;
      return () => onProgress(progress++);
    })();

    // 加载
    nextProgress();
    // @ts-expect-error
    const [origImg, itemImgs] = await Promise.all([Jimp.read(file), this.loadResource()]);

    // 切图
    nextProgress();
    const {
      positions,
      itemWidth,
      debugImgs: itemDetectionDebugImgs,
    } = itemDetection(origImg, this.isDebug);
    if (this.isDebug) debugImgs.push(...itemDetectionDebugImgs);
    const splittedImgs = positions.map(({ pos: { x, y } }) =>
      origImg.clone().crop(x, y, itemWidth, itemWidth),
    );
    const compareImgs = splittedImgs.map(img =>
      img.clone().resize(IMG_SL, IMG_SL).composite(NUM_MASK_IMG, NUM_MASK_X, NUM_MASK_Y).circle(),
    );

    // 相似度计算
    nextProgress();
    const simResults = getSims(compareImgs, itemImgs);

    // 切数字图
    nextProgress();
    const numImgs = splitNumbers({ splittedImgs, itemWidth, simResults, IMG_SL });

    // 识别数字
    nextProgress();
    const numResults = await recognizeNumbers(numImgs);

    return {
      data: _.merge(
        positions,
        simResults.map(sim => ({ sim })),
        numResults.map(num => ({ num })),
      ),
      debug: await Promise.all(debugImgs.map(jimp2base64)),
    };
  }
}
