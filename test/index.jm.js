import { readdirSync, readFileSync } from 'fs';
import { join, resolve } from 'path';
import { DeportRecognizer, toUniversalResult } from '../src';

Object.defineProperty(global, 'ImageData', {
  value: class ImageData {
    constructor(data, width, height) {
      Object.defineProperties(this, {
        data: { value: data },
        width: { value: width },
        height: { value: height },
      });
    }
  },
});

beforeAll(() => {
  jest.spyOn(console, 'warn').mockImplementation(() => {});
});

/**
 * @param {string} name
 */
const getCache = name => {
  const path = resolve(__dirname, 'cache', name);
  if (name.endsWith('.json')) return require(path);
  return readFileSync(path);
};

export default dir => {
  const rp = path => join(dir, path);
  test('recognition', async () => {
    const dr = new DeportRecognizer({
      order: getCache('itemOrder.json'),
      pkg: getCache('item.zip'),
    });
    const imgName = readdirSync(dir).find(name => name.startsWith('image'));
    const { data } = await dr.recognize(rp(imgName));
    expect(toUniversalResult(data)).toEqual(require(rp('result.json')));
  });
};
