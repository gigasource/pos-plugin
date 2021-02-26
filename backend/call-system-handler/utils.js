const csConstants = require('./call-system-contants')
const phoneCallMap = {};

// calls are considered missed if no action is taken during this time
const CALL_TIMEOUT_THRESHOLD = 60 * 1000;

const {v4: uuidv4} = require('uuid');

async function checkModeActive(modeName, posSettings) {
  const mode = await getActiveMode(posSettings);
  return mode === modeName;
}

export async function getCallConfig(posSettings) {
  (posSettings || await cms.getModel('PosSetting').findOne()).call;
}

async function getActiveMode(posSettings) {
  return (await getCallConfig(posSettings)).mode
}

function emitNewCall(phoneNumber) {
  const callId = uuidv4();

  cms.socket.emit(csConstants.NewPhoneCall, phoneNumber, new Date(), callId);

  phoneCallMap[callId] = setTimeout(() => {
    if (!phoneCallMap[callId]) return;
    cms.socket.emit(csConstants.NewMissedPhoneCall, callId);
  }, CALL_TIMEOUT_THRESHOLD);
}

function cancelMissedCallTimeout(callId) {
  if (!phoneCallMap[callId])
    return
  clearTimeout(phoneCallMap[callId]);
  delete phoneCallMap[callId];
}

module.exports = {
  checkModeActive,
  getActiveMode,
  emitNewCall,
  cancelMissedCallTimeout,
}
