const admin = require('firebase-admin')
const dayjs = require('dayjs')

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
          sound: 'bell',
          channelId: 'GSMS_Order'
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
        `3a. Online order backend: Sent firebase order notification, messageId: '${response}'`);
    } catch (e) {
      console.debug(`sentry:orderToken=${orderToken},store=${storeName},alias=${storeAlias},eventType=orderStatus`,
        `3a. Online order backend: Error sending order firebase notification`, e)
    }
  })

  cms.on('sendReservationMessage', async (storeId, reservationData) => {
    const store = await cms.getModel('Store').findById(storeId)
    const topic = store.id
    const storeName = store.name || store.settingName;
    const storeAlias = store.alias;
    const {date, time} = reservationData
    const displayDate = dayjs(date, 'YYYY-MM-DD').format('MMM DD')

    const message = {
      notification: {
        title: storeName,
        body: `You have a new reservation (${displayDate} - ${time})!`,
      },
      data: {
        storeName,
        storeAlias
      },
      android: {
        notification: {
          sound: 'impressed',
          channel_id: 'GSMS_Reservation'
        },
        priority: 'high'
      },
      apns: {
        payload: {
          aps: {
            sound: 'impressed.aiff',
            contentAvailable: true
          },
        }
      },
      topic
    }

    try {
      const response = await admin.messaging().send(message)
      console.debug(`sentry:store=${storeName},alias=${storeAlias},eventType=reservation`,
        `3a. Online order backend: Sent firebase reservation notification, messageId: '${response}'`);
    } catch (e) {
      console.debug(`sentry:store=${storeName},alias=${storeAlias},eventType=reservation`,
        `3a. Online order backend: Error sending firebase reservation notification`, e)
    }
  })
}

