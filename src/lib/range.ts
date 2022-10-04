import _ from 'lodash';

export interface Range {
  start: number;
  length: number;
}

export const getRangeEnd = ({ start, length }: Range): number => start + length;

export const inRange = (x: number, { start, length }: Range): boolean =>
  start <= x && x < start + length;

export const findRange = (x: number, ranges: Range[]): Range | undefined =>
  ranges.find(range => inRange(x, range));

export const findRangeIndex = (x: number, ranges: Range[]): number =>
  _.findIndex(ranges, range => inRange(x, range));

export const getRanges = (arr: boolean[]): Range[] =>
  _.transform<boolean, Range[]>(
    arr,
    (a, inRange, x) => {
      if (!a.length) {
        if (inRange) a.push({ start: x, length: 1 });
        return;
      }
      if (inRange) {
        const last = _.last(a)!;
        if (x === getRangeEnd(last)) last.length++;
        else a.push({ start: x, length: 1 });
      }
    },
    [],
  );

export const getRangesBy: {
  (arr: boolean[], fn: (range: Range) => boolean): Range[];
  <T = any>(
    arr: boolean[],
    fn: (range: Range, data: T) => boolean,
    preCalc: (ranges: Range[]) => T,
  ): Range[];
} = (
  arr: boolean[],
  fn: (range: Range, data: any) => boolean,
  preCalc?: (ranges: Range[]) => any,
): Range[] => {
  const ranges = getRanges(arr);
  const data = preCalc?.(ranges);
  return ranges.filter(range => fn(range, data));
};

export const removeRangesNoise = (ranges: Range[], size = 1): Range[] =>
  _.remove(ranges, ({ length }) => length <= size);
