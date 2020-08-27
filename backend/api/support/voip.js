module.exports = (sockServer) => {
  sockServer.vAckFn = sockServer.registerAckFunction

  sockServer.vAckFn('makeCallAck', async (sender, receiver, callAccepted) => {
    console.log(`VoIP: makeCallAck from ${sender} to ${receiver}`, callAccepted)
    sockServer.in(`makeCallAck-${receiver}`).emit('makeCallAck', { sender, receiver, callAccepted })
  })

  sockServer.vAckFn('cancelCallAck', async (sender, receiver) => {
    console.log(`VoIP: cancelCallAck from ${sender} to ${receiver}`)
    sockServer.in(`cancelCallAck-${receiver}`).emit('cancelCallAck', { sender, receiver })
  })

  sockServer.vAckFn('endCallAck', async (sender, receiver) => {
    console.log(`VoIP: endCallAck from ${sender} to ${receiver}`)
    sockServer.in(`endCallAck-${receiver}`).emit('endCallAck', { sender, receiver })
  })

  sockServer.on('connect', socket => {
    // socket need emit 'register-voip' event to talk with server that i want to join voip groups
    socket.on('register-voip', (deviceId, role) => {
      console.log(`${deviceId} register-voip with role ${role}`)
      socket.__voip = true
      socket.__role = role
      socket.join(`makeCallAck-${deviceId}`)
      socket.join(`cancelCallAck-${deviceId}`)
      socket.join(`endCallAck-${deviceId}`)
    })

    socket.on('makeCall', async (args) => {
      let { sender, receiver } = args;
      console.log(`VoIP: send makeCall from  ${sender} to ${receiver}`)
      sockServer.emitToPersistent(receiver, 'makeCall', [{ sender, receiver }], 'makeCallAck', [receiver, sender]) // in ack, receiver will become sender
    })

    socket.on('cancelCall', async (args) => {
      let { sender, receiver } = args;
      console.log(`VoIP: send cancelCall from ${sender} to ${receiver}`)
      sockServer.emitToPersistent(receiver, 'cancelCall', [{ sender, receiver }], 'cancelCallAck', [receiver, sender])  // in ack, receiver will become sender
    })

    socket.on('endCall', async (args) => {
      let { sender, receiver } = args;
      console.log(`VoIP: send endCall from ${sender} to ${receiver}`)
      sockServer.emitToPersistent(receiver, 'endCall', [{ sender, receiver }], 'endCallAck', [receiver, sender])  // in ack, receiver will become sender
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
