module.exports = async (cms) => {
  const csConstants = require('./call-system-contants')
  const { emitNewCall, cancelMissedCallTimeout, getCallConfig} = require('./utils');
  //<!--<editor-fold desc="Rn bridge">-->
  let rnBridge;
  try {
    rnBridge = require('rn-bridge');
  } catch (e) {
    // this only works on mobile version
    rnBridge = require('../rn-bridge/rn-bridge-proxy');
  }

  function parseRnMessage(data) {
    if (typeof data === 'object') return data;

    try {
      data = JSON.parse(data);
    } catch (e) {
      data = {};
    }

    return data;
  }
  //<!--</editor-fold>-->

  let initialized = false; // indicate whether call system has been init or not
  let currentMode; // string value indicate current call system mode
  let selectedDevicePath; // string value indicate selected usb device (path)
  let connectionStatus; // connection status

  // usb-robotic
  const USROBOTICS_MODEM_MODE = 'usrobotics-modem';
  const USROBOTICS_MODEM_MODE_PREFIX = 'usrobotics-';
  rnBridge.app.on('usrobotics-list-usb-devices', (data) => handleGetUsbDevicesResponse(data, USROBOTICS_MODEM_MODE));
  rnBridge.app.on('usrobotics-open-usb-device', (data) => handleOpenUsbDeviceResponse(data, USROBOTICS_MODEM_MODE));
  rnBridge.app.on('usrobotics-usb-data', (data) => usbDataHandler(data, USROBOTICS_MODEM_MODE));
  rnBridge.app.on('usrobotics-usb-error', (data) => usbErrorHandler(data, USROBOTICS_MODEM_MODE));
  rnBridge.app.on('usrobotics-connection-status', (data) => handleConnectionStatusResponse(data, USROBOTICS_MODEM_MODE));

  // artech
  const ARTECH_MODEM_MODE = 'artech-modem';
  const ARTECH_MODEM_MODE_PREFIX = 'artech-';
  rnBridge.app.on('artech-list-usb-devices', (data) => handleGetUsbDevicesResponse(data, ARTECH_MODEM_MODE));
  rnBridge.app.on('artech-open-usb-device', (data) => handleOpenUsbDeviceResponse(data, ARTECH_MODEM_MODE));
  rnBridge.app.on('artech-usb-data', (data) => usbDataHandler(data, ARTECH_MODEM_MODE));
  rnBridge.app.on('artech-usb-error', (data) => usbErrorHandler(data, ARTECH_MODEM_MODE));
  rnBridge.app.on('artech-connection-status', (data) => handleConnectionStatusResponse(data, ARTECH_MODEM_MODE));

  // get usb devices
  function sendGetUsbDevicesRequest(mode) {
    console.log('sendGetUsbDevicesRequest', mode)
    rnBridge.app.sendObject(_getEventPrefix(mode) + 'list-usb-devices', {});
  }
  async function handleGetUsbDevicesResponse(data, mode /*seem like we don't need it*/ ) {
    let { deviceList } = parseRnMessage(data);
    cms.socket.emit(csConstants.GetUsbDevicesResponse, { devices: deviceList, mode });
  }

  // open usb device
  function sendOpenUsbDeviceRequest() {
    const event = _getEventPrefix() + 'open-usb-device'
    console.log('sendOpenUsbDeviceRequest', event, selectedDevicePath)
    rnBridge.app.sendObject(event, {devicePath: selectedDevicePath});
    // NOTE: consider that open usb device request always success -> a.m.a the system has been init at this moment
    initialized = true
  }
  async function handleOpenUsbDeviceResponse(data, mode) {
    console.log('handleOpenUsbDeviceResponse', data, mode)
    // seem like this method doesn't have any meaning after refactor
    if (mode !== currentMode)
      return
    const {message} = parseRnMessage(data);
    if (!message)
      return;
  }
  function sendCloseUsbDeviceRequest() {
    const event = _getEventPrefix() + 'close-usb-device'
    console.log('sendCloseUsbDeviceRequest', event)
    rnBridge.app.sendObject(event, {devicePath: selectedDevicePath})
    initialized = false;
  }
  function _getEventPrefix(mode) {
    mode = mode || currentMode
    switch (mode) {
      case USROBOTICS_MODEM_MODE:
        return USROBOTICS_MODEM_MODE_PREFIX
      case ARTECH_MODEM_MODE:
        return ARTECH_MODEM_MODE_PREFIX
    }
    return ''
  }

  // handle data
  async function usbDataHandler(data, mode) {
    console.log('usbDataHandler', data, mode, currentMode)
    if (mode !== currentMode)
      return;
    const {message} = parseRnMessage(data);
    console.log('message', message)
    if (!message)
      return;
    switch (mode) {
      case USROBOTICS_MODEM_MODE:
        console.log('handleUsroboticsData')
        handleUsroboticsData(message);
        break;
      case ARTECH_MODEM_MODE:
        console.log('handleArtechData')
        handleArtechData(message);
        break;
    }
  }
  function handleUsroboticsData(data) {
    const trimmedData = data.toString().trim();

    // if (trimmedData === 'NO CARRIER') {
    // this means the call is answered
    // (this signal appears a few seconds after the call ends)

    // } else {
    let phoneNumber;
    const phoneData = trimmedData.split('\r\n');
    const callerNameInfo = phoneData.find(e => e.startsWith('NAME'));
    const callerNumberInfo = phoneData.find(e => e.startsWith('NMBR'));

    if (callerNameInfo) {
      phoneNumber = callerNameInfo.split('=')[1];
    }

    if (callerNumberInfo && !(/^\d+$/.test(phoneNumber))) {
      phoneNumber = callerNumberInfo.split('=')[1];
    }

    if (/^\d+$/.test(phoneNumber)) emitNewCall(phoneNumber);
    // }
  }
  function handleArtechData(phoneNumber = '') {
    if (/^\d+$/.test(phoneNumber.trim())) emitNewCall(phoneNumber);
  }

  // handle error & connection status
  async function usbErrorHandler(data, mode) {
    if (mode !== currentMode)
      return;
    const {error} = parseRnMessage(data);
    if (!error)
      return;
    connectionStatus = error;
    await notifyConnectionStatusToFrontend();
  }
  async function handleConnectionStatusResponse(data, mode) {
    if (mode !== currentMode)
      return;
    const {status, devicePath} = parseRnMessage(data);
    if (!status || !devicePath || devicePath !== selectedDevicePath)
      return;
    connectionStatus = status;
    notifyConnectionStatusToFrontend(mode);
  }
  function notifyConnectionStatusToFrontend(mode) {
    cms.socket.emit(csConstants.ConnectionStatusChange, { status: connectionStatus, mode })
  }

  // switch call system
  async function turnCurrentCallSystemModeOff() {
    console.log('turnCurrentCallSystemModeOff')
    sendCloseUsbDeviceRequest()
  }
  async function turnCurrentCallSystemModeOn() {
    console.log('turnCurrentCallSystemModeOn', currentMode, selectedDevicePath)
    // save call setting
    const callSetting = (await cms.getModel('PosSetting').findOne()).call;
    callSetting.mode = currentMode
    callSetting.ipAddresses = callSetting.ipAddresses || []
    callSetting.ipAddresses[currentMode] = selectedDevicePath
    await cms.getModel('PosSetting').update({}, { call: callSetting })

    cms.socket.emit(csConstants.SwitchModeResponse, callSetting)

    // try to open device
    switch (currentMode) {
      case USROBOTICS_MODEM_MODE:
      case ARTECH_MODEM_MODE:
        await sendOpenUsbDeviceRequest()
        break;
    }
  }

  // register socket events
  cms.socket.on('connect', clientSocket => {
    // clientSocket.on('screen-loaded', sendGetUsbDevicesRequest);

    // init call-system each time app run
    clientSocket.on(csConstants.Init, async () => {
      console.log('initCallSystem')
      if (initialized) {
        console.log('Call system has been init. skip.')
        return;
      }
      const callConfig = await getCallConfig()
      currentMode = callConfig.mode;
      selectedDevicePath = callConfig.ipAddresses[currentMode];
      sendOpenUsbDeviceRequest()
    })

    // allow to get connected devices for specified call system mode
    clientSocket.on(csConstants.GetUsbDevices, sendGetUsbDevicesRequest);

    // allow to switch call system mode
    clientSocket.on(csConstants.SwitchMode, async payload => {
      console.log('SwitchMode', payload)
      await turnCurrentCallSystemModeOff()

      currentMode = payload.mode
      selectedDevicePath = payload.devicePath

      setTimeout(async () => {
        await turnCurrentCallSystemModeOn()
      }, 500)
    });

    // accept a call (a.k.a prevent system mark a pending call as missed call)
    clientSocket.on(csConstants.CancelMissedCallTimeout, cancelMissedCallTimeout);
  });
}
