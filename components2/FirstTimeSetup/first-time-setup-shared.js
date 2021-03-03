import { computed, reactive, ref } from 'vue';
import { online } from '../AppSharedStates';
import { updateSetting } from '../Settings/settings-shared-logics';


export const errorMessage = ref('No internet connection')
export const sending = ref(false)
export const signedInFailed = ref(false)
export const providedPlaceId = ref(true)
export const error = computed(() => {
  return offline.value || signedInFailed.value || !providedPlaceId.value
})

export const dialog = reactive({
  demo: false,
})

export const sendRequestTabRef = ref(null)
export const pairingTabRef = ref(null)

export const offline = computed(() => {
  return !online.value
})

export const tab = ref(null)

export const items = ref([{ title: 'Address' }, { title: 'Pairing Code' }])

export const renderErrorMessage = () => error.value &&
  <div class="dialog-message--error">
    {(offline.value) && <g-icon>icon-no-connection</g-icon>}
    <span class="ml-2 fs-small"> {errorMessage.value} </span>
  </div>

export const showLoadingOverlay = ref(false)

export function toggleOverlay() {
  showLoadingOverlay.value = !showLoadingOverlay.value
}

export const showKeyboard = ref(false)


const count = ref(0)

export const showCustomUrlDialog = ref(false)

export function secretClick() {
  if (count.value === 9) {
    showCustomUrlDialog.value = true
  } else {
    count.value++
  }
}

export async function updateServerUrl(url) {
  try {
    await cms.getModel('PosSetting').findOneAndUpdate({}, { customServerUrl: url })
  } catch (e) {
    console.error(e)
  }
}

export async function getServerUrl(cb) {
  try {
    const { customServerUrl } = await cms.getModel('PosSetting').findOne()
    cb(customServerUrl)
  } catch (e) {
    console.error(e)
  }
}


export function sendRequest(phone, placeId, storeData, cb) {
  console.log(phone, placeId, storeData)
  cms.socket.emit('sendSignInRequest', phone, placeId, storeData, response => {
    cb(response)
  })
}

export async function onKeyEnterPressed() {
  if (tab.value.title === 'Address') {
    await sendRequestTabRef.value.onSendRequest()
  } else if (tab.value.title === 'Pairing Code') {
    await pairingTabRef.value.onConnect()
  }
}

export const demoMode = ref('')

export function openDialogDemo() {
  demoMode.value = 'demo'
  dialog.demo = true
}


export function openImportDataDialog() {
  demoMode.value = 'paired'
  dialog.demo = true
}

export async function unlockFeatures() {
  const FeatureModel = cms.getModel('Feature');
  const posFeatures = [
    'fastCheckout', 'manualTable', 'delivery', 'editMenuCard', 'tablePlan', 'editTablePlan',
    'staffReport', 'eodReport', 'monthlyReport', 'alwaysOn',
  ]
  await FeatureModel.updateMany({ name: { $in: posFeatures } }, { enabled: true }, { upsert: true })
}

export async function skipPairing() {
  await updateSetting({ skipPairing: true })
  await unlockFeatures()
}

export function selectDemoData(store, start) {
  toggleOverlay()
  const paired = demoMode.value === 'paired';
  console.log(store)
  cms.socket.emit('set-demo-store', store, paired, () => {
    toggleOverlay()
    if (paired) {
      start()
    } else {
      skipPairing()
      start()
    }
  })
}

export function connect(code, cb) {
  cms.socket.emit('registerOnlineOrderDevice', code, (_error, deviceId, isFirstDevice) => cb(_error, deviceId, isFirstDevice))
}
