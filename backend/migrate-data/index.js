const fs = require('fs');
const path = require('path');

module.exports = (cms) => {
  cms.on('migrate-data', async () => {
    try {
      if (!cms.utils.getShouldUpdateApp()) return
      const pluginPath = cms.allPlugins['pos-plugin'].pluginPath;
      const packagePath = path.join(pluginPath, 'package.json')
      if (fs.existsSync(packagePath)) {
        const pkgRaw = JSON.parse(fs.readFileSync(packagePath, 'utf8'))
        const version = pkgRaw.version
        if (version === '1.0.23')  { //migrate fees to zipCodeFees
          const stores = await cms.getModel('Store').find().lean()
          for(const store of stores) {
            const fees = store.deliveryFee.fees || []
            console.log(fees)
            await cms.getModel('Store').updateOne({_id: store._id}, {
              deliveryFee: Object.assign({}, store.deliveryFee, {zipCodeFees: fees})
            })
          }
        }
      }
    } catch (e) {
      console.log(e)
    }
  })
}
