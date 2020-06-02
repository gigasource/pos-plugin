const semver = require('semver')

module.exports = (cms) => {
  cms.on('migrate-data', async () => {
    try {
      const pluginVersion = await cms.utils.getLastVersion('pos-plugin')
      const lastVersion = !pluginVersion ? '0.0.0' : pluginVersion

      // check versions here
      if (semver.gt('1.0.23', lastVersion)) { // migrate fees to zipCodeFees
        const stores = await cms.getModel('Store').find().lean()

        await Promise.all(stores.map(async store => {
          const fees = store.deliveryFee.fees || []
          await cms.getModel('Store').updateOne({ _id: store._id }, {
              deliveryFee: Object.assign({}, store.deliveryFee, {zipCodeFees: fees, type: 'zipCode'})
          })
        }))
        console.log(`Migrated data from ${lastVersion} to be compatible with v1.0.23`)
      }
    } catch (e) {
      console.log(e)
    }
  })
}
