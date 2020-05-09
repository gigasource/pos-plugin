const uploader = require('./upload');
const argv = require('yargs').argv;
const upload = new uploader({domain: argv.domain, apiBaseUrl: '/cms-files'});
const version = require('../package').version;
const path = require('path');
const appName = 'pos-restaurant.apk'
console.log("The domain is", argv.domain);
upload({
  filePath: path.resolve(__dirname, `./android-dist/originalBuild/${appName}`),
  group: 'POS_Android',
  version: version,
  type: 'APK',
  base: process.env.BASE_VERSION || '1.0.0',
  release: 'Stable',
  note: 'New version'
})
upload({
  filePath: path.resolve(__dirname, './android-dist/originalBuild/app/assets/appAssets/patch/patch_signed_7zip.apk'),
  group: 'POS_Android',
  version: version,
  type: 'PATCH',
  base: process.env.BASE_VERSION || '1.0.0',
  release: 'Stable',
  note: 'New version'
})
