import { writeFileSync } from 'fs';

export default (options = {}) => {
  const { hook = 'buildEnd', targets = [] } = options;
  return {
    name: 'write',
    [hook]: () => {
      for (const { path, data } of targets) {
        writeFileSync(path, data);
      }
    },
  };
};
