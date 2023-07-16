import { lstatSync, readFileSync, readdirSync } from 'fs';
import { resolve } from 'path';
import { DeportRecognizer, toSimpleTrustedResult } from '../../src';

const getCache = (name: string) => {
  const path = resolve(__dirname, '../cache', name);
  if (name.endsWith('.json')) return JSON.parse(readFileSync(path).toString());
  return readFileSync(path);
};

describe('cases', () => {
  const dr = new DeportRecognizer({
    order: getCache('itemOrder.json'),
    pkg: getCache('item.pkg'),
  });
  const cases = readdirSync(__dirname).filter(
    dir => !dir.startsWith('.') && lstatSync(resolve(__dirname, dir)).isDirectory(),
  );
  test.each(cases)('%s', async dir => {
    const dirPath = resolve(__dirname, dir);
    const imgName = readdirSync(dirPath).find(name => name.startsWith('image'))!;
    const { data } = await dr.recognize(resolve(dirPath, imgName));
    expect(toSimpleTrustedResult(data)).toEqual(
      JSON.parse(readFileSync(resolve(dirPath, 'result.json')).toString()),
    );
  });
});
