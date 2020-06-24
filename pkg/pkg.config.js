const path = require('path');
const pathToBoilerplate = '../../../';
const config = require(`${pathToBoilerplate}config/config.js`);
const pluginsPath = path.resolve(__dirname, `${pathToBoilerplate}plugins`);
const fs = require('fs');

const gitHash = {};

if (fs.existsSync('../.git')) {
  gitHash['pos-plugin'] = fs.readFileSync('../.git/ORIG_HEAD', {encoding: 'utf8'});
}
if (fs.existsSync(`${pathToBoilerplate}/.git`)) {
  gitHash['cms-boilerplate'] = fs.readFileSync(`${pathToBoilerplate}/.git/ORIG_HEAD`, {encoding: 'utf8'});
}
if (fs.existsSync(`${pathToBoilerplate}/.git/modules/cms`)) {
  gitHash['cms'] = fs.readFileSync(`${pathToBoilerplate}/.git/modules/cms/ORIG_HEAD`, {encoding: 'utf8'});
}
if (fs.existsSync(`${pathToBoilerplate}/.git/modules/backoffice`)) {
  gitHash['backoffice'] = fs.readFileSync(`${pathToBoilerplate}/.git/modules/backoffice/ORIG_HEAD`, {encoding: 'utf8'});
}

fs.writeFileSync('./android/hash.json', JSON.stringify(gitHash));

const pkgConfig = {
  assets: [`${pathToBoilerplate}dist/**/*`, `${pathToBoilerplate}config/config.js`, `${pathToBoilerplate}package.json`, `${pathToBoilerplate}cms/package.json`, `${pathToBoilerplate}plugins/*/dist/**/*`],
  scripts: []
};

pkgConfig.assets.push['./android/hash.json'];

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
