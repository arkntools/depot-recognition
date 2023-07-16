import { findLast, sortBy } from 'lodash';
import Jimp from '../utils/jimp';
import { isDiffsTooClose, isTrustedSimResult } from '../utils/trustedResult';

export interface RecognizeSimilarityResult {
  /** ID of most similar material */
  name: string;
  /** The degree of difference (0~1) between them */
  diff: number;
  /** Comparative record of the material, an array of material ID and difference degree */
  diffs: Array<[string, number]>;
  /** Whether the differences are too close, should be careful with the result */
  diffsTooClose: boolean;
}

export type CompareItemData = Array<[string, Jimp]>;

/** 相似度计算 */
const getSim = (
  input: Jimp,
  imgMap: Map<string, Jimp>,
  order: string[],
): RecognizeSimilarityResult | null => {
  if (!order.length) return null;
  const diffs = sortBy(
    order.map<[string, number]>(id => [id, Jimp.diff(input, imgMap.get(id)!, 0.2).percent]),
    1,
  );
  const [name, diff] = diffs[0];
  return { name, diff, diffs, diffsTooClose: isDiffsTooClose(diffs) };
};

/** 相似度计算（二分法） */
export const getSims = (
  inputs: Jimp[],
  imgMap: Map<string, Jimp>,
  order: string[],
): Array<RecognizeSimilarityResult | null> => {
  if (inputs.length <= 2) {
    return inputs.map(input => getSim(input, imgMap, order));
  }
  const inputCenterI = Math.floor(inputs.length / 2);
  const inputCenterSim = getSim(inputs[inputCenterI], imgMap, order);
  if (isTrustedSimResult(inputCenterSim) && !inputCenterSim.diffsTooClose) {
    // 受信结果
    const compareCenterI = order.findIndex(name => name === inputCenterSim.name);
    return [
      ...getSims(inputs.slice(0, inputCenterI), imgMap, order.slice(0, compareCenterI)),
      inputCenterSim,
      ...getSims(inputs.slice(inputCenterI + 1), imgMap, order.slice(compareCenterI + 1)),
    ];
  } else {
    // 不受信结果
    const leftSims = getSims(inputs.slice(0, inputCenterI), imgMap, order);
    const leftLastSim: RecognizeSimilarityResult | null = findLast(leftSims, sim => sim) as any;
    const rightSims = getSims(
      inputs.slice(inputCenterI + 1),
      imgMap,
      isTrustedSimResult(leftLastSim)
        ? order.slice(order.findIndex(name => name === leftLastSim.name) + 1)
        : order,
    );
    return [...leftSims, inputCenterSim, ...rightSims];
  }
};
