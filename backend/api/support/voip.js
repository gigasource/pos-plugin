const { getApnProvider } = require('../../app-notification/apn-provider/provider')
const apn = require('apn')
const express = require('express')
const router = express.Router()
const {firebaseAdminInstance} = require('../../app-notification/firebase-messaging/admin')
const _ = require('lodash')
const callMgr = require('./callMgr')
const CallStatus = callMgr.CallStatus;

const messenger = {
  /**
   * Return {firebaseToken, apnToken} of specified id
   * @param deviceId (device id from device collection or user id in user collection (in case support app))
   * @return {Promise<{firebaseToken: (number|{$ne: string}|{$ne: string}|{$exists: boolean}|{$ne: string}|{$ne: string}), apnToken: ({teamId: string, keyId: string, key: string}|{teamId: string, keyId: string, key: string})}>}
   */
  getTokens: async function(deviceId) {
    // manager app
    const device = await cms.getModel('Device').findOne({_id: deviceId})
    if (device) {
      console.log('Get firebase token from device info: ', device.firebaseToken)
      console.log('Get apn token from device info: ', device.apnToken)
      return {
        apnToken: device.apnToken,
        apnTopic: 'io.gigasource.gsms.voip',
        firebaseToken: device.firebaseToken,
      }
    }

    // support app
    const user = await cms.getModel('User').findOne({_id: deviceId}, { firebaseToken: 1, storeGroups: 0, role: 0, createdBy: 0, apnToken: 1 })
    if (user) {
      console.log('Get firebase token from user info', user.firebaseToken)
      console.log('Get apn token from device info: ', user.apnToken)
      return {
        apnToken: user.apnToken,
        apnTopic: 'io.gigasource.gigasupport.voip',
        firebaseToken: user.firebaseToken
      }
    }
    throw 'ERROR: device id is not existed in both device and user collection'
  },
  sendFirebase: async function(json, firebaseToken) {
    const message = {
      data: { json },
      token: firebaseToken,
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

    console.log(`VoIP: Send ${json} to ${firebaseToken}`)

    try {
      const result = await firebaseAdminInstance().messaging().send(message)
      console.log("result", result)
    } catch (e) {
      console.log("ex", e)
    }
  },
  /**
   *
   * @param payload
   * @param token
   * @param topic fully qualified namespace of application: // io.gigasource.gsms.voip
   * @return {*}
   */
  sendApn: function (payload, token, topic) {
    if (!token)
      return
    const apnProvider = getApnProvider()
    const note = new apn.Notification();
    note.payload = { ...payload }
    note.expiry = Math.floor(Date.now() / 1000) + 3600; // Expires 1 hour from now.
    note.topic = topic;
    console.log(`send ${JSON.stringify(payload)} to token "${token}" in topic "${topic}" via apn`)
    return apnProvider.send(note, [token])
  },
  send: async function(receiver, eventName, args) {
    const {firebaseToken, apnToken, apnTopic} = await this.getTokens(receiver)
    const payload = { eventName, args }
    this.sendApn(payload, apnToken, apnTopic)
    this.sendFirebase(JSON.stringify(payload), firebaseToken)
  },
}

async function findName(deviceOrUserId) {
  let name = ''
  const deviceInfo = await cms.getModel('Device').findOne({_id: deviceOrUserId}, { storeId: 1 })
  if (deviceInfo) {
    const store = await cms.getModel('Store').findOne({_id: deviceInfo.storeId})
    if (store)
      name = store.name
  } else {
    const userInfo = await cms.getModel('User').findOne({_id: deviceOrUserId}, { name: 1 })
    if (userInfo)
      name = userInfo.name
  }
  return name
}

// make call
router.post('/make-call', async (req, res) => {
  const { sender, receiver } = req.body
  console.log(`make-call from ${sender} to ${receiver}`)
  if (callMgr.getStatus(receiver) === CallStatus.Idle)
  {
    let senderName = await findName(sender)
    let receiverName = await findName(receiver)
    console.log('Receiver is idle, can make a call')
    callMgr.makeCall(sender, receiver)
    messenger.send(receiver, 'makeCall', {sender, senderName})
    res.json({ok:true, receiverName})
  } else {
    console.log("Receiver is busy, can't make a call")
    res.json({ok:false, error: 'Receiver busy'})
  }
})

// answer/declined
router.post('/make-call-ack', async (req, res) => {
  const { sender, receiver, callAccepted } = req.body
  console.log(`make-call-ack from ${sender} to ${receiver}`)
  callMgr.makeCallAck(sender, receiver, callAccepted)
  messenger.send(receiver, 'makeCallAck', {sender, callAccepted})
  res.json({ok:true})
})

router.post('/cancel-call', async (req, res) => {
  const { sender, receiver } = req.body
  console.log(`cancel-call from ${sender} to ${receiver}`)
  callMgr.cancelCall(sender, receiver)
  messenger.send(receiver, 'cancelCall', {sender})
  res.json({ok:true})
})

// end call
router.post('/end-call', async (req, res) => {
  const { sender, receiver } = req.body
  console.log(`end-call from ${sender} to ${receiver}`)
  callMgr.endCall(sender, receiver)
  messenger.send(receiver, 'endCall', {sender})
  res.json({ok:true})
})

// get device id of supporters
router.get('/supporters/:storeId', async (req, res) => {
  const { storeId } = req.params
  const store = await cms.getModel('Store').findOne({ _id: storeId })

  if (!store) {
    res.json({ ok: false, error: "Store id is invalid" })
    return
  }

  // select first user which is not an admin, and also in idle state
  const sgIds = store.groups.map(sg => sg._id)
  const users = await cms.getModel('User').find({
    username: { $ne: 'admin' },
    firebaseToken: { $ne: '' },
    storeGroups: { $elemMatch: { $in: sgIds } } }, { _id: 1, username: 1, firebaseToken: 1 }
  )
  const selectedUser = _.find(users, u => callMgr.getStatus(u._id) !== CallStatus.Busy)
  if (selectedUser) {
    res.json({
      ok: true,
      supporter: selectedUser._id
    })
  } else {
    res.json({
      ok: false,
    })
  }

})

router.get('/device-status/:deviceId', async (req, res) => {
  const {deviceId} = req.params
  res.json({ status: callMgr.getStatus(deviceId) })
})

module.exports = router
