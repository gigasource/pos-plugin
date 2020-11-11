module.exports = async (cms) => {
  let rnBridge;

  try {
    rnBridge = require('rn-bridge');
  } catch (e) {
    // this only works on mobile version
    return;
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

  async function listUsbDevicesHandler(data) {
    let {deviceList: dList} = parseRnMessage(data);
    if (!dList) return;

    deviceList = dList;
    cms.socket.emit('list-usb-devices', dList);

    // only try reconnecting if device is disconnected
    if (!connectionStatus || connectionStatus.toLowerCase() === 'disconnected') {
      const posSettings = await cms.getModel('PosSetting').findOne();
      const {call: callConfig} = posSettings;
      const {ipAddresses = {}} = callConfig;
      const devicePathInConfig = ipAddresses['robotic-modem'];

      if (deviceList && deviceList.some(d => d.devicePath === devicePathInConfig)) {
        openUsbDevice(devicePathInConfig);
      }
    }

    if (!initialized) {
      initialized = true;
      await setupRoboticDevice();
    }
  }

  function openUsbDeviceHandler(data) {
    const {message} = parseRnMessage(data);
    if (!message) return;

    selectedDevicePath = message;
  }

  function connectionStatusHandler(data) {
    const {status, devicePath} = parseRnMessage(data);
    if (!status || !devicePath) return;

    if (devicePath === selectedDevicePath) connectionStatus = status;

    updateConnectionStatus();
  }

  function usbDataHandler(data) {
    const {message} = parseRnMessage(data);
    if (!message) return;

    handleRoboticData(message);
  }

  function usbErrorHandler(data) {
    const {error} = parseRnMessage(data);
    if (!error) return;

    connectionStatus = error;
    updateConnectionStatus();
    cms.socket.emit('usrobotics-error', error);
  }

  rnBridge.app.on('list-usb-devices', listUsbDevicesHandler);
  rnBridge.app.on('open-usb-device', openUsbDeviceHandler);
  rnBridge.app.on('connection-status', connectionStatusHandler);
  rnBridge.app.on('usb-data', usbDataHandler);
  rnBridge.app.on('usb-error', usbErrorHandler);

  cms.socket.on('connect', internalSocket => {
    internalSocket.on('list-usb-devices', listSerialDevices);
    internalSocket.on('refresh-call-system-config', setupRoboticDevice);
    internalSocket.on('get-call-system-status', updateConnectionStatus);
    internalSocket.on('screen-loaded', listSerialDevices);
  });

  function listSerialDevices() {
    rnBridge.app.sendObject('list-usb-devices', {});
  }

  function openUsbDevice(devicePath) {
    selectedDevicePath = devicePath;
    rnBridge.app.sendObject('open-usb-device', {devicePath});
  }

  async function updateConnectionStatus(cb, posSettings) {
    if (!posSettings) posSettings = await cms.getModel('PosSetting').findOne();
    const {call: callConfig} = posSettings;
    let {mode} = callConfig;
    const useRoboticModem = mode === 'robotic-modem';

    if (cb && useRoboticModem) cb(connectionStatus);
    else cms.socket.emit('update-call-system-status', useRoboticModem ? connectionStatus : null);
  }

  function handleRoboticData(data) {
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

  async function setupRoboticDevice() {
    const posSettings = await cms.getModel('PosSetting').findOne();
    const {call: callConfig} = posSettings;
    let {mode, ipAddresses = {}} = callConfig;
    const useRoboticDevice = mode === 'robotic-modem';
    const devicePathInConfig = ipAddresses[mode];
    const deviceConnected = deviceList.some(d => d.devicePath === devicePathInConfig);

    if (!useRoboticDevice && selectedDevicePath) {
      reset();
    } else if (useRoboticDevice && devicePathInConfig && deviceConnected) {
      reset();
      openUsbDevice(ipAddresses[mode]);
    }
  }

  function reset() {
    if (selectedDevicePath) {
      closeDevice(selectedDevicePath);
      selectedDevicePath = null;
    }
  }

  function closeDevice(devicePath) {
    rnBridge.app.sendObject('close-usb-device', {devicePath});
  }
}
