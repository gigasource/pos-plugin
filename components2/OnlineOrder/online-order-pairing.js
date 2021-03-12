import { ref, computed } from 'vue'
import { posSettings, appHooks } from '../AppSharedStates';

export const onlineDevice = computed(() => posSettings.value.onlineDevice)
export const webshopName = ref('')
export const webShopConnected = ref(true)
export const skipPairing = computed(() => posSettings.value.skipPairing)

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

export async function setupPairDevice() {
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

  if (!onlineDevice.value || (!onlineDevice.value.id && !posSettings.value.skipPairing)) {
    console.log('go to pos-setup')
    window.router.push('/pos-setup')
  }
}

export function getPairStatus() {
  // TODO: getX but doesn't return X value?
  cms.socket.emit('getPairStatus', async ({error}) => {
    if (error) {
      console.warn(`Pair status: ${error}`)
      if (!skipPairing.value && window.router.currentRoute.path !== '/admin') {
        window.router.currentRoute.path !== '/pos-setup' && window.router.push('/pos-setup')
      }
    }
  })
}
export function getWebshopName() {
  cms.socket.emit('getWebshopName', storeName => {
    webshopName.value = storeName || 'Web shop name not available'
  })
}














