// TODO: rename the file
import { ref, computed } from 'vue'
import { posSettings, appHooks } from './AppSharedStates';
export const onlineDevice = computed(() => posSettings.value.onlineDevice)
export const webshopName = ref('')
export const skipPairing = computed(() => posSettings.value.skipPairing)

async function updatePosSetting(key, value) {
  try {
    await cms.getModel('PosSetting').updateOne({}, { $set: { [key]: value } })
    await appHooks.emit('settingChange')
  } catch (e) {
    console.warn(e)
  }
}

export function useDeviceManagementSystem(router) {
  async function updateOnlineDevice(device) {
    await updatePosSetting('onlineDevice', device)
  }
  async function setupPairDevice() {
    cms.socket.on('unpairDevice', async () => {
      await updateOnlineDevice({ id: null, store: {} })
      if (router.currentRoute.path !== '/pos-setup' && router.currentRoute.path !== '/admin')
        router.push('/pos-setup')
    })

    cms.socket.on('approveSignIn', isFirstDevice => {
      if (!isFirstDevice && router.path === '/pos-setup')
         router.push('/pos-login')
    })

    cms.socket.on('denySignIn', () => {
      if (router.path !== '/pos-setup')
        router.push('/pos-setup')
    })

    if (!onlineDevice.value || (!onlineDevice.value.id && !posSettings.value.skipPairing)) {
      router.push('/pos-setup')
    }
  }

  function getPairStatus() {
    // TODO: getX but doesn't return X value?
    cms.socket.emit('getPairStatus', async ({error}) => {
      if (error) {
        console.warn(`Pair status: ${error}`)
        if (!skipPairing.value && router.currentRoute.path !== '/admin') {
          router.currentRoute.path !== '/pos-setup' && router.push('/pos-setup')
        }
      }
    })
  }
  function getWebshopName() {
    cms.socket.emit('getWebshopName', storeName => {
      webshopName.value = storeName || 'Web shop name not available'
    })
  }
  function getOnlineDeviceServices(callback) {
    cms.socket.emit('getOnlineDeviceServices', callback)
  }
  function updateOnlineDeviceServices(services, callback) {
    cms.socket.emit('updateOnlineDeviceServices', services, callback)
  }

  return {
    setupPairDevice,
    getPairStatus,
    getWebshopName,
    getOnlineDeviceServices,
    updateOnlineDeviceServices,
  }
}

















