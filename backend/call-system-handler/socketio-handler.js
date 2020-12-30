module.exports = async (cms) => {
  const {checkModeActive, emitNewCall, cancelMissedCallTimeout} = require('./utils');
  const ioClient = require('socket.io-client');
  let callMap = {};
  let fritzboxSocket;
  let socketConnectStatus = '';

  cms.socket.on('connect', internalSocket => {
    internalSocket.on('refresh-call-system-config', setupFritzboxSocket);
    internalSocket.on('get-call-system-status', updateConnectionStatus);
    internalSocket.on('cancel-missed-call-timeout', cancelMissedCallTimeout);
  });

  async function updateConnectionStatus(cb, posSettings) {
    if (!posSettings) posSettings = await cms.getModel('PosSetting').findOne();
    const demoMode = await checkModeActive('demo-fritzbox', posSettings);

    if (cb && demoMode) cb(socketConnectStatus);
    else cms.socket.emit('update-call-system-status', demoMode ? socketConnectStatus : null);
  }

  function reset() {
    if (fritzboxSocket) {
      fritzboxSocket.disconnect();
      fritzboxSocket.removeAllListeners();
      fritzboxSocket = null;
    }
    callMap = {};
  }

  await setupFritzboxSocket();

  async function setupFritzboxSocket() {
    const posSettings = await cms.getModel('PosSetting').findOne();
    const {call: callConfig} = posSettings;
    const {mode, ipAddresses = {}} = callConfig;
    const demoMode = await checkModeActive('demo-fritzbox', posSettings);

    if (!demoMode && fritzboxSocket) {
      reset();
    } else if (demoMode) {
      reset();
      const ip = ipAddresses[mode] || 'https://fritzbox-proxy-10000.gigasource.io';
      fritzboxSocket = ioClient(ip);
      socketConnectStatus = 'Connecting...';
      await updateConnectionStatus(null, posSettings);

      fritzboxSocket.on('connect', () => {
        socketConnectStatus = 'Connected';
        updateConnectionStatus();
        console.log('Connected to Fritzbox Socket.io server');
      });
      fritzboxSocket.on('disconnect', () => {
        socketConnectStatus = 'Disconnected';
        updateConnectionStatus();
        console.log('Disconnected from Fritzbox Socket.io server');
      });

      fritzboxSocket.on('ring', (callInfo) => {
        const {connectionId, caller} = callInfo;
        callMap[connectionId] = {pickedUp: false, caller};

        emitNewCall(callInfo.caller);
      });

      fritzboxSocket.on('pickup', (callInfo) => {
        const {connectionId} = callInfo;
        if (callMap[connectionId]) callMap[connectionId].pickedUp = true;
      });

      fritzboxSocket.on('hangup', (callInfo) => {
        const {connectionId} = callInfo;
        const callSession = callMap[connectionId];

        if (callSession && !callSession.pickedUp) {
          // cms.socket.emit('new-missed-phone-call', callSession.caller, new Date());
          delete callMap[connectionId];
        }
      });

      fritzboxSocket.on('error', (err) => console.log(err));
    }
  }
}