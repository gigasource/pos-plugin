import { computed, ref } from 'vue';
import { useI18n } from 'vue-i18n';
import cms from 'cms';
import { posSettings, user } from '../../AppSharedStates';
import axios from 'axios';
import { updateSetting } from '../settings-be';


export const snackbarRef = ref(null)

export const connected = computed(() => {
  return !!(onlineDevice.value && onlineDevice.value.id)
})

export const deliveryTimes = [15, 30, 45, 60]


export const onlineDevice = computed({
    get() {
      const res = posSettings.value.onlineDevice || {}
      return Object.assign({}, res, { url: webshopUrl.value})
    },
    set(val) {
      updateSetting({ onlineDevice: val })
    }
  }
)



export const defaultPrepareTime = computed({
    get() {
      return posSettings.value.defaultPrepareTime || {}
    },
    set(val) {
      updateSetting({ defaultPrepareTime: val })
      // update
    }
  }
)

export const onlineOrderSorting = computed({
    get() {
      return posSettings.value.onlineOrderSorting || {}
    },
    set(val) {
      updateSetting({ onlineOrderSorting: val })
      // update
    }
  }
)

export const OnlineOrderSettingLogicsFactory = () => {
  const { t } = useI18n()

  const orderSorting = [
    { text: t('onlineOrder.settings.orderNumber'), value: 'order' },
    { text: t('onlineOrder.settings.timeToComplete2'), value: 'time' },
  ]
  const soundModes = [
    { text: t('onlineOrder.settings.once'), value: 'none' },
    { text: t('onlineOrder.settings.twice'), value: 'once' },
    { text: t('onlineOrder.settings.untilConfirm'), value: 'repeat' },
  ]
  return {
    orderSorting, soundModes
  }
}
export const webshopUrl = ref('')
export const webshopAvailable = ref(true)
export const dialog = ref(false)
export const passcode = ref('')
export const disableResetBtn = ref(false)
export const disableDataBtn = ref(false)
export const isTemplateData = ref(false)
export const isMasterDevice = computed(() => {
  if (onlineDevice.value && onlineDevice.value.id) {
    return onlineDevice.value.id === posSettings.value.masterClientId
  }
})

export async function getWebshopUrl() {
  cms.socket.emit('getWebshopUrl', async _webshopUrl => {
    webshopUrl.value = _webshopUrl

    try {
      await axios.get(`${_webshopUrl}/health-check`)
      webshopAvailable.value = true
    } catch (e) {
      webshopAvailable.value = false
    }
  });
}



export const webshopName = computed(() => {
  if (onlineDevice.value && onlineDevice.value.store && onlineDevice.value.store.name) {
    return onlineDevice.value.store.name.trim()
  }
  return ''
})

export function updateSound(value) {
  onlineDevice.value = Object.assign({}, onlineDevice.value, { sound: value })
}

export function updateSoundMode(value) {
  onlineDevice.value = Object.assign({}, onlineDevice.value, { soundLoop: value })
}

//showErrorSnackbar
export async function checkClearOrderPasswd() {
  if (passcode.value !== user.value.passcode) {
    return showErrorSnackbar('Wrong Passcode!')
  }
  dialog.value = false
  await cms.getModel('Order').deleteMany({ online: true })
  showInfoSnackbar('Deleted all online orders!')
}


function showErrorSnackbar(error, timeout = 5000) {
  const contentFn = () => (
    <div style="margin: 0 auto" class="row-flex align-items-center">
      <span>{error.message || error}</span>
    </div>);

  snackbarRef.value.showSnackbar(contentFn, '#E57373', timeout)
}
function showInfoSnackbar(text, timeout = 5000) {
  const contentFn = () => (
    <div style="margin: 0 auto" class="row-flex align-items-center">
      <span>{text}</span>
    </div>);
  snackbarRef.value.showSnackbar(contentFn, '#536dfe', timeout)
}

export function uploadData() {
  disableDataBtn.value = true
  cms.socket.emit('export-demo-data', isTemplateData.value, () => {
    disableDataBtn.value = false
  })
}

export function downloadData() {
  disableDataBtn.value = true
  cms.socket.emit('import-demo-data', () => {
    disableDataBtn.value = false
  })
}
