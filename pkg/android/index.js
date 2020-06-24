const path = require('path');
const fs = require('fs');
global.phantomPath = path.resolve(process.argv[0], '../phantomjs');
console.log('current version: ', require('../../package').version);
if (fs.existsSync('./hash.json')) {
  console.log(require('./hash.json'));
}
require('../common-index');
