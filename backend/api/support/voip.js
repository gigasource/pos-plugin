const express = require('express')
const router = express.Router()
const {firebaseAdminInstance} = require('../../app-notification/firebase-messaging/admin')

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
  fcm.send(receiver, 'makeCall', {sender})
  res.json({ok:true})
})

// answer/declined
router.post('/make-call-ack', async (req, res) => {
  const { sender, receiver, callAccepted } = req.body
  console.log(`make-call-ack from ${sender} to ${receiver}`)
  fcm.send(receiver, 'makeCallAck', {sender, callAccepted})
  res.json({ok:true})
})

router.post('/cancel-call', async (req, res) => {
  const { sender, receiver } = req.body
  console.log(`cancel-call from ${sender} to ${receiver}`)
  fcm.send(receiver, 'cancelCall', {sender})
  res.json({ok:true})
})

// end call
router.post('/end-call', async (req, res) => {
  const { sender, receiver } = req.body
  console.log(`end-call from ${sender} to ${receiver}`)
  fcm.send(receiver, 'endCall', {sender})
  res.json({ok:true})
})

// get device id of supporters
router.get('/get-supporters', async (req, res) => {
  res.json({
    ok: true,
    supporter: '5e96bdee046a735999b167eb'
  })
})


module.exports = router
