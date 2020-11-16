const phoneCallMap = {};

// calls are considered missed if no action is taken during this time
const CALL_TIMEOUT_THRESHOLD = 60 * 1000;

const {v4: uuidv4} = require('uuid');

async function checkModeActive(modeName, posSettings) {
  const mode = await getActiveMode(posSettings);
  return mode === modeName;
}

async function getActiveMode(posSettings) {
  posSettings = posSettings || await cms.getModel('PosSetting').findOne();
  const {call: callConfig} = posSettings;
  const {mode} = callConfig;
  return mode;
}

function emitNewCall(phoneNumber) {
  const callId = uuidv4();

  cms.socket.emit('new-phone-call', phoneNumber, new Date(), callId);

  phoneCallMap[callId] = setTimeout(() => {
    if (!phoneCallMap[callId]) return;
    cms.socket.emit('new-missed-phone-call', callId);
  }, CALL_TIMEOUT_THRESHOLD);
}

function cancelMissedCallTimeout(callId) {
  if (!phoneCallMap[callId]) return;

  clearTimeout(phoneCallMap[callId]);
  delete phoneCallMap[callId];
}

module.exports = {
  checkModeActive,
  getActiveMode,
  emitNewCall,
  cancelMissedCallTimeout,
}
