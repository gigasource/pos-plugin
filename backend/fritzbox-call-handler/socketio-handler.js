module.exports = async (cms) => {
  const ioClient = require('socket.io-client');
  let callMap = {};
  let fritzboxSocket;
  let socketConnectStatus = '';

  cms.socket.on('connect', internalSocket => {
    internalSocket.on('refresh-fritzbox-config', setupFritzboxSocket);
    internalSocket.on('get-fritzbox-demo-status', (cb) => cb(socketConnectStatus));
  });

  await setupFritzboxSocket();

  async function setupFritzboxSocket() {
    const posSettings = await cms.getModel('PosSetting').findOne();
    const {call: callConfig} = posSettings;
    const {demoMode} = callConfig;

    if (!demoMode && fritzboxSocket) {
      fritzboxSocket.disconnect();
      fritzboxSocket.removeAllListeners();
      fritzboxSocket = null;
      callMap = {};
    } else if (demoMode && !fritzboxSocket) {
      fritzboxSocket = ioClient('https://fritzbox-proxy-10000.gigasource.io');
      socketConnectStatus = 'Connecting...';
      cms.socket.emit('update-fritzbox-demo-status', socketConnectStatus);

      fritzboxSocket.on('connect', () => {
        socketConnectStatus = 'Connected';
        cms.socket.emit('update-fritzbox-demo-status', socketConnectStatus);
        console.log('Connected to Fritzbox Socket.io server');
      });
      fritzboxSocket.on('disconnect', () => {
        socketConnectStatus = 'Disconnected';
        cms.socket.emit('update-fritzbox-demo-status', socketConnectStatus);
        console.log('Disconnected from Fritzbox Socket.io server');
      });

      fritzboxSocket.on('ring', (callInfo) => {
        const {connectionId, caller} = callInfo;
        callMap[connectionId] = {pickedUp: false, caller};

        cms.socket.emit('new-phone-call', callInfo.caller, new Date());
      });

      fritzboxSocket.on('pickup', (callInfo) => {
        const {connectionId} = callInfo;
        if (callMap[connectionId]) callMap[connectionId].pickedUp = true;
      });

      fritzboxSocket.on('hangup', (callInfo) => {
        const {connectionId} = callInfo;
        const callSession = callMap[connectionId];

        if (callSession && !callSession.pickedUp) {
          cms.socket.emit('new-missed-phone-call', callSession.caller, new Date());
          delete callMap[connectionId];
        }
      });

      fritzboxSocket.on('error', (err) => console.log(err));
    }
  }
}
