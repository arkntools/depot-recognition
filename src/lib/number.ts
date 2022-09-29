import _ from 'lodash';
import OCRAD from '@arkntools/scripts/dist/ocrad';
import Jimp from 'jimp';
import { getRanges, removeRangesNoise, getRangeEnd, Range } from './range';
import { RecognizeSimilarityResult } from './similarity';
import { jimp2base64 } from '../utils/jimp2base64';

export interface RecognizeNumberResult {
  /** Processed digital picture in base64 */
  img: string;
  /** The recognition result, may contain non-numeric characters such as spaces ( ) or underscores (_) */
  text: string;
  /** The numerical result after removing the non-numeric character, the default is 1 when the number is not recognized */
  value: number;
  /** Whether the recognition result (text) is the same as the recognition number (value) after excluding the influence of spaces */
  warn: boolean;
}

const NUM_RESIZE_H = 60;
const NUM_MIN_WIDTH = 8;
const NUM_MAX_SPACE = 20;
const NUM_IMG_PADDING = 10;

const NUM_CROP_W = 50;
const NUM_CROP_H = 22;
const NUM_CROP_X = 40;
const NUM_CROP_Y = 73;

const NUM_CONVOLUTION_CORE = ((size: number) =>
  (line => new Array(size).fill(line))(new Array(size).fill(1 / (size * size))))(3);

/** 获取黑色列范围 */
const getBlackColRanges = (img: Jimp, fn: (img: Jimp, x: number) => boolean): Range[] => {
  const w = img.getWidth();
  const blackArr = [];
  for (let x = 0; x < w; x++) {
    blackArr.push(fn(img, x));
  }
  return getRanges(blackArr);
};

/** 该列是否有黑色像素 */
const isColHasBlack = (img: Jimp, x: number): boolean => {
  const h = img.getHeight();
  for (let y = 0; y < h; y++) {
    const { r } = Jimp.intToRGBA(img.getPixelColor(x, y));
    if (r < 128) return true;
  }
  return false;
};

export const splitNumbers = ({
  splittedImgs,
  itemWidth,
  simResults,
  IMG_SL,
}: {
  splittedImgs: Jimp[];
  itemWidth: number;
  simResults: Array<RecognizeSimilarityResult | null>;
  IMG_SL: number;
}): Array<Jimp | null> => {
  const numRatio = itemWidth / IMG_SL;
  const numX = Math.round(NUM_CROP_X * numRatio);
  const numY = Math.round(NUM_CROP_Y * numRatio);
  const numW = Math.round(NUM_CROP_W * numRatio);
  const numH = Math.round(NUM_CROP_H * numRatio);
  return splittedImgs.map((splittedImg, i) => {
    if (!simResults[i]) return null;
    const numImg = splittedImg
      .clone()
      .crop(numX, numY, numW, numH)
      .resize(Jimp.AUTO, NUM_RESIZE_H, Jimp.RESIZE_BEZIER)
      .invert()
      .threshold({ max: 104 });
    const numImgBlackRanges = getBlackColRanges(numImg, isColHasBlack);
    // 过窄块不要
    removeRangesNoise(numImgBlackRanges, NUM_MIN_WIDTH);
    // 开头贴边块不要
    if (numImgBlackRanges[0]?.start === 0) numImgBlackRanges.splice(0, 1);
    _.remove(numImgBlackRanges, ({ start, length }, j) => {
      // 间距过大不要
      const next = numImgBlackRanges[j + 1];
      if (next && next.start - (start + length) > NUM_MAX_SPACE) return true;
      // 上下贴边块不要
      for (let x = start; x < start + length; x++) {
        const { r: topPixel } = Jimp.intToRGBA(numImg.getPixelColor(x, 0));
        const { r: bottomPixel } = Jimp.intToRGBA(numImg.getPixelColor(x, NUM_RESIZE_H - 1));
        if (topPixel < 128 || bottomPixel < 128) return true;
      }
      return false;
    });
    const numImgLeftSide = Math.max(Math.floor(numImgBlackRanges[0]?.start ?? 0), 0);
    const numImgLastRange = _.last(numImgBlackRanges);
    const numImgRightSide = Math.min(
      Math.ceil(numImgLastRange ? getRangeEnd(numImgLastRange) : numImg.getWidth()),
      numImg.getWidth(),
    );
    if (numImgLeftSide > 0 || numImgRightSide < numImg.getWidth()) {
      numImg.crop(numImgLeftSide, 0, numImgRightSide - numImgLeftSide, numImg.getHeight());
    }
    const newNumImg = new Jimp(
      numImg.getWidth() + NUM_IMG_PADDING * 2,
      numImg.getHeight(),
      'white',
    );
    newNumImg
      .composite(numImg, NUM_IMG_PADDING, 0)
      .convolution(NUM_CONVOLUTION_CORE)
      .invert()
      .threshold({ max: 32, autoGreyscale: false })
      .invert();
    return newNumImg;
  });
};

export const recognizeNumbers = (
  numImgs: Array<Jimp | null>,
): Promise<Array<RecognizeNumberResult | null>> =>
  Promise.all(
    numImgs.map(async img => {
      if (!img) return null;
      const imgData = new ImageData(
        new Uint8ClampedArray(img.bitmap.data),
        img.bitmap.width,
        img.bitmap.height,
      );
      const text = OCRAD(imgData, { numeric: true }).trim();
      const value = parseInt(text.replace(/[^0-9]/g, '')) || 1;
      return {
        img: await jimp2base64(img),
        text,
        value,
        warn: text.replace(/ /g, '') !== String(value),
      };
    }),
  );
