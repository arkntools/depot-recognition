import { isTrustSim } from './trustSim';

/**
 * @param {[key: string, value: any][]} pairs
 */
const fromPairs = pairs => {
  const obj = {};
  pairs.forEach(([k, v]) => (obj[k] = v));
  return obj;
};

/**
 * @param {*} data Recognition result object
 * @returns {{ [name: string]: number }} A simple result object
 */
export const toUniversalResult = data =>
  fromPairs(
    data
      .filter(({ sim }) => isTrustSim(sim))
      .map(({ num: { value }, sim: { name } }) => [name, value]),
  );
