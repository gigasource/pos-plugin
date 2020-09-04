const express = require('express')
const router = express.Router()
const {firebaseAdminInstance} = require('../../app-notification/firebase-messaging/admin')
const _ = require('lodash')
const callMgr = require('./callMgr')
const CallStatus = callMgr.CallStatus;

const fcm = {
  getFirebaseToken: async function(deviceId) {
    // manager app
    const device = await cms.getModel('Device').findOne({_id: deviceId})
    if (device) {
      console.log('Get firebase token from device info: ', device.firebaseToken)
      return device.firebaseToken
    }

    // support app
    const user = await cms.getModel('User').findOne({_id: deviceId}, { firebaseToken: 1, storeGroups: 0, role: 0, createdBy: 0 })
    if (user) {
      // work - around
      console.log('Get firebase token from user info')
      console.log('user', user.firebaseToken)
      // return "eL2EEt_7QluvUvGXLBt49i:APA91bFywRA-yDrHydI2eyWBmpHAR3N2I_adhqpd_Rsumkk96UOYrGH0pOyQOCiFbQp9S7Fx_z6o-O0L2MY4t9GbTffZRliVzcotCRE0xf11UysKLuj4_5YZUtZwgS5yiEkUaZeQKWNp"
      return user.firebaseToken
    }

    throw 'ERROR: device id is not existed in both device and user collection'
  },
  sendMessage: async function(json, firebaseToken) {
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
  send: async function(receiver, eventName, args) {
    const firebaseToken = await this.getFirebaseToken(receiver)
    await this.sendMessage(JSON.stringify({ eventName, args }), firebaseToken)
  },
}

// make call
router.post('/make-call', async (req, res) => {
  const { sender, receiver } = req.body
  console.log(`make-call from ${sender} to ${receiver}`)
  if (callMgr.getStatus(receiver) === CallStatus.Idle) {
    console.log('Receiver is idle, can make a call')
    callMgr.makeCall(sender, receiver)
    fcm.send(receiver, 'makeCall', {sender})
    res.json({ok:true})
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
  fcm.send(receiver, 'makeCallAck', {sender, callAccepted})
  res.json({ok:true})
})

router.post('/cancel-call', async (req, res) => {
  const { sender, receiver } = req.body
  console.log(`cancel-call from ${sender} to ${receiver}`)
  callMgr.cancelCall(sender, receiver)
  fcm.send(receiver, 'cancelCall', {sender})
  res.json({ok:true})
})

// end call
router.post('/end-call', async (req, res) => {
  const { sender, receiver } = req.body
  console.log(`end-call from ${sender} to ${receiver}`)
  callMgr.endCall(sender, receiver)
  fcm.send(receiver, 'endCall', {sender})
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
  // TODO: check firebaseToken condition
  const users = await cms.getModel('User').find({
    username: { $ne: 'admin' },
    firebaseToken: { $ne: '' },
    storeGroups: { $elemMatch: { $in: sgIds } } }, { _id: 1, username: 1, firebaseToken: 1 }
  )
  const selectedUser = _.find(users, u => callMgr.getStatus(u._id) !== CallStatus.Busy)
  res.json({
    ok: selectedUser !== null,
    supporter: selectedUser._id
  })
})

router.get('/device-status/:deviceId', async (req, res) => {
  const {deviceId} = req.params
  res.json({ status: callMgr.getStatus(deviceId) })
})

module.exports = router
