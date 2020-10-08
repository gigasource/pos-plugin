const apn = require('apn')
let apnProviderInstance

module.exports = cms => {
  const apnOptions = {
    token: APP_CONFIG.apnToken,
    production: true
  }
  apnProviderInstance = new apn.Provider(apnOptions)
}

module.exports.getApnProvider = () => apnProviderInstance
