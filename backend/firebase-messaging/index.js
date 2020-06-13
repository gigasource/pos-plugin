const admin = require('firebase-admin')

module.exports = cms => {
  const config = APP_CONFIG.firebaseAdminConfig
  admin.initializeApp({
    credential: admin.credential.cert(config)
  })

  cms.on('sendOrderMessage', async (storeId, orderData) => {
    const store = await cms.getModel('Store').findById(storeId)
    const topic = store.id

    const message = {
      notification: {
        title: store.name,
        body: 'You have a new order!'
      },
      android: {
        notification: {
          sound: 'bell'
        },
        priority: 'high'
      },
      apns: {
        payload: {
          aps: {
            sound: 'bell.aiff',
            contentAvailable: true
          },
        }
      },
      topic
    }

    try {
      const response = await admin.messaging().send(message)
      console.debug(`sentry:orderToken=${orderData.orderToken},store=${store.name},alias=${store.alias}`,
        `Sent firebase notification, messageId: '${response}'`);
    } catch (e) {
      console.debug(`sentry:orderToken=${orderData.orderToken},store=${store.name},alias=${store.alias}`,
        `Error sending firebase notification`, e)
    }
  })
}

