module.exports = async (cms) => {
  const {CallMonitor} = require('fritz-callmonitor');
  let callMap = {};
  let fritzboxMonitor;
  let connectionStatus = '';

  cms.socket.on('connect', internalSocket => {
    internalSocket.on('refresh-call-system-config', setupLocalFritzbox);
    internalSocket.on('get-call-system-status', updateConnectionStatus);
  });

  async function updateConnectionStatus(cb, posSettings) {
    if (!posSettings) posSettings = await cms.getModel('PosSetting').findOne();
    const {call: callConfig} = posSettings;
    let {mode} = callConfig;
    const useLocalFritzbox = mode === 'localhost-fritzbox';

    if (cb && useLocalFritzbox) cb(connectionStatus);
    else cms.socket.emit('update-call-system-status', useLocalFritzbox ? connectionStatus : null);
  }

  await setupLocalFritzbox();

  function reset() {
    if (fritzboxMonitor) {
      fritzboxMonitor.end();
      fritzboxMonitor.socket.destroy();
      fritzboxMonitor.removeAllListeners();
      fritzboxMonitor = null;
    }
    callMap = {};
  }

  async function setupLocalFritzbox() {
    const posSettings = await cms.getModel('PosSetting').findOne();
    const {call: callConfig} = posSettings;
    let {mode, ipAddresses = {}} = callConfig;
    const useLocalFritzbox = mode === 'localhost-fritzbox';

    if (!useLocalFritzbox && fritzboxMonitor) {
      reset();
    } else if (useLocalFritzbox) {
      reset();
      let fritzboxIp = ipAddresses[mode] || '192.168.12.1';
      let fritzboxPort = 1012;

      if (fritzboxIp.includes(':')) {
        const arr = fritzboxIp.split(':');
        fritzboxIp = arr[0];
        fritzboxPort = +arr[1];
      }

      fritzboxMonitor = new CallMonitor(fritzboxIp, fritzboxPort);
      connectionStatus = 'Connecting...';
      await updateConnectionStatus(null, posSettings);

      fritzboxMonitor.on("ring", async (callInfo) => {
        const {connectionId, caller} = callInfo;
        callMap[connectionId] = {pickedUp: false, caller}

        cms.socket.emit('new-phone-call', callInfo.caller, new Date());
      });

      fritzboxMonitor.on("pickup", (callInfo) => {
        const {connectionId} = callInfo;
        if (callMap[connectionId]) callMap[connectionId].pickedUp = true;
      });

      fritzboxMonitor.on("hangup", async (callInfo) => {
        const {connectionId} = callInfo;
        const callSession = callMap[connectionId];

        if (callSession && !callSession.pickedUp) {
          cms.socket.emit('new-missed-phone-call', callSession.caller, new Date());
          delete callMap[connectionId];
        }
      });

      fritzboxMonitor.on('end', () => {
        connectionStatus = 'Disconnected';
        updateConnectionStatus();
        console.log('Disconnected from Fritzbox device');
      });
      fritzboxMonitor.on('connect', () => {
        connectionStatus = 'Connected';
        updateConnectionStatus();
        console.log('Connected to Fritzbox device');
      });
      fritzboxMonitor.on('error', err => {
        connectionStatus = 'Connection error, please check your Fritzbox IP address';
        updateConnectionStatus();
        console.error(err);
      });
      fritzboxMonitor.connect();
    }
  }
}
