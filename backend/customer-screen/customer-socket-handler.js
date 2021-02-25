const socketList = []

module.exports = (cms) => {
  cms.socket.on('connect', socket => {
    if (!socketList.includes(socket)) socketList.push(socket)
    socket.on('update-customer-order', order => {
      socketList.forEach(_socket => _socket.emit('update-customer-order', order))
    })

    socket.on('disconnect', () => {
      const idx = socketList.indexOf(socket)
      if (idx !== -1) socketList.splice(idx, 1)
    })
  })
}
