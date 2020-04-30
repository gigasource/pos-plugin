const uploader = require('./upload');
const argv = require('yargs').argv;
const upload = new uploader({domain: argv.domain, apiBaseUrl: '/cms-files'});
const version = require('../package').version;
const path = require('path');
console.log("The domain is", argv.domain);
upload({
  filePath: path.resolve(__dirname, './android-dist/originalBuild/app-release.apk'),
  group: 'POS_Android',
  version: version,
  type: 'APK',
  base: '1.0.1',
  release: 'Stable',
  note: 'New version'
})
upload({
  filePath: path.resolve(__dirname, './android-dist/originalBuild/app/assets/appAssets/patch/patch_signed_7zip.apk'),
  group: 'POS_Android',
  version: version,
  type: 'PATCH',
  base: '1.0.1',
  release: 'Stable',
  note: 'New version'
})
