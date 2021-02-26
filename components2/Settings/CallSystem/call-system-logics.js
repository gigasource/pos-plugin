import { computed, ref, watch } from 'vue'
import cloneDeep from 'lodash/cloneDeep'
import csConstants from '../../../backend/call-system-handler/call-system-contants'
import cms from 'cms'

const CALL_SYSTEM_MODES = Object.freeze({
  OFF: { text: 'Off', value: 'off' },
  FRITZBOX: { text: 'Localhost (Fritzbox)', value: 'localhost-fritzbox' },
  DEMO: { text: 'Demo (Fritzbox)', value: 'demo-fritzbox' },
  MODEM_ROBOTIC: { text: 'Modem (USRobotics)', value: 'usrobotics-modem' },
  MODEM_ARTECH: { text: 'Modem (Artech)', value: 'artech-modem' },
})
export const callSystemModes = [
  CALL_SYSTEM_MODES.OFF,
  CALL_SYSTEM_MODES.FRITZBOX,
  CALL_SYSTEM_MODES.DEMO,
  CALL_SYSTEM_MODES.MODEM_ROBOTIC,
  CALL_SYSTEM_MODES.MODEM_ARTECH,
]
export const currentCallSystemMode = ref(CALL_SYSTEM_MODES.OFF)
export const modemDeviceConnected = ref(false) // true / false
export const callSystemStatus = ref('') // connected | ...

// allow the user to change ip address fritxbox
export const ipAddresses = ref({})
export const dialog = ref({
  ip: false,
})
export const callSystemIpText = computed(() => {
  switch (currentCallSystemMode.value) {
    case CALL_SYSTEM_MODES.FRITZBOX.value:
      return 'Fritzbox local IP';
    case CALL_SYSTEM_MODES.DEMO.value:
      return 'Fritzbox proxy server address';
    default:
      return '';
  }
})

export const lastSavedConfig = ref(null)

// cache usb devices
export const usbDevices = ref([])
export const selectedSerialDevice = ref('')

// change ??
export const callSystemConfigChanged = computed(() => {
  return !(lastSavedConfig.value
    && lastSavedConfig.value.mode === currentCallSystemMode.value
    && lastSavedConfig.value.ipAddresses[currentCallSystemMode.value] === ipAddresses.value[currentCallSystemMode.value])
})
export const callSystemStatusComputed = computed(() => {
  if (!callSystemConfigChanged.value && currentCallSystemMode.value === CALL_SYSTEM_MODES.OFF.value)
    return '';
  if (callSystemConfigChanged.value) {
    return ' Call system config has changed, press \'Update\' to apply new changes';
  } else {
    return ` (${callSystemStatus.value})`;
  }
})

export async function loadData() {
  const callSystem = (await cms.getModel('PosSetting').findOne()).call
  callSystem.mode = callSystem.mode || CALL_SYSTEM_MODES.OFF.value
  callSystem.ipAddresses = callSystem.ipAddresses || {};

  ipAddresses.value = callSystem.ipAddresses
  currentCallSystemMode.value = callSystem.mode
  lastSavedConfig.value = cloneDeep(callSystem)

  getUsbDevicesForCurrentMode()
}
export async function update() {
  console.log('update')
  const configChanged = callSystemConfigChanged.value;
  const call = {
    ipAddresses: ipAddresses.value,
    mode: currentCallSystemMode.value,
  }
  await cms.getModel('PosSetting').findOneAndUpdate({}, { call })
  await loadData()
  if (configChanged)
    cms.socket.emit(csConstants.RefreshCallSystemConfig)
}
export function changeIp(value) {
  ipAddresses.value[currentCallSystemMode.value] = value
}

watch(() => currentCallSystemMode.value, (newValue) => {
  let defaultValue = null;
  switch(newValue) {
    case CALL_SYSTEM_MODES.OFF.value:
      defaultValue = null;
      break;
    case CALL_SYSTEM_MODES.DEMO.value:
      defaultValue = 'https://fritzbox-proxy-10000.gigasource.io';
      break;
    case CALL_SYSTEM_MODES.FRITZBOX.value:
      defaultValue = '192.168.178.1:1012';
      break;
    case CALL_SYSTEM_MODES.MODEM_ROBOTIC.value:
    case CALL_SYSTEM_MODES.MODEM_ARTECH.value:
      getUsbDevicesForCurrentMode()
      break;
  }

  if (defaultValue === null)
    return;

  ipAddresses[newValue] = ipAddresses[newValue] || defaultValue;
})

export function initCallSystem() {
  cms.socket.emit(csConstants.Init)
}
export function switchMode() {
  cms.socket.emit(csConstants.SwitchMode, {
    mode: currentCallSystemMode.value,
    devicePath: selectedSerialDevice.value
  })
}
export function getUsbDevicesForCurrentMode() {
  console.log('getUsbDevicesForCurrentMode')
  if (currentCallSystemMode.value !== CALL_SYSTEM_MODES.OFF.value)
    cms.socket.emit(csConstants.GetUsbDevices, currentCallSystemMode.value)
}

cms.socket.on(csConstants.ConnectionStatusChange, payload => {
  const { status } = payload
  callSystemStatus.value = status
  modemDeviceConnected.value = typeof(status) === 'string' && status.toLowerCase() === 'connected'
})
cms.socket.on(csConstants.GetUsbDevicesResponse, payload => {
  console.log('GetUsbDevicesResponse', payload)
  const { devices, mode } = payload

  if (mode !== currentCallSystemMode.value)
    return

  usbDevices.value = devices.map(({devicePath, deviceManufacturerName, deviceProductName}) => {
    return {
      text: `${devicePath} - ${deviceProductName} - ${deviceManufacturerName}`,
      value: devicePath
    }
  })

  selectedSerialDevice.value = ipAddresses.value[mode]
      ? ipAddresses.value[mode]
      : (usbDevices.value.length > 0 ? usbDevices.value[0].value : '');
})
