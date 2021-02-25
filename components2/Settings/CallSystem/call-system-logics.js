import { computed, ref, watch } from 'vue'
import cloneDeep from 'lodash/cloneDeep'
import csConstants from '../../../backend/call-system-handler/call-system-contants'
import cms from 'cms'
import dayjs from 'dayjs';

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

export const callSystemStatus = ref('')
export function updateConnectStatus(status) {
  if (status)
    callSystemStatus.value = status;
}

export const ipAddresses = ref({})
export const dialog = ref({
  ip: false,
})
export const lastSavedConfig = ref(null)
export const usbDevices = ref([])
export const selectedSerialDevice = ref('')

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

export async function loadData() {
  // TODO cms.getModel('PosSetting') // using watch instead
  const callSystem = (await cms.getModel('PosSetting').findOne()).call
  callSystem.mode = callSystem.mode || CALL_SYSTEM_MODES.OFF.value
  callSystem.ipAddresses = callSystem.ipAddresses || {};

  ipAddresses.value = callSystem.ipAddresses || {}
  currentCallSystemMode.value = callSystem.mode
  lastSavedConfig.value = cloneDeep(callSystem)
  updateUsbDeviceList();
}

export async function update() {
  const configChanged = callSystemConfigChanged.value;
  const call = {
    ipAddresses: ipAddresses.value,
    mode: currentCallSystemMode.value,
  }
  cms.socket.emit(csConstants.GetCallSystemStatus, updateConnectStatus);
  await cms.getModel('PosSetting').findOneAndUpdate({}, { call })
  await loadData()
  if (configChanged)
    cms.socket.emit(csConstants.RefreshCallSystemConfig)
}

export function changeIp(value) {
  ipAddresses.value[currentCallSystemMode.value] = value
}

export function updateUsbDeviceList() {
  cms.socket.emit('list-usb-devices', currentCallSystemMode.value);
}

watch(() => currentCallSystemMode.value, (newValue) => {
  cms.socket.emit(csConstants.GetCallSystemStatus, updateConnectStatus);
  let defaultValue = null;
  if (newValue === CALL_SYSTEM_MODES.DEMO.value) defaultValue = 'https://fritzbox-proxy-10000.gigasource.io';
  else if (newValue === CALL_SYSTEM_MODES.FRITZBOX.value) defaultValue = '192.168.178.1:1012';
  else if (newValue === CALL_SYSTEM_MODES.OFF.value) defaultValue = null;
  else if (newValue === CALL_SYSTEM_MODES.MODEM_ROBOTIC.value
    || newValue === CALL_SYSTEM_MODES.MODEM_ARTECH.value) updateUsbDeviceList();
  if (defaultValue === null) return;
  ipAddresses[newValue] = ipAddresses[newValue] || defaultValue;
}, { onTrigger: () => console.log('trigger')})

// modem connection status
export const modemDeviceConnected = ref(null)
export function getCallSystemStatus() {
  cms.socket.emit(csConstants.GetCallSystemStatus, updateModemDeviceStatus);
}
export async function updateModemDeviceStatus(connectionStatus) {
  if (!connectionStatus) return;
  const callSystem = (await cms.getModel('PosSetting').findOne()).call;
  if (callSystem.mode === CALL_SYSTEM_MODES.OFF.value) {
    modemDeviceConnected.value = null;
  } else {
    modemDeviceConnected.value = typeof connectionStatus === 'string' && connectionStatus.toLowerCase() === 'connected';
  }
}

// calls, missed calls
export const calls = ref([])
export const missedCalls = ref([])
export const mockMissedCalls = [
  /*Customer: see Customer collection*/
  /*          see OrderStore::getCustomerInfo(phone) */
  {
    customer: {
      name: 'Miss Customer 1',
      phone: '0123456678',
      addresses: [
        {
          address: 'missCust.1.addrs.address',
          house: 'missCust.1.addrs.house',
          street: 'missCust.1.addrs.street',
          zipcode: 'missCust.1.addrs.zipcode',
          city: 'missCust.1.addrs.city'
        }
      ]
    }, date: dayjs() },
  { customer: { name: 'Miss Customer 2', phone: '0123456678', addresses: [] }, date: dayjs() },
  { customer: { name: 'Miss Customer 3', phone: '0123456678', addresses: [] }, date: dayjs() }
]
missedCalls.value = mockMissedCalls

export function deleteCall(index, { callId }) {
  calls.value.splice(index, 1)
  cancelMissedCallTimeout(callId)
}
export function deleteMissedCall(index) {
  missedCalls.value.splice(index, 1)
}
export function cancelMissedCallTimeout(callId) {
  cms.socket.emit(csConstants.CancelMissedCallTimeout, callId);
}

cms.socket.on(csConstants.UpdateCallSystemStatus, async (connectionStatus) => {
  /*OnlineOrderMain::created*/ await updateModemDeviceStatus(connectionStatus)
  updateConnectStatus(connectionStatus)
})
cms.socket.on('list-usb-devices', (devices, mode) => {
  if (mode !== currentCallSystemMode.value)
    return

  usbDevices.value = devices.map(({devicePath, deviceManufacturerName, deviceProductName}) => {
    return {
      text: `${devicePath} - ${deviceProductName} - ${deviceManufacturerName}`,
      value: devicePath,
    }
  })

  selectedSerialDevice.value = ipAddresses.value[mode]
      ? ipAddresses.value[mode]
      : (usbDevices.value.length > 0 ? usbDevices.value[0].value : '');
})
