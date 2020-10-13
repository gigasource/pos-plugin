const path = require('path');
const fs = require('fs');
global.phantomPath = path.resolve(process.argv[0], '../phantomjs');
console.log('current version: ', require('../../package').version);
const argv = require('yargs').argv;
if (!argv.mode) process.argv.push('--mode=ios');
require('../common-index');
