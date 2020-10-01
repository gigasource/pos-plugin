const apn = require('apn');
const { firebaseAdminInstance } = require('./firebase-messaging/admin');
const { getApnProvider } = require('./apn-provider/provider');

async function sendNotification(devices, notification, payload) {
  const tokens = devices.reduce((acc, cur) => {
    if (cur.osName === 'ios' && cur.osVersion) {
      const [majorVersion] = cur.osVersion.split('.')
      if (+majorVersion < 13) {
        if (cur.apnToken) acc.apnTokens = [...acc.apnTokens, cur.apnToken]
        return acc
      }
    }
    if (cur.firebaseToken) acc.firebaseTokens = [...acc.firebaseTokens, cur.firebaseToken]
    return acc
  }, { apnTokens: [], firebaseTokens: [] })

  sendApn(notification, payload, tokens.apnTokens)
  sendFirebaseNotification(notification, payload, tokens.firebaseTokens)
}

async function sendFirebaseNotification(notification, data, tokens) {
  if (!tokens || !tokens.length) return

  const admin = firebaseAdminInstance()
  const formattedData = {
    ...data,
    notification: JSON.stringify(notification)
  }
  const message = {
    data: formattedData,
    tokens,
    apns: {
      payload: {
        aps: {
          'mutable-content': 1,
          'content-available': 1
        }
      }
    },
    android: {
      priority: 'high'
    },
  }

  const result = await admin.messaging().sendMulticast(message)
  if (result.successCount) {
    console.debug('sentry:eventType=notification', 'Success sending notification', result.responses.filter(r => !r.success))
  }
}

function sendApn(notification, payload, tokens) {
  if (!tokens || !tokens.length) return

  const apnProvider = getApnProvider()
  const note = new apn.Notification();
  note.alert = notification.title
  note.body = notification.body
  note.payload = { ...payload, ...notification }
  note.expiry = Math.floor(Date.now() / 1000) + 3600; // Expires 1 hour from now.
  note.topic = 'io.gigasource.gsms.voip';
  note.mutableContent = 1;
  note.category = 'GSMSNoti'
  return apnProvider.send(note, tokens)
}

module.exports = {
  sendNotification
}
