import { computed, ref, watch } from 'vue';
import cloneDeep from 'lodash/cloneDeep';

const CALL_SYSTEM_MODES = Object.freeze({
  OFF: { text: 'Off', value: 'off' },
  FRITZBOX: { text: 'Localhost (Fritzbox)', value: 'localhost-fritzbox' },
  DEMO: { text: 'Demo (Fritzbox)', value: 'demo-fritzbox' },
  MODEM_ROBOTIC: { text: 'Modem (USRobotics)', value: 'usrobotics-modem' },
  MODEM_ARTECH: { text: 'Modem (Artech)', value: 'artech-modem' },
});

export const callSystemModes = [
  CALL_SYSTEM_MODES.OFF,
  CALL_SYSTEM_MODES.FRITZBOX,
  CALL_SYSTEM_MODES.DEMO,
  CALL_SYSTEM_MODES.MODEM_ROBOTIC,
  CALL_SYSTEM_MODES.MODEM_ARTECH,
]

export const currentCallSystemMode = ref(CALL_SYSTEM_MODES.OFF)
export const callSystemStatus = ref('')
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
  if (!callSystemConfigChanged.value && currentCallSystemMode.value === CALL_SYSTEM_MODES.OFF.value) return '';

  if (callSystemConfigChanged.value) {
    return ' (Call system config has changed, press \'Update\' to apply changes)';
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
  cms.socket.emit('get-call-system-status', updateConnectStatus);
  await cms.getModel('PosSetting').findOneAndUpdate({}, { call })
  await loadData()
  if (configChanged) cms.socket.emit('refresh-call-system-config')
}

export function changeIp(value) {
  ipAddresses.value[currentCallSystemMode.value] = value
}

export function updateConnectStatus(status) {
  if (status) callSystemStatus.value = status;
}

export function updateUsbDeviceList() {
  cms.socket.emit('list-usb-devices', currentCallSystemMode);
}

watch(() => currentCallSystemMode.value, (newValue) => {
  cms.socket.emit('get-call-system-status', updateConnectStatus);
  let defaultValue = null;
  if (newValue === CALL_SYSTEM_MODES.DEMO.value) defaultValue = 'https://fritzbox-proxy-10000.gigasource.io';
  else if (newValue === CALL_SYSTEM_MODES.FRITZBOX.value) defaultValue = '192.168.178.1:1012';
  else if (newValue === CALL_SYSTEM_MODES.OFF.value) defaultValue = null;
  else if (newValue === CALL_SYSTEM_MODES.MODEM_ROBOTIC.value
    || newValue === CALL_SYSTEM_MODES.MODEM_ARTECH.value) updateUsbDeviceList();
  if (defaultValue === null) return;
  ipAddresses[newValue] = ipAddresses[newValue] || defaultValue;
}, { onTrigger: () => console.log('trigger')})
