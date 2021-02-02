const fs = require('fs');
const _ = require('lodash');
const path = require('path');

module.exports = async function (cms) {
  cms.on('init-data-complete', async () => {
    try {
      console.log('initDemoData')
      const pluginPath = cms.allPlugins['pos-plugin'].pluginPath;
      const dataPath = path.join(pluginPath, 'backend', 'initDemoData', 'demoData.json');
      if (fs.existsSync(dataPath) && fs.statSync(dataPath).isFile()) {
        const data = JSON.parse(fs.readFileSync(dataPath, 'utf-8'));

        for (const collection in data) {
          if (data.hasOwnProperty(collection)) {
            await Promise.all(data[collection].map(async document => {
              try {
                if (document._id){
                  await cms.getModel(collection).findOneAndUpdate({_id: document._id}, document, {upsert: true, new: true})
                } else {
                  await cms.getModel(collection).create(document);
                }
              } catch (e) {
                console.warn(e);
              }
            }))
          }
        }
      }
      console.log('initDemoData completed')
    } catch (e) {
      console.log(e)
    }
  })
};
