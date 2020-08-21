const {firebaseAdminInstance} = require('./admin')
const dayjs = require('dayjs')
const {NOTIFICATION_ACTION_TYPE} = require('../restaurant-plus-apis/constants');

module.exports = cms => {
  const admin = firebaseAdminInstance()
  cms.on('sendOrderMessage', async (storeId, orderData) => {
    const store = await cms.getModel('Store').findById(storeId)
    /** @deprecated */
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
        type: 'order',
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
      }
    }

    try {
      /** @deprecated */
      const response = await admin.messaging().send({...message, topic})

      const devices = await cms.getModel('Device').find({ storeId: storeId, firebaseToken: { $exists: true } })

      await admin.messaging().sendAll(devices.map(d => ({
        ...message,
        token: d.firebaseToken
      })))
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
      }
    }

    try {
      /** @deprecated */
      const response = await admin.messaging().send({...message, topic})

      const devices = await cms.getModel('Device').find({ storeId: storeId, firebaseToken: { $exists: true } })

      await admin.messaging().sendAll(devices.map(d => ({
        ...message,
        token: d.firebaseToken
      })))
      console.debug(`sentry:store=${storeName},alias=${storeAlias},eventType=reservation`,
        `3a. Online order backend: Sent firebase reservation notification, messageId: '${response}'`);
    } catch (e) {
      console.debug(`sentry:store=${storeName},alias=${storeAlias},eventType=reservation`,
        `3a. Online order backend: Error sending firebase reservation notification`, e)
    }
  })

  cms.on('chatMessage', async ({chatData, fromServer = true}) => {
    const {clientId, userId, text} = chatData

    const tokens = [];

    if (fromServer) {
      const device = await cms.getModel('Device').findById(clientId)
      if (device.firebaseToken) tokens.push(device.firebaseToken)
    }

    const relatedUsers = await cms.getModel('ChatMessage').aggregate([
      {"$match": {"clientId": clientId}},
      {"$group": { _id: "$userId"}},
    ]);
    const usersToken = (await cms.getModel('User').find({_id: relatedUsers.map(u => u._id)}, {firebaseToken: 1})).map(u => u.firebaseToken).filter(token => token);
    tokens.push(...usersToken);

    const message = {
      notification: {
        title: 'New message',
        body: text,
      },
      android: {
        notification: {
          sound: 'pristine',
          channel_id: 'GSMS_Support'
        },
        priority: 'high'
      },
      apns: {
        payload: {
          aps: {
            sound: 'pristine.aiff',
            contentAvailable: true
          },
        }
      },
    }

    const sentryTags = `sentry:eventType=gsmsChat,clientId=${clientId},userId=${userId}`;
    const sentryPayload = JSON.stringify(chatData, null, 2);

    try {
      await admin.messaging().sendAll(tokens.map(t => ({
        ...message,
        token: t
      })))
      console.debug(sentryTags, `Online order backend: Sent support message notification`, sentryPayload);
    } catch (e) {
      console.debug(sentryTags, `Online order backend: Error sending support message notification`, sentryPayload);
    }
  })

  cms.on('newGsmsDevice', async newDevice => {
    const tokens = (await cms.getModel('User').find({}, {firebaseToken: 1})).map(u => u.firebaseToken).filter(token => token);
    const message = {
      notification: {
        title: 'New device',
        body: newDevice.name + ((newDevice.metadata && newDevice.metadata.deviceLocation)||""),
      },
      android: {
        notification: {
          sound: 'pristine',
          channel_id: 'GSMS_Support'
        },
        priority: 'high'
      },
      apns: {
        payload: {
          aps: {
            sound: 'pristine.aiff',
            contentAvailable: true
          },
        }
      },
    }
    try {
      await admin.messaging().sendAll(tokens.map(t => ({
        ...message,
        token: t
      })))
      console.log(`Online order backend: Sent new device notification`);
    } catch (e) {
      console.log(`Online order backend: Error sending new device notification`, e);
    }
  });

  cms.on('newSignInRequest', async request => {
    const tokens = (await cms.getModel('User').find({}, {firebaseToken: 1})).map(u => u.firebaseToken).filter(token => token);
    const message = {
      notification: {
        title: 'New sign in request',
        body: request.deviceName + " - " + (request.storeName ? request.storeName : request.deviceLocation),
      },
      android: {
        notification: {
          sound: 'pristine',
          channel_id: 'GSMS_Support'
        },
        priority: 'high'
      },
      apns: {
        payload: {
          aps: {
            sound: 'pristine.aiff',
            contentAvailable: true
          },
        }
      },
    }
    try {
      await admin.messaging().sendAll(tokens.map(t => ({
        ...message,
        token: t
      })))
      console.log(`Online order backend: Sent new sign in request notification`);
    } catch (e) {
      console.log(`Online order backend: Error sending new sign in request notification`, e);
    }
  })

  cms.on('sendTicket', async ({title, body, tokens}) => {
    const message = {
      notification: {
        title,
        body,
      },
      android: {
        notification: {
          sound: 'pristine',
          channel_id: 'GSMS_Support'
        },
        priority: 'high'
      },
      apns: {
        payload: {
          aps: {
            sound: 'pristine.aiff',
            contentAvailable: true
          },
        }
      },
    }
    try {
      await admin.messaging().sendAll(tokens.map(t => ({
        ...message,
        token: t
      })))
      console.log(`Online order backend: Sent ticket notification`);
    } catch (e) {
      console.log(`Online order backend: Error sending ticket notification`, e);
    }
  })

  cms.on('sendClientReservationStatus', async reservationId => {
    const reservation = await cms.getModel('Reservation').findById(reservationId).lean()
    if (!reservation.userId) return
    const user = await cms.getModel('RPUser').findById(reservation.userId)
    const store = await cms.getModel('Store').findById(reservation.store)
    const reservationDate = dayjs(reservation.date, 'YYYY-MM-DD').format('MMM DD')

    const storeName = store.name || store.settingName;
    const message = {
      notification: {
        title: `Reservation ${reservation.status}`,
        body: `Your reservation at ${storeName} at ${reservation.time}, ${reservationDate} is ${reservation.status}`,
      },
      data: {
        actionType: NOTIFICATION_ACTION_TYPE.TABLE_RESERVATION,
        reservation: JSON.stringify({ ...reservation, storeName, storePhone: store.phone })
      },
      token: user.firebaseToken
    }

    try {
      const response = await admin.messaging().send(message)
      console.debug(`sentry:eventType=reservation,store=${store.name},alias=${store.alias},reservationId=${reservationId}`,
        `5. Online order backend: sent reservation notification to end user: ${response}`)
    } catch (e) {
      console.log('failed to send reservation update notification')
    }
  })
}

