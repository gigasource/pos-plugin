const admin = require('firebase-admin')

module.exports = cms => {
  const config = APP_CONFIG.firebaseAdminConfig
  admin.initializeApp({
    credential: admin.credential.cert(config)
  })

  cms.on('sendOrderMessage', async (storeId, orderData) => {
    const store = await cms.getModel('Store').findById(storeId)
    const topic = store.id
    const { orderToken } = orderData
    const storeName = store.name || store.settingName;
    const storeAlias = store.alias;

    const message = {
      notification: {
        title: storeName,
        body: 'You have a new order!'
      },
      data: {
        orderToken,
        storeName,
        storeAlias
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
      console.debug(`sentry:orderToken=${orderToken},store=${storeName},alias=${storeAlias},eventType=orderStatus`,
        `3a. Online order backend: Sent firebase notification, messageId: '${response}'`);
    } catch (e) {
      console.debug(`sentry:orderToken=${orderToken},store=${storeName},alias=${storeAlias},eventType=orderStatus`,
        `3a. Online order backend: Error sending firebase notification`, e)
    }
  })
}

