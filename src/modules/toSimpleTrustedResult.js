import { isTrustedResult } from './isTrustedResult';

/**
 * @param {[key: string, value: any][]} pairs
 */
const fromPairs = pairs => {
  const obj = {};
  pairs.forEach(([k, v]) => (obj[k] = v));
  return obj;
};

/**
 * Convert recognition result to simple trust result.
 * @param {*} data Recognition result object
 * @returns {{ [name: string]: number }} A simple result object
 */
export const toSimpleTrustedResult = data =>
  fromPairs(data.filter(isTrustedResult).map(({ num: { value }, sim: { name } }) => [name, value]));
