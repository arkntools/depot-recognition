import { RecognizeResult } from '..';
import { RecognizeSimilarityResult } from '../lib/similarity';

export type RecognizeResultTrusted = Required<RecognizeResult>;

export const MAX_SHOW_DIFF = 0.22;

export const MAX_TRUST_DIFF: Readonly<Record<string, number | undefined> & { DEFAULT: number }> = {
  DEFAULT: 0.2,
  30021: 0.15,
  30041: 0.12,
  30042: 0.12,
  30043: 0.12,
  30044: 0.12,
  30062: 0.15,
  31024: 0.22,
};

export const isTrustedSimResult = (
  sim?: RecognizeSimilarityResult | null,
): sim is RecognizeSimilarityResult => {
  if (!sim) return false;
  const { diff, name } = sim;
  const maxTrustDiff = MAX_TRUST_DIFF[name] ?? MAX_TRUST_DIFF.DEFAULT;
  return diff < maxTrustDiff;
};

/** Determine whether a similarity result is trustable */
export const isTrustedResult = (
  result?: RecognizeResult | null,
): result is RecognizeResultTrusted => isTrustedSimResult(result?.sim);

const fromPairs = (pairs: Array<[string, any]>): Record<string, any> => {
  const obj: Record<string, any> = {};
  pairs.forEach(([k, v]) => (obj[k] = v));
  return obj;
};

/** Convert recognition result to simple trust result. */
export const toSimpleTrustedResult = (
  data: RecognizeResult[],
): Record<string, number | undefined> =>
  fromPairs(data.filter(isTrustedResult).map(({ num: { value }, sim: { name } }) => [name, value]));
