import { ref } from 'vue'
import { appHooks } from '../components2/AppSharedStates';

// TOOD: remove this file, move logic to somewhere else

export const webShopConnected = ref(true)
export const reservationBell = ref(null)

async function setupReservationBell() {
  const setting = await cms.getModel('PosSetting').findOne()
  if (setting.reservation && setting.reservation.soundNotification) {
    reservationBell.value = new Audio('/plugins/pos-plugin/assets/sounds/reservation-bell.mp3')
  } else {
    reservationBell.value = null
  }
}

export async function initPosData() {
  cms.socket.on('webShopConnected', () => {
    webShopConnected.value = true
    appHooks.emit('updateStoreId')
  })

  cms.socket.on('webShopDisconnected', () => {
    webShopConnected.value = false
  })

  cms.socket.on('updateAppFeature', () => {
    console.log('updateAppFeature')
    appHooks.emit('updateEnabledFeatures')
  })

  await setupReservationBell()
}
