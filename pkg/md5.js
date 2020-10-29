const md5 = require('md5');
const fs = require('fs');
const argv = require('yargs').argv;

const data = fs.readFileSync(`build/app-${argv.platform}`);
fs.writeFileSync(`build/data-${argv.platform}`, md5(data));
