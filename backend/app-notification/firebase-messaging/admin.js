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

module.exports.notifyToClient = async function (type = "", title = "", message = "", token = "") {
  const firebaseMsg = {
    notification: {
      title,
      body: message
    },
    data: {
      type,
      message
    }
  }
  return firebaseAdminInstance.messaging().sendToDevice(
      [token],
      {...firebaseMsg},
      {
        contentAvailable: true,
        priority: 'high',
      }
  )
}
