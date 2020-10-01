module.exports = () => {
  const ioClient = require('socket.io-client');
  const socket = ioClient('https://fritzbox-proxy-10000.gigasource.io');

  const callMap = {};

  socket.on('connect', () => console.log('Connected to Fritzbox Socket.io server'));
  socket.on('disconnect', () => console.log('Disconnected from Fritzbox Socket.io server'));

  socket.on('ring', (callInfo) => {
    const {connectionId, caller} = callInfo;
    callMap[connectionId] = {pickedUp: false, caller};

    cms.socket.emit('new-phone-call', callInfo.caller, new Date());
  });

  socket.on('pickup', (callInfo) => {
    const {connectionId} = callInfo;
    if (callMap[connectionId]) callMap[connectionId].pickedUp = true;
  });

  socket.on('hangup', (callInfo) => {
    const {connectionId} = callInfo;
    const callSession = callMap[connectionId];

    if (callSession && !callSession.pickedUp) {
      cms.socket.emit('new-missed-phone-call', callSession.caller, new Date());
      delete callMap[connectionId];
    }
  });

  socket.on('error', (err) => console.log(err));
}
