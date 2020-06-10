const semver = require('semver')

module.exports = (cms) => {
  cms.on('migrate-data', async () => {
    try {
      const pluginVersion = await cms.utils.getLastVersion('pos-plugin')
      const lastVersion = !pluginVersion ? '0.0.0' : pluginVersion

      // check versions here
      if (semver.gt('1.1.9', lastVersion)) { // add Paypal to payment methods
        const posSettings = await cms.getModel('PosSetting').findOne()
        if (!posSettings.payment.some(item => item.name.toLowerCase() === 'paypal')) {
          posSettings.payment.push({
            _id: '5ed8b1c7b8bb04f8cf1e4ad4',
            name: 'paypal',
            icon: 'data:image/png;base64,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',
            editable: true
          })
          await cms.getModel('PosSetting').findOneAndUpdate({}, posSettings)
          console.log(`Migrated data from ${lastVersion} to be compatible with v1.1.9`)
        }
      }
    } catch (e) {
      console.log(e)
    }
  })
}
