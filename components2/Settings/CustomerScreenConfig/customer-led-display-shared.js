import { ref } from 'vue'
import { ledDisplayInterfaceConstants, ledDisplaySocketEvents as ldso } from './customre-led-display-constants';

export const ledDisplayInterfaces = Object.values(ledDisplayInterfaceConstants).map(v => ({ text: v, value: v}))
export const selectedLedDisplayInterface = ref('')
export const ledDisplayDevices = ref([])
// Does we really need this??
// USB devices connected to this device has been sent automatically to CallSystem
export function loadSerialDisplays() {
  cms.socket.emit(ldso.loadLedDisplays, { ledInterface: selectedLedDisplayInterface.value }, ({ displays }) => {
    ledDisplayDevices.value = (displays || []).map(display => display.path)
  })
}
export const selectedLedDisplayDevice = ref(null)
export function testLedDisplay() {
  cms.socket.emit(ldso.testLedDisplay, { path: selectedLedDisplayDevice.value })
}
export function saveLedDisplayConfig() {
  // TODO: impl
}

