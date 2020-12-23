import { ref } from 'vue'
import _ from 'lodash';
import { mobileCheck } from '../components/logic/commonUtils';

export const loginPassword = ref('')
export const user = ref(null)
export const incorrectPasscode = ref(false)
export const locale = ref('en')
export const storeLocale = ref('en')
export const version = ref('')
export const webShopConnected = ref(true)
export const online = ref(true)
export const storeId = ref('')
export const rooms = ref([])
export const enabledFeatures = ref([])
export const pendingReservationsLength = ref(0)
export const reservationBell = ref(null)
export const isMobile = mobileCheck()

export async function login() {
  try {
    const posSetting = await cms.getModel('PosSetting').findOne()
    user.value = posSetting.user.find(user => user.passcode === loginPassword.value)

    if (user.value) {
      loginPassword.value = ''
      return true
    }
  } catch (e) {
    console.error(e)
  }
  incorrectPasscode.value = true
}

export function resetIncorrectPasscodeFlag() {
  if (incorrectPasscode.value) incorrectPasscode.value = false
}

export async function changeLocale(newLocale) {
  await cms.getModel('SystemConfig').updateOne({ type: 'I18n' }, { 'content.locale': newLocale }, { upsert: true })
  locale.value = newLocale
}

export function getStoreId() {
  cms.socket.emit('getWebshopId', sId => {
    storeId.value = sId || ''
  })
}

async function getRooms() {
  const allRooms = await cms.getModel('Room').find()
  rooms.value = _.orderBy(allRooms, ['order'], ['asc'])
}

async function getEnabledFeatures() {
  const _enabledFeatures = await cms.getModel('Feature').find({ enabled: true })
  enabledFeatures.value = _enabledFeatures.map(item => item.name)
}

export async function getPendingReservationsLength() {
  const currentDate = dayjs().startOf('day')
  const reservations = await cms.getModel('Reservation').find({
    status: 'pending',
    date: { $gte: currentDate.toDate(), $lt: currentDate.add(1, 'day').toDate() }
  })
  pendingReservationsLength.value = reservations.length
}

async function setupReservationBell() {
  const setting = await cms.getModel('PosSetting').findOne()
  if (setting.reservation && setting.reservation.soundNotification) {
    reservationBell.value = new Audio('/plugins/pos-plugin/assets/sounds/reservation-bell.mp3')
  } else {
    reservationBell.value = null
  }
}

export async function initPosData() {
  cms.socket.emit('get-app-version', appVersion => {
    if (appVersion) version.value = appVersion
  })

  cms.socket.emit('socketConnected', value => {
    webShopConnected.value = value
  })

  cms.socket.on('webShopConnected', () => {
    webShopConnected.value = true
    getStoreId()
  })

  cms.socket.on('webShopDisconnected', () => {
    webShopConnected.value = false
  })

  const i18nConfig = cms.getList('SystemConfig').find(i => i.type === 'I18n')
  if (i18nConfig) {
    locale.value = i18nConfig.content.locale
  }

  await getRooms()
  cms.socket.on('updateRooms', getRooms)

  await getEnabledFeatures()
  cms.socket.on('updateAppFeature', getEnabledFeatures)

  await getPendingReservationsLength()
  cms.socket.on('updateReservationList', async () => {
    await getPendingReservationsLength()
    await setupReservationBell()
  })
}
