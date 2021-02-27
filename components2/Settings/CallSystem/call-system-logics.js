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
  // CALL_SYSTEM_MODES.FRITZBOX,
  // CALL_SYSTEM_MODES.DEMO,
  CALL_SYSTEM_MODES.MODEM_ROBOTIC,
  CALL_SYSTEM_MODES.MODEM_ARTECH,
]
export const modemDeviceConnected = ref(false) // true / false
export const callSystemStatus = ref({}) // connected | ...

// allow the user to change ip address fritzbox
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
// store current config for multiple modes, with or without saved
export const ipAddresses = ref({})
export const dialog = ref({ ip: false })

// cache usb devices
export const usbDevices = ref([])
export const filteredUsbDevices = computed(() => {
  switch(currentCallSystemMode.value) {
    case CALL_SYSTEM_MODES.MODEM_ARTECH.value:
      return usbDevices.value.filter(usbDevice => usbDevice.manufactureName === 'ARTECH')
      break;
    case CALL_SYSTEM_MODES.MODEM_ROBOTIC.value:
      return usbDevices.value.filter(usbDevice => usbDevice.manufactureName !== 'ARTECH') // TODO: More correct
      break;
    default:
      return [];
  }

})

// cache
export const lastSavedConfig = ref(null)

// change ??
export const currentCallSystemMode = ref(CALL_SYSTEM_MODES.OFF)
watch(() => currentCallSystemMode.value, (newMode) => {
  switch(newMode) {
    case CALL_SYSTEM_MODES.OFF.value:
      ipAddresses.value[newMode] = '';
      break;
    case CALL_SYSTEM_MODES.DEMO.value:
      ipAddresses.value[newMode] = ipAddresses.value[newMode] /*changed value*/ || 'https://fritzbox-proxy-10000.gigasource.io' /*default value*/;
      break;
    case CALL_SYSTEM_MODES.FRITZBOX.value:
      ipAddresses.value[newMode] = ipAddresses.value[newMode] /*changed value*/ || '192.168.178.1:1012' /*default value*/;
      break;
    case CALL_SYSTEM_MODES.MODEM_ROBOTIC.value:
    case CALL_SYSTEM_MODES.MODEM_ARTECH.value:
      getUsbDevicesForCurrentMode()
      break;
  }
})

export const callSystemConfigChanged = computed(() => {
  if (!lastSavedConfig.value)
    return false
  const { mode, ipAddresses: ipAddrs } = lastSavedConfig.value
  return mode !== currentCallSystemMode.value || ipAddrs[mode] !==  ipAddresses.value[mode]
})
export const changeNotSavedWarningMessage = computed(() => {
  return callSystemConfigChanged.value ? ' Change was not saved, press "Save" to apply new changes' : ''
})

export async function loadData() {
  // TODO: PosSetting data sync
  const callSystem = (await cms.getModel('PosSetting').findOne()).call
  callSystem.mode = callSystem.mode || CALL_SYSTEM_MODES.OFF.value
  callSystem.ipAddresses = callSystem.ipAddresses || {};

  ipAddresses.value = callSystem.ipAddresses
  currentCallSystemMode.value = callSystem.mode

  getUsbDevicesForCurrentMode()
}

export function changeIp(value) {
  ipAddresses.value[currentCallSystemMode.value] = value
}

export function initCallSystem() {
  console.log('initCallSystem')
  cms.socket.emit(csConstants.Init)
}

export function switchMode() {
  const mode = currentCallSystemMode.value
  const devicePath = ipAddresses.value[mode]
  console.log('switchMode', mode, devicePath)
  cms.socket.emit(csConstants.SwitchMode, { mode, devicePath })
}
cms.socket.on(csConstants.SwitchModeResponse, call => {
  console.log('SwitchModeResponse', call)
  lastSavedConfig.value = cloneDeep(call)
})

export function getUsbDevicesForCurrentMode() {
  console.log('getUsbDevicesForCurrentMode', currentCallSystemMode.value)
  if (currentCallSystemMode.value !== CALL_SYSTEM_MODES.OFF.value)
    cms.socket.emit(csConstants.GetUsbDevices, currentCallSystemMode.value)
}
cms.socket.on(csConstants.GetUsbDevicesResponse, payload => {
  console.log('GetUsbDevicesResponse', payload)
  const { devices, mode } = payload

  if (mode !== currentCallSystemMode.value)
    return

  usbDevices.value = devices.map(({devicePath, deviceManufacturerName, deviceProductName}) => {
    return {
      text: `${devicePath} - ${deviceProductName} - ${deviceManufacturerName}`,
      value: devicePath,
      productName: deviceProductName,
      manufactureName: deviceManufacturerName
    }
  })
})

cms.socket.on(csConstants.ConnectionStatusChange, payload => {
  const { status, mode } = payload
  callSystemStatus.value[mode] = status
  modemDeviceConnected.value = typeof(status) === 'string' && status.toLowerCase() === 'connected'
})
