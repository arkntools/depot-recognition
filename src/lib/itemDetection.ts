import { flatMap, flatten, map, maxBy, merge, min, range, uniqBy } from 'lodash';
import { linearRegressionLine, linearRegression } from 'simple-statistics';
import Jimp from '../utils/jimp';
import type { Range } from './range';
import { getRangesBy, findRangeIndex } from './range';

interface ItemPosData {
  y: number;
  xRange: Range;
  yRange: Range;
}

const ORIG_MAX_WIDTH = 960;
const ORIG_MAX_HEIGHT = 540;

const ITEM_VIEW_SCALE = 1.15;
const ITEM_DEBUG_VIEW_W = 60;
const ITEM_X_SPACE_RATIO = 29 / 88;
// const ITEM_Y_SPACE_RATIO = 107.5 / 177;

const EDGE_CORE = [
  [1, 1, 1],
  [1, -9, 1],
  [1, 1, 1],
];

/** 检测素材位置 */
export const itemDetection = (origImg: Jimp, isDebug = false) => {
  // 缩放原图
  const img = origImg.clone();
  const scale = (() => {
    const w = img.getWidth();
    const h = img.getHeight();
    if (w >= h && w > ORIG_MAX_WIDTH) img.resize(ORIG_MAX_WIDTH, Jimp.AUTO);
    else if (h > w && h > ORIG_MAX_HEIGHT) img.resize(Jimp.AUTO, ORIG_MAX_HEIGHT);
    else return 1;
    return w / img.getWidth();
  })();

  // 边缘检测卷积
  const edgeImg = img.clone().greyscale().convolution(EDGE_CORE);
  const width = edgeImg.getWidth();
  const height = edgeImg.getHeight();

  // 获得行的大致范围
  const yWhite: number[] = new Array(height).fill(0);
  const removedEdgeWith = Math.round(width * 0.15); // 去除可能的干扰
  edgeImg.scan(removedEdgeWith, 0, width - removedEdgeWith, height, function (x, y, idx) {
    yWhite[y] += this.bitmap.data[idx];
  });
  const yRangeMinLine = width * 0.005 * 255;
  const yRanges = getRangesBy<number>(
    yWhite.map(v => v > yRangeMinLine),
    ({ length }, minLen) => length > minLen,
    ranges => maxBy(ranges, 'length')!.length * 0.8,
  );
  let itemWidth = min(map(yRanges, 'length'))!; // 最小值一般为极限高度，和真正边长最接近

  // 获得每行中素材的宽度范围
  const xWhites: number[][] = yRanges.map(() => new Array(width).fill(0));
  edgeImg.scan(0, 0, width, height, function (x, y, idx) {
    const yRangeIndex = findRangeIndex(y, yRanges);
    if (yRangeIndex !== -1) xWhites[yRangeIndex][x] += this.bitmap.data[idx];
  });
  const xsRanges = xWhites.map(xWhite =>
    getRangesBy(
      xWhite.map(v => v > 0),
      ({ start, length }) =>
        start > 0 && start + length < width && itemWidth * 0.9 < length && length < itemWidth * 1.2,
    ),
  );
  const xRangeMinLength = 0.05 * itemWidth;
  const xItemWidths = map(
    flatten(xsRanges).filter(
      ({ start, length }) =>
        start !== 0 && start + length !== width && length < itemWidth && length > xRangeMinLength,
    ),
    'length',
  );
  if (xItemWidths.length) {
    itemWidth = min(xItemWidths)!; // 更新边长
  }

  // 获得规范素材的范围
  const itemsRange = flatten(
    xsRanges.map((xRanges, y) => {
      const yRange = yRanges[y];
      return xRanges
        .map((xRange): ItemPosData | null => {
          const yWhite: number[] = new Array(yRange.length).fill(0);
          edgeImg.scan(
            xRange.start,
            yRange.start,
            xRange.length,
            yRange.length,
            function (x, y, idx) {
              yWhite[y - yRange.start] += this.bitmap.data[idx];
            },
          );
          const yRangeMinLine = xRange.length * 0.005 * 255;
          const [resultYRange] = getRangesBy(
            yWhite.map(v => v > yRangeMinLine),
            range => itemWidth * 0.9 < range.length && range.length < itemWidth * 1.2,
          );
          if (!resultYRange) return null;
          resultYRange.start += yRange.start;
          return { y, xRange, yRange: resultYRange };
        })
        .filter((v): v is ItemPosData => !!v);
    }),
  );

  // 更新边长
  itemWidth =
    min(flatMap(itemsRange, ({ xRange, yRange }) => [xRange.length, yRange.length])) || itemWidth;

  // 材料位置的线性回归
  const xOccu = itemWidth * (1 + ITEM_X_SPACE_RATIO);
  const xCents = itemsRange.map(({ xRange: { start, length } }) => start + length / 2);
  const firstXCent = min(xCents)!;
  const firstColOffset = Math.ceil(firstXCent / xOccu);
  const xPoints = xCents.map(y => [firstColOffset + Math.round((y - firstXCent) / xOccu), y]);
  const yPoints = itemsRange.map(({ y, yRange: { start, length } }) => [y, start + length / 2]);

  const getMidX = linearRegressionLine(linearRegression(xPoints));
  const getMidY = linearRegressionLine(linearRegression(yPoints));

  // 取得所有素材位置
  const trueItemWidth = Math.round(itemWidth * scale);
  const colNum = Math.floor((width + itemWidth * (1 + ITEM_X_SPACE_RATIO)) / xOccu);
  const rowNum = yRanges.length;

  const xPoss = range(colNum)
    .map(col => {
      const offset = ((col + 1) / colNum) * -1; // magic offset :(
      const midX = getMidX(col) + offset;
      const x = Math.round((midX - itemWidth / 2) * scale);
      const left = (midX - (itemWidth * ITEM_VIEW_SCALE) / 2) / width;
      const right = 1 - (midX + (itemWidth * ITEM_VIEW_SCALE) / 2) / width;
      return {
        pos: { x, col },
        view: { left, right },
      };
    })
    .filter(({ pos: { x } }) => x >= 0 && x + trueItemWidth <= origImg.getWidth());
  const yPoss = range(rowNum).map(row => {
    const midY = getMidY(row);
    const y = Math.round((midY - itemWidth / 2) * scale);
    const top = (midY - (itemWidth * ITEM_VIEW_SCALE) / 2) / height;
    const bottom = 1 - (midY + (itemWidth * ITEM_VIEW_SCALE) / 2) / height;
    return {
      pos: { y, l: trueItemWidth, row },
      view: { top, bottom },
    };
  });

  const positions = flatMap(uniqBy(flatten(xPoss), 'pos.x'), xPos =>
    uniqBy(flatten(yPoss), 'pos.y').map(yPos =>
      merge(
        {
          debug: {
            scale: ITEM_DEBUG_VIEW_W / (scale * itemWidth),
          },
        },
        xPos,
        yPos,
      ),
    ),
  );

  // 测试用
  const debugImgs = [];

  if (isDebug) {
    // debug square
    const debugSquareImg = origImg.clone();
    positions.forEach(({ pos: { x, y } }) => {
      for (let ix = x; ix < x + trueItemWidth; ix++) {
        debugSquareImg.setPixelColor(0xff0000ff, ix, y);
        debugSquareImg.setPixelColor(0xff0000ff, ix, y + trueItemWidth - 1);
      }
      for (let iy = y; iy < y + trueItemWidth; iy++) {
        debugSquareImg.setPixelColor(0xff0000ff, x, iy);
        debugSquareImg.setPixelColor(0xff0000ff, x + trueItemWidth - 1, iy);
      }
    });
    debugImgs.push(debugSquareImg);

    // debug row
    const debugRowImg = edgeImg.clone();
    yRanges.forEach(({ start, length }) => {
      debugRowImg.scan(0, start, width, length, function (x, y, idx) {
        debugRowImg.bitmap.data[idx] = 200;
      });
    });
    debugImgs.push(debugRowImg);

    // debug item
    const debugItemImg = edgeImg.clone();
    itemsRange.forEach(({ xRange, yRange }) => {
      debugRowImg.scan(
        xRange.start,
        yRange.start,
        xRange.length,
        yRange.length,
        function (x, y, idx) {
          debugItemImg.bitmap.data[idx] = 200;
        },
      );
    });
    debugImgs.push(debugItemImg);
  }

  return {
    debugImgs,
    positions,
    itemWidth: Math.round(itemWidth * scale),
  };
};
