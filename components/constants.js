const CALL_SYSTEM_MODES = Object.freeze({
  OFF: {text: 'Off', value: 'off'},
  FRITZBOX: {text: 'Localhost (Fritzbox)', value: 'localhost-fritzbox'},
  DEMO: {text: 'Demo (Fritzbox)', value: 'demo-fritzbox'},
  MODEM_ROBOTIC: {text: 'Modem (USRobotics)', value: 'usrobotics-modem'},
  MODEM_ARTECH: {text: 'Modem (Artech)', value: 'artech-modem'},
});

module.exports = {
  CALL_SYSTEM_MODES,
}
