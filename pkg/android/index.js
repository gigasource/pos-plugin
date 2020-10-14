const path = require('path');
const fs = require('fs');
global.phantomPath = path.resolve(process.argv[0], '../phantomjs');
console.log('current version: ', require('../../package').version);
// if (!fs.existsSync('/sdcard/data')) {
// 	fs.mkdirSync('/sdcard/data');
// 	fs.writeFileSync('/sdcard/data/storage.bson', 'NAAAAANzdG9yYWdlACYAAAACZW5naW5lAAcAAABtb2JpbGUAA29wdGlvbnMABQAAAAAAAAo=', 'base64');
// }
const argv = require('yargs').argv;
if (!argv.mode) process.argv.push('--mode=android-embedded');
require('../common-index');
