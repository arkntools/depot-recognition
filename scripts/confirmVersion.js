const { spawn } = require('child_process');
const yesno = require('yesno');
const { version } = require('../package.json');

(async () => {
  const ok = await yesno({
    question: `Are you sure you want to publish v${version}?`,
    defaultValue: null,
  });
  if (!ok) process.exit();
  spawn(`git push && git push origin v${version}`, {
    shell: true,
    stdio: 'inherit',
  });
})();
