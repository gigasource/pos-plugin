module.exports = async (cms) => {
  const USROBOTICS_MODEM_MODE = 'usrobotics-modem';
  const USROBOTICS_MODEM_MODE_PREFIX = 'usrobotics-';
  const ARTECH_MODEM_MODE = 'artech-modem';
  const ARTECH_MODEM_MODE_PREFIX = 'artech-';

  const {checkModeActive, getActiveMode} = require('./utils');
  let rnBridge;
  let currentMode;

  try {
    rnBridge = require('rn-bridge');
  } catch (e) {
    // this only works on mobile version
    rnBridge = require('../rn-bridge/rn-bridge-proxy');
  }

  let selectedDevicePath;
  let connectionStatus;
  let deviceList;
  let initialized = false;

  function parseRnMessage(data) {
    if (typeof data === 'object') return data;

    try {
      data = JSON.parse(data);
    } catch (e) {
      data = {};
    }

    return data;
  }

  async function listUsbDevicesHandler(data, mode) {
    let {deviceList: dList} = parseRnMessage(data);
    if (!dList) return;

    deviceList = dList;
    cms.socket.emit('list-usb-devices', dList, mode);

    const modeIsActive = await checkModeActive(mode);
    // only try reconnecting if device is disconnected
    if (modeIsActive && !connectionStatus || connectionStatus.toLowerCase() === 'disconnected') {
      const posSettings = await cms.getModel('PosSetting').findOne();
      const {call: callConfig} = posSettings;
      const {ipAddresses = {}} = callConfig;
      const devicePathInConfig = ipAddresses[mode];

      if (deviceList && deviceList.some(d => d.devicePath === devicePathInConfig)) {
        await openDevice(devicePathInConfig);
      }
    }

    if (modeIsActive && !initialized) {
      initialized = true;
      await setupModemDevice();
    }
  }

  async function openUsbDeviceHandler(data, mode) {
    if (!(await checkModeActive(mode))) return;
    const {message} = parseRnMessage(data);
    if (!message) return;

    selectedDevicePath = message;
  }

  async function connectionStatusHandler(data, mode) {
    if (!(await checkModeActive(mode))) return;
    const {status, devicePath} = parseRnMessage(data);
    if (!status || !devicePath) return;

    if (devicePath === selectedDevicePath) connectionStatus = status;

    await updateConnectionStatus();
  }

  async function usbDataHandler(data, mode) {
    if (!(await checkModeActive(mode))) return;
    const {message} = parseRnMessage(data);
    if (!message) return;

    if (mode === USROBOTICS_MODEM_MODE) handleUsroboticsData(message);
    else if (mode === ARTECH_MODEM_MODE) handleArtechData(message);
  }

  async function usbErrorHandler(data, mode) {
    if (!(await checkModeActive(mode))) return;
    const {error} = parseRnMessage(data);
    if (!error) return;

    connectionStatus = error;
    await updateConnectionStatus();
  }

  rnBridge.app.on('usrobotics-list-usb-devices', (data) => listUsbDevicesHandler(data, USROBOTICS_MODEM_MODE));
  rnBridge.app.on('usrobotics-open-usb-device', (data) => openUsbDeviceHandler(data, USROBOTICS_MODEM_MODE));
  rnBridge.app.on('usrobotics-connection-status', (data) => connectionStatusHandler(data, USROBOTICS_MODEM_MODE));
  rnBridge.app.on('usrobotics-usb-data', (data) => usbDataHandler(data, USROBOTICS_MODEM_MODE));
  rnBridge.app.on('usrobotics-usb-error', (data) => usbErrorHandler(data, USROBOTICS_MODEM_MODE));

  rnBridge.app.on('artech-list-usb-devices', (data) => listUsbDevicesHandler(data, ARTECH_MODEM_MODE));
  rnBridge.app.on('artech-open-usb-device', (data) => openUsbDeviceHandler(data, ARTECH_MODEM_MODE));
  rnBridge.app.on('artech-connection-status', (data) => connectionStatusHandler(data, ARTECH_MODEM_MODE));
  rnBridge.app.on('artech-usb-data', (data) => usbDataHandler(data, ARTECH_MODEM_MODE));
  rnBridge.app.on('artech-usb-error', (data) => usbErrorHandler(data, ARTECH_MODEM_MODE));

  cms.socket.on('connect', internalSocket => {
    internalSocket.on('list-usb-devices', listSerialDevices);
    internalSocket.on('refresh-call-system-config', setupModemDevice);
    internalSocket.on('get-call-system-status', updateConnectionStatus);
    internalSocket.on('screen-loaded', listSerialDevices);
  });

  async function listSerialDevices(mode) {
    if (!mode) mode = await getActiveMode();
    let event = 'list-usb-devices';

    if (mode === USROBOTICS_MODEM_MODE) event = USROBOTICS_MODEM_MODE_PREFIX + event;
    else if (mode === ARTECH_MODEM_MODE) event = ARTECH_MODEM_MODE_PREFIX + event;

    rnBridge.app.sendObject(event, {});
  }

  async function openDevice(devicePath) {
    const mode = await getActiveMode();
    let event = 'open-usb-device';

    if (mode === USROBOTICS_MODEM_MODE) event = USROBOTICS_MODEM_MODE_PREFIX + event;
    else if (mode === ARTECH_MODEM_MODE) event = ARTECH_MODEM_MODE_PREFIX + event;

    selectedDevicePath = devicePath;
    rnBridge.app.sendObject(event, {devicePath});
  }

  async function updateConnectionStatus(cb, posSettings) {
    const mode = await getActiveMode(posSettings);

    if (cb && mode === currentMode) cb(connectionStatus);
    else cms.socket.emit('update-call-system-status', mode === currentMode ? connectionStatus : null);
  }

  function handleArtechData(phoneNumber = '') {
    if (/^\d+$/.test(phoneNumber.trim())) cms.socket.emit('new-phone-call', phoneNumber, new Date());
  }

  function handleUsroboticsData(data) {
    const trimmedData = data.toString().trim();

    // if (trimmedData === 'NO CARRIER') {
    // this means the call is answered
    // (this signal appears a few seconds after the call ends)

    // } else {
    let callerPhoneNumber;
    const phoneData = trimmedData.split('\r\n');
    const callerNameInfo = phoneData.find(e => e.startsWith('NAME'));
    const callerNumberInfo = phoneData.find(e => e.startsWith('NMBR'));

    if (callerNameInfo) {
      callerPhoneNumber = callerNameInfo.split('=')[1];
    }

    if (callerNumberInfo && !(/^\d+$/.test(callerPhoneNumber))) {
      callerPhoneNumber = callerNumberInfo.split('=')[1];
    }

    if (/^\d+$/.test(callerPhoneNumber)) cms.socket.emit('new-phone-call', callerPhoneNumber, new Date());
    // }
  }

  async function setupModemDevice() {
    const posSettings = await cms.getModel('PosSetting').findOne();
    const {call: callConfig} = posSettings;
    let {mode, ipAddresses = {}} = callConfig;
    currentMode = mode;

    const devicePathInConfig = ipAddresses[mode];
    const deviceConnected = deviceList.some(d => d.devicePath === devicePathInConfig);

    if (mode !== USROBOTICS_MODEM_MODE && mode !== ARTECH_MODEM_MODE && selectedDevicePath) {
      reset();
    } else {
      if ((mode === USROBOTICS_MODEM_MODE || mode === ARTECH_MODEM_MODE) && devicePathInConfig && deviceConnected) {
        reset();
        await openDevice(ipAddresses[mode]);
      }
    }
  }

  function reset() {
    if (selectedDevicePath) {
      closeDevice(selectedDevicePath);
      selectedDevicePath = null;
    }
  }

  async function closeDevice(devicePath) {
    const mode = await getActiveMode();
    let event = 'close-usb-device';

    if (mode === USROBOTICS_MODEM_MODE) event = USROBOTICS_MODEM_MODE_PREFIX + event;
    else if (mode === ARTECH_MODEM_MODE) event = ARTECH_MODEM_MODE_PREFIX + event;

    rnBridge.app.sendObject(event, {devicePath});
  }
}
