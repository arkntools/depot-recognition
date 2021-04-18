import { readdirSync, readFileSync } from 'fs';
import { join, resolve } from 'path';
import { DeportRecognizer } from '../src';
import getUniversalResult from '../src/getUniversalResult';

jest.mock('../src/requirements');

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
    expect(getUniversalResult(data)).toEqual(require(rp('result.json')));
  });
};
