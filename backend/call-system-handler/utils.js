const csConstants = require('./call-system-contants')
const phoneCallMap = {};

const {v4: uuidv4} = require('uuid');

async function checkModeActive(modeName, posSettings) {
  const mode = await getActiveMode(posSettings);
  return mode === modeName;
}

async function getCallConfig(posSettings) {
  return (posSettings || await cms.getModel('PosSetting').findOne()).call;
}

async function getActiveMode(posSettings) {
  return (await getCallConfig(posSettings)).mode
}

async function emitNewCall(phoneNumber) {
  const callId = uuidv4();
  cms.socket.emit(csConstants.NewPhoneCall, phoneNumber, new Date(), callId);
  const callConfig = await getCallConfig();
  phoneCallMap[callId] = setTimeout(() => {
    if (!phoneCallMap[callId]) return;
    cms.socket.emit(csConstants.NewMissedPhoneCall, callId);
  }, (callConfig && callConfig.timeOut) || 45000);
}

function cancelMissedCallTimeout(callId) {
  console.log('cancelMissedCallTimeout')
  if (!phoneCallMap[callId])
    return
  clearTimeout(phoneCallMap[callId]);
  delete phoneCallMap[callId];
}

module.exports = {
  getCallConfig,
  checkModeActive,
  getActiveMode,
  emitNewCall,
  cancelMissedCallTimeout,
}
