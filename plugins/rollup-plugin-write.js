import { writeFileSync } from 'fs';

export default (options = {}) => {
  const { hook = 'writeBundle', once = true, targets = [] } = options;
  let done = false;
  return {
    name: 'write',
    [hook]: () => {
      if (once && done) return;
      for (const { path, data } of targets) {
        writeFileSync(path, data);
      }
      done = true;
    },
  };
};
