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

module.exports = {
  checkModeActive,
  getActiveMode,
}
