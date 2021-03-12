import { ref, computed } from 'vue'
import { posSettings, appHooks } from '../AppSharedStates';

export const skipPairing = computed(() => posSettings.value.skipPairing)
export const devicePaired = computed(() => posSettings.value && posSettings.value.onlineDevice && posSettings.value.onlineDevice.id)
export const deviceNeedToPair = computed(() => !devicePaired.value && !skipPairing.value)
export const webShopConnected = ref(true)

async function updatePosSetting(key, value) {
  try {
    await cms.getModel('PosSetting').updateOne({}, { $set: { [key]: value } })
    await appHooks.emit('settingChange')
  } catch (e) {
    console.warn(e)
  }
}
async function updateOnlineDevice(device) {
  await updatePosSetting('onlineDevice', device)
}

export async function setupOnlineOrderSocketPairEventHandle() {
  cms.socket.on('unpairDevice', async () => {
    await updateOnlineDevice({ id: null, store: {} })
    if (window.router.currentRoute.path !== '/pos-setup' && window.router.currentRoute.path !== '/admin')
      window.router.push('/pos-setup')
  })

  cms.socket.on('approveSignIn', isFirstDevice => {
    if (!isFirstDevice && window.router.path === '/pos-setup')
      window.router.push('/pos-login')
  })

  cms.socket.on('denySignIn', () => {
    if (window.router.path !== '/pos-setup')
      window.router.push('/pos-setup')
  })

  cms.socket.on('webShopConnected', () => {
    webShopConnected.value = true
    appHooks.emit('updateStoreId')
  })

  cms.socket.on('webShopDisconnected', () => {
    webShopConnected.value = false
  })
}














