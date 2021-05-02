export const MAX_SHOW_DIFF = 0.22;

export const MAX_TRUST_DIFF = {
  DEFAULT: 0.2,
  30021: 0.15,
  30041: 0.12,
  30042: 0.12,
  30043: 0.12,
  30044: 0.12,
  30062: 0.15,
  31024: 0.22,
};

/**
 * @typedef SimilarityObject
 * @property {string} name
 * @property {diff} number
 */

/**
 * Determine whether a similarity result is trustable.
 * @param {SimilarityObject | { sim: SimilarityObject }} result Similarity result
 * @returns {boolean} Trustable
 */
export const isTrustedResult = result => {
  if (!result) return false;
  const { diff, name } = result.sim || result;
  const maxTrustDiff = name in MAX_TRUST_DIFF ? MAX_TRUST_DIFF[name] : MAX_TRUST_DIFF.DEFAULT;
  return diff < maxTrustDiff;
};
