const path = require('path');
const pathToBoilerplate = '../../../';
const config = require(`${pathToBoilerplate}config/config.js`);
const pluginsPath = path.resolve(__dirname, `${pathToBoilerplate}plugins`);
const fs = require('fs');

const gitHash = {};

const pkgConfig = {
  assets: [`${pathToBoilerplate}dist/**/*`, `${pathToBoilerplate}config/config.js`, `${pathToBoilerplate}package.json`, `${pathToBoilerplate}cms/package.json`, `${pathToBoilerplate}plugins/*/dist/**/*`],
  scripts: []
};

// canvas asset
pkgConfig.assets.push('../node_modules/@gigasource/canvaskit-printer-renderer/assets/fonts/Verdana.ttf');
pkgConfig.assets.push('../node_modules/@gigasource/canvaskit-printer-renderer/assets/fonts/Verdana_Bold.ttf');
pkgConfig.assets.push('../node_modules/@gigasource/canvaskit-printer-renderer/assets/fonts/Verdana_Italic.ttf');
pkgConfig.assets.push('../node_modules/@gigasource/canvaskit-printer-renderer/assets/fonts/Verdana_Bold_Italic.ttf');
pkgConfig.assets.push('../node_modules/canvaskit-wasm/bin/canvaskit.wasm');

for (let pluginId in config.plugins) {
  const pluginPath = `${pluginsPath}/${config.plugins[pluginId].name}`
  const manifestData = require(`${pluginPath}/manifest`);
  for (let fileId in manifestData.files) {
    const file = manifestData.files[fileId];
    if (file.loader && file.loader.type.includes('backend')) {
      pkgConfig.scripts.push(path.relative(__dirname, `${pluginPath}/${file.path}`));
    }
  }
  const fileList = fs.readdirSync(pluginPath);
  for (let fileId in fileList) {
    const file = fileList[fileId];
    if (file.includes('node_modules') || file.includes('.git') || file.includes('pkg')) continue;
    if (fs.statSync(`${pluginPath}/${file}`).isDirectory()) {
      pkgConfig.assets.push(`${path.relative(__dirname, `${pluginPath}/${file}`)}/**/*`)
    } else {
      pkgConfig.assets.push(path.relative(__dirname, `${pluginPath}/${file}`));
    }
  }
}

console.log(pkgConfig);

module.exports = pkgConfig;
