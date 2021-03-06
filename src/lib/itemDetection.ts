import _ from 'lodash';
import Jimp from 'jimp';
import { linearRegressionLine, linearRegression, median } from 'simple-statistics';
import { getGoodRanges, findRangeIndex } from './range';

const ORIG_MAX_WIDTH = 960;
const ORIG_MAX_HEIGHT = 540;

const ITEM_VIEW_SCALE = 1.15;
const ITEM_DEBUG_VIEW_W = 60;
const ITEM_X_SPACE_RATIO = 21 / 75;
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

  // 得到比较标准的若干个素材位置
  const edgeImg = img.clone().greyscale().convolution(EDGE_CORE);
  const width = edgeImg.getWidth();
  const height = edgeImg.getHeight();

  const yWhite: number[] = new Array(height).fill(0);
  const removedEdgeWith = Math.round(width * 0.15); // 去除可能的干扰
  edgeImg.scan(removedEdgeWith, 0, width - removedEdgeWith, height, function (x, y, idx) {
    yWhite[y] += this.bitmap.data[idx];
  });
  const yRangeMinLine = width * 0.005 * 255;
  const yRanges = getGoodRanges(yWhite.map(v => v > yRangeMinLine));
  let itemWidth = _.min(_.map(yRanges, 'length'))!; // 最小值一般为极限高度，和真正边长最接近

  const xWhites: number[][] = yRanges.map(() => new Array(width).fill(0));
  edgeImg.scan(0, 0, width, height, function (x, y, idx) {
    const yRangeIndex = findRangeIndex(y, yRanges);
    if (yRangeIndex !== -1) xWhites[yRangeIndex][x] += this.bitmap.data[idx];
  });
  const xRangess = xWhites.map(xWhite =>
    getGoodRanges(
      xWhite.map(v => v > 0),
      itemWidth,
    ),
  );
  const xRangeMinLength = 0.05 * itemWidth;
  const xItemWidths = _.map(
    _.flatten(xRangess).filter(
      ({ start, length }) =>
        start !== 0 && start + length !== width && length < itemWidth && length > xRangeMinLength,
    ),
    'length',
  );
  if (xItemWidths.length) {
    itemWidth = _.min(xItemWidths)!; // 更新真正边长
  }

  // 调整行范围
  yRanges.forEach(range => {
    const end = range.start + range.length;
    range.start = end - itemWidth;
    range.length = itemWidth;
  });
  const yRangeSpacing = _.dropRight(yRanges).map(({ start, length }, i) => {
    const curEnd = start + length;
    const nextStart = yRanges[i + 1].start;
    return nextStart - curEnd;
  });
  const yRangeSpacingMedian = median(yRangeSpacing);
  const yRangeSpacingMedianRound = Math.round(yRangeSpacingMedian);
  yRangeSpacing.forEach((v, i) => {
    // 如果行间隔差距太大则调整
    if (Math.abs(v - yRangeSpacingMedian) / yRangeSpacingMedian < 0.03) return;
    const range1 = yRanges[i];
    const range2 = yRanges[i + 1];
    // 最后一行，直接调整
    if (i + 1 === yRangeSpacing.length) {
      range2.start = range1.start + range1.length + yRangeSpacingMedianRound;
      yRangeSpacing[i] = yRangeSpacingMedianRound;
      return;
    }
    // 否则根据下一行来平均
    const range3 = yRanges[i + 2];
    range2.start = Math.round((range1.start + range3.start) / 2);
    yRangeSpacing[i] = range2.start - (range1.start + range1.length);
    yRangeSpacing[i + 1] = range3.start - (range2.start + range2.length);
  });

  // 材位置的线性回归
  const xOccu = itemWidth * (1 + ITEM_X_SPACE_RATIO);
  const xCents = _.flatten(xRangess).map(({ start, length }) => start + length / 2);
  const firstXCent = _.min(xCents)!;
  const firstColOffset = Math.ceil(firstXCent / xOccu);
  const xPoints = xCents.map(y => [firstColOffset + Math.round((y - firstXCent) / xOccu), y]);
  const yPoints = yRanges.map(({ start, length }, x) => {
    const y = start + length / 2;
    return [x, y];
  });

  const getMidX = linearRegressionLine(linearRegression(xPoints));
  const getMidY = linearRegressionLine(linearRegression(yPoints));

  // 取得所有素材位置
  const trueItemWidth = Math.round(itemWidth * scale);
  const colNum = Math.floor((width + itemWidth * (1 + ITEM_X_SPACE_RATIO)) / xOccu);
  const rowNum = yRanges.length;

  const xPoss = _.range(colNum)
    .map(col => {
      const midX = getMidX(col);
      const x = Math.round((midX - itemWidth / 2) * scale);
      const left = (midX - (itemWidth * ITEM_VIEW_SCALE) / 2) / width;
      const right = 1 - (midX + (itemWidth * ITEM_VIEW_SCALE) / 2) / width;
      return {
        pos: { x },
        view: { left, right },
      };
    })
    .filter(({ pos: { x } }) => x >= 0 && x + trueItemWidth <= origImg.getWidth());
  const yPoss = _.range(rowNum).map(row => {
    const midY = getMidY(row);
    const y = Math.round((midY - itemWidth / 2) * scale);
    const top = (midY - (itemWidth * ITEM_VIEW_SCALE) / 2) / height;
    const bottom = 1 - (midY + (itemWidth * ITEM_VIEW_SCALE) / 2) / height;
    return {
      pos: { y, l: trueItemWidth },
      view: { top, bottom },
    };
  });

  const posisions = _.flatMap(_.uniqBy(_.flatten(xPoss), 'pos.x'), xPos =>
    _.uniqBy(_.flatten(yPoss), 'pos.y').map(yPos =>
      _.merge(
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
    posisions.forEach(({ pos: { x, y } }) => {
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
      for (let ix = 0; ix < width; ix++) {
        for (let iy = start; iy < start + length; iy++) {
          const idx = debugRowImg.getPixelIndex(ix, iy);
          debugRowImg.bitmap.data[idx] = 200;
        }
      }
    });
    debugImgs.push(debugRowImg);

    // debug col
    const debugColImg = edgeImg.clone();
    xRangess.forEach((xRanges, irow) => {
      const row = yRanges[irow];
      xRanges.forEach(({ start, length }) => {
        for (let ix = start; ix < start + length; ix++) {
          for (let iy = row.start; iy < row.start + row.length; iy++) {
            const idx = debugColImg.getPixelIndex(ix, iy);
            debugColImg.bitmap.data[idx] = 200;
          }
        }
      });
    });
    debugImgs.push(debugColImg);
  }

  return {
    debugImgs,
    posisions,
    itemWidth: Math.round(itemWidth * scale),
  };
};
