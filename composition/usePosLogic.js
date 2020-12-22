import { ref } from 'vue'

export const loginPassword = ref('')
export const user = ref(null)
export const incorrectPasscode = ref(false)
export const locale = ref('en')
export const version = ref('')
export const webShopConnected = ref(true)
export const online = ref(true)
export const storeId = ref('')

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

export function initPosData() {
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
}
