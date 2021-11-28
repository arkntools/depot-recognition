import _ from 'lodash';
import Jimp from 'jimp';
import { isTrustedSimResult } from '../utils/trustedResult';

export interface RecognizeSimilarityResult {
  /** ID of most similar material */
  name: string;
  /** The degree of difference (0~1) between them */
  diff: number;
  /** Comparative record of the material, an array of material ID and difference degree */
  diffs: Array<[string, number]>;
}

export type CompareItemData = Array<[string, Jimp]>;

/** 相似度计算 */
export const getSim = (
  input: Jimp,
  compares: CompareItemData,
): RecognizeSimilarityResult | null => {
  if (!compares.length) return null;
  const diffs = _.sortBy(
    compares.map<[string, number]>(([id, img]) => [id, Jimp.diff(input, img, 0.2).percent]),
    1,
  );
  const [name, diff] = diffs[0];
  return { name, diff, diffs };
};

/** 相似度计算（二分法） */
export const getSims = (
  inputs: Jimp[],
  compares: CompareItemData,
): Array<RecognizeSimilarityResult | null> => {
  if (inputs.length <= 2) {
    return inputs.map(input => getSim(input, compares));
  }
  const inputCenterI = Math.floor(inputs.length / 2);
  const inputCenterSim = getSim(inputs[inputCenterI], compares);
  if (isTrustedSimResult(inputCenterSim)) {
    // 受信结果
    const compareCenterI = compares.findIndex(([name]) => name === inputCenterSim.name);
    return [
      ...getSims(inputs.slice(0, inputCenterI), compares.slice(0, compareCenterI)),
      inputCenterSim,
      ...getSims(inputs.slice(inputCenterI + 1), compares.slice(compareCenterI + 1)),
    ];
  } else {
    // 不受信结果
    const leftSims = getSims(inputs.slice(0, inputCenterI), compares);
    const leftLastSim: RecognizeSimilarityResult | null = _.findLast(leftSims, sim => sim) as any;
    const rightSims = getSims(
      inputs.slice(inputCenterI + 1),
      isTrustedSimResult(leftLastSim)
        ? compares.slice(compares.findIndex(([name]) => name === leftLastSim.name) + 1)
        : compares,
    );
    return [...leftSims, inputCenterSim, ...rightSims];
  }
};
