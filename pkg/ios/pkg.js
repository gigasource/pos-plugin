require('giga-pkg-patches');
const {exec} = require('pkg');
const path = require('path');
const cp = require('child_process');
cp.execSync('rm -rf json-monaco && rm -rf js/monaco-editor-core && rm -rf js/monaco-languages && rm -rf js/monaco-typescript && rm -rf release', {
  cwd: path.resolve(__dirname, '../../../../dist')
})
if (process.cwd() === __dirname) {
  process.chdir('../');
}
const argv = ['--config', 'pkg.config.js', '--targets', 'node10-linux-x64', '--output', './build/app-ios', 'ios/index.js', '--no-bytecode', '--public', '--public-packages', '*'];
exec(argv);
