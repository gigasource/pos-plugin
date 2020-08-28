const {firebaseAdminInstance} = require('../../app-notification/firebase-messaging/admin')
const fireBaseMessagingAdapter = {
  emitToPersistent: async (deviceId, eventName, args, eventAckName, ackArgs) => {
    const json = JSON.stringify({
      useAsSocketIoAdapter: true,
      eventName,
      args,
      eventAckName,
      ackArgs
    })

    // TODO: Cache
    let firebaseToken = null
    const device = await cms.getModel('Device').findOne({_id: deviceId})
    if (device) {
      firebaseToken = device.firebaseToken
      console.log('Get firebase token from device info', firebaseToken)
    } else {
      const user = await cms.getModel('User').findOne({_id: deviceId})
      if (user) {
        firebaseToken = user.firebaseToken
        console.log('Get firebase token from user info', firebaseToken)
      } else {
        console.log('ERROR: device id is not existed in both device and user collection')
        return
      }
    }

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
    // NOTE: Assume that firebase always send message successfully!
    try {
      const result = await firebaseAdminInstance().messaging().send(message)
      console.log("result", result)
    } catch (e) {
      console.log("ex", e)
    }
  },
  emit: async() => {

  }
}

module.exports = (sockServer, useFirebaseAdapter = true) => {
  sockServer.vAckFn = sockServer.registerAckFunction

  const makeCallAck = async (sender, receiver, callAccepted) => {
    console.log(`VoIP: Firebase? ${useFirebaseAdapter}:  makeCallAck from ${sender} to ${receiver}`, callAccepted)
    sockServer.in(`makeCallAck-${receiver}`).emit('makeCallAck', { sender, receiver, callAccepted })
  }
  const cancelCallAck = async (sender, receiver) => {
    console.log(`VoIP: Firebase? ${useFirebaseAdapter} cancelCallAck from ${sender} to ${receiver}`)
    sockServer.in(`cancelCallAck-${receiver}`).emit('cancelCallAck', { sender, receiver })
  }
  const endCallAck = async (sender, receiver) => {
    console.log(`VoIP: Firebase? ${useFirebaseAdapter} endCallAck from ${sender} to ${receiver}`)
    sockServer.in(`endCallAck-${receiver}`).emit('endCallAck', { sender, receiver })
  }
  const underlyingTransporter = useFirebaseAdapter ? fireBaseMessagingAdapter : sockServer

  if (!useFirebaseAdapter) {
    sockServer.vAckFn('makeCallAck', makeCallAck)
    sockServer.vAckFn('cancelCallAck', cancelCallAck)
    sockServer.vAckFn('endCallAck', endCallAck)
  }

  sockServer.on('connect', socket => {
    if (useFirebaseAdapter) {
      socket.on('makeCallAck', makeCallAck)
      socket.on('cancelCallAck', cancelCallAck)
      socket.on('endCallAck', endCallAck)
    }

    let _deviceId;
    // socket need emit 'register-voip' event to talk with server that i want to join voip groups
    socket.on('register-voip', (deviceId, role) => {
      console.log(`${deviceId} register-voip with role ${role}`)
      socket.__voip = true
      socket.__role = role
      _deviceId = deviceId;
      // TODO: re-connect atempt will not register makeCallAck -> unstable
      socket.join(`makeCallAck-${deviceId}`)
      socket.join(`cancelCallAck-${deviceId}`)
      socket.join(`endCallAck-${deviceId}`)
    })

    socket.on('disconnect', () => {
      console.log('disconnect', _deviceId)
    })

    socket.on('makeCall', async (args) => {
      let { sender, receiver } = args;
      console.log(`VoIP: send makeCall from  ${sender} to ${receiver}`)
      underlyingTransporter.emitToPersistent(receiver, 'makeCall', [{ sender, receiver }], 'makeCallAck', [receiver, sender]) // in ack, receiver will become sender
    })
    socket.on('cancelCall', async (args) => {
      let { sender, receiver } = args;
      console.log(`VoIP: send cancelCall from ${sender} to ${receiver}`)
      underlyingTransporter.emitToPersistent(receiver, 'cancelCall', [{ sender, receiver }], 'cancelCallAck', [receiver, sender])  // in ack, receiver will become sender
    })

    socket.on('endCall', async (args) => {
      let { sender, receiver } = args;
      console.log(`VoIP: send endCall from ${sender} to ${receiver}`)
      underlyingTransporter.emitToPersistent(receiver, 'endCall', [{ sender, receiver }], 'endCallAck', [receiver, sender])  // in ack, receiver will become sender
    })

    socket.on('getAvailableSupporterDeviceId', async (ack) => {
      // Testing purpose
      const sockets = sockServer.sockets.sockets
      const socketIds = Object.keys(sockets)
      for(let socketId of socketIds) {
        const sock = sockets[socketId]
        if (sock.__role === "supporter")
          ack(sock.clientId)
      }
    })
  })
}
