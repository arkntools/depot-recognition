import { readdirSync, readFileSync } from 'fs';
import { join, resolve } from 'path';
import { DeportRecognizer, toSimpleTrustedResult } from '../src';

beforeAll(() => {
  jest.spyOn(console, 'warn').mockImplementation(() => {});
});

const getCache = (name: string) => {
  const path = resolve(__dirname, 'cache', name);
  if (name.endsWith('.json')) return JSON.parse(readFileSync(path).toString());
  return readFileSync(path);
};

export const run = (dir: string) => {
  const rp = (path: string) => join(dir, path);
  test('recognition', async () => {
    const dr = new DeportRecognizer({
      order: getCache('itemOrder.json'),
      pkg: getCache('item.pkg'),
    });
    const imgName = readdirSync(dir).find(name => name.startsWith('image'))!;
    const { data } = await dr.recognize(rp(imgName));
    expect(toSimpleTrustedResult(data)).toEqual(
      JSON.parse(readFileSync(rp('result.json')).toString()),
    );
  });
};
