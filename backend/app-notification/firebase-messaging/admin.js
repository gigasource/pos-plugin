const admin = require('firebase-admin')
let firebaseAdminInstance

module.exports = cms => {
  const config = APP_CONFIG.firebaseAdminConfig
  firebaseAdminInstance = admin.initializeApp({
    credential: admin.credential.cert(config)
  })
};

module.exports.firebaseAdminInstance = function () {
  return firebaseAdminInstance
}
