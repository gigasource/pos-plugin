module.exports = async (cms) => {
  /*let fritzboxMonitor = await setupFritzboxMonitor(cms);

  cms.socket.on('connect', socket => {
    socket.on('refresh-fritzbox-config', async () => {
      if (fritzboxMonitor) {
        fritzboxMonitor.removeAllListeners();
        fritzboxMonitor.end();
      }

      fritzboxMonitor = await setupFritzboxMonitor(cms);
    });
  });*/
}

async function setupFritzboxMonitor(cms) {
  const posSettings = await cms.getModel('PosSetting').findOne();
  const {call: callConfig} = posSettings;
  let {active: callHandlerActive, ip: fritzboxIp = '192.168.12.1'} = callConfig;

  if (!callHandlerActive) return null;

  let fritzboxPort = 1012;

  if (fritzboxIp.includes(':')) {
    const arr = fritzboxIp.split(':');
    fritzboxIp = arr[0];
    fritzboxPort = +arr[1];
  }

  const {CallMonitor} = require('fritz-callmonitor');
  const callMonitor = new CallMonitor(fritzboxIp, fritzboxPort);

  const callMap = {};

  callMonitor.on("ring", async (callInfo) => {
    const {connectionId, caller} = callInfo;
    callMap[connectionId] = {pickedUp: false, caller}

    cms.socket.emit('new-phone-call', callInfo.caller, new Date());
  });

  callMonitor.on("pickup", (callInfo) => {
    const {connectionId} = callInfo;
    if (callMap[connectionId]) callMap[connectionId].pickedUp = true;
  });

  callMonitor.on("hangup", async (callInfo) => {
    const {connectionId} = callInfo;
    const callSession = callMap[connectionId];

    if (callSession && !callSession.pickedUp) {
      cms.socket.emit('new-missed-phone-call', callSession.caller, new Date());
      delete callMap[connectionId];
    }
  });

  callMonitor.on("close", () => console.log('Disconnected from Fritzbox device'));
  callMonitor.on("connect", () => console.log('Connected to Fritzbox device'));
  callMonitor.on("error", err => console.error(err));
  callMonitor.connect();

  return callMonitor;
}
