import { computed, ref, watch, onActivated, reactive } from 'vue';
import { isIOS, online, posSettings } from '../AppSharedStates';
import _ from 'lodash';
import { v4 as uuidv4 } from 'uuid';
import { execGenScopeId, genScopeId } from '../utils';
import { useRouter } from 'vue-router';
import { updateSetting } from '../Settings/settings-shared-logics';

const token = uuidv4()

export const errorMessage = ref('No internet connection')
export const sending = ref(false)
const signedInFailed = ref(false)
export const error = computed(() => {
  return offline.value || signedInFailed.value
})

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

export const RequestFactory = () => {
  const signInRequest = ref(null)

  async function getSignInRequest() {
    const { signInRequest: _signInRequest } = await cms.getModel('PosSetting').findOne()
    if (_signInRequest) signInRequest.value = _signInRequest
  }

  const placesSearchResult = ref([])
  const placeId = ref('')
  const place = ref('')
  const debouncedSearch = _.debounce(searchPlace, 500)
  const phone = ref('')

  onActivated(() => {
    placesSearchResult.value = []
    placeId.value = ''
  })

// computed
  const disableSendBtn = computed(() => signInRequest.value && signInRequest.value.status === 'pending')
  const deniedRequest = computed(() => signInRequest.value && signInRequest.value.status === 'notApproved')

// methods

  function searchPlace(text) {
    if (!text || text.length < 4) {
      placesSearchResult.value = []
      return
    }
    cms.socket.emit('searchPlace', text, token, places => {
      placesSearchResult.value = places.map(p => {
        return ({
          text: p.description,
          value: p.place_id,
        });
      })
    })
  }

  function getPlaceDetail() {
    if (placesSearchResult.value.find(item => item.value === placeId.value)) {
      return new Promise(resolve => {
        cms.socket.emit('getPlaceDetail', placeId.value, token.value, data => {
          resolve(data)
        })
      })
    }
  }


  async function sendRequest() {
    sending.value = true
    const details = await getPlaceDetail()

    const { name, formatted_address: address, geometry: { location }, address_components } = details
    const storeData = { name, address, location }
    if (address_components && address_components.length) {
      const countryComponent = address_components.find(c => c.types.includes('country'))
      storeData.country = countryComponent && countryComponent.long_name
      const zipCodeComponent = address_components.find(c => c.types.includes('postal_code'))
      storeData.zipCode = zipCodeComponent && zipCodeComponent.long_name
    }
    cms.socket.emit('sendSignInRequest', phone.value, placeId.value, storeData, response => {
      signInRequest.value = response
      sending.value = false
      if (response.isFirstDevice) openImportDataDialog()
    })
  }

  //fixme: text-field-component="PosTextField" cause problems for events onInputClick and onUpdate:searchText
  const renderRequestTab = () =>
    <g-tab-item item={items.value[0]} style="height: 230px; padding-top: 4px">
      {genScopeId(() => <>
        <g-combobox class="w-100 mt-1" v-model={placeId.value}
          // text-field-component="PosTextField"
          // key={`tab_${items.value[0].title}`}
                    keep-menu-on-blur
                    clearable
                    virtualEvent={isIOS.value}
                    skip-search
                    menu-class="menu-autocomplete-setup"
                    items={placesSearchResult.value}
                    onInputClick={() => showKeyboard.value = true}
                    onUpdate:searchText={debouncedSearch}/>
        <pos-textfield-new class="tf-phone" label="Phone number"
                           onClick={() => showKeyboard.value = true}
                           v-model={phone.value}/>
        {renderErrorMessage()}
        <div class="dialog-message--subtext">
          <b>Note:</b>
          <span style="font-style: italic; color: #757575">
            {disableSendBtn.value
              ? 'Your sign-in request is pending approval.'
              : 'Please contact your local provider to start using the program.'}
          </span>
        </div>
        <div class="row-flex w-100">
          {
            (deniedRequest.value) &&
            <div class="dialog-message--note" style="color: #ff4452">
              <b>Your last sign-in request was declined!</b>
            </div>
          }
          <g-spacer/>
          <div>
            <g-btn-bs backgroundColor={sending.value ? 'grey' : '#2979FF'}
                      text-color="white" width="10em" height="44px"
                      disabled={disableSendBtn.value}
                      onClick={sendRequest}>
              {
                (sending.value)
                  ? <g-progress-circular class="mr-2" indeterminate color="#fff"/>
                  : (disableSendBtn.value) ? 'Request sent' : 'Send Request'
              }
            </g-btn-bs>
          </div>
        </div>
      </>)()}
    </g-tab-item>
  return {
    renderRequestTab, place, placeId, phone, searchPlace, placesSearchResult, getSignInRequest
  }
}

//     async function enterPress() {
//       if (tab.value.title === 'Address') {
//         await sendRequest()
//       } else if (tab.value.title === 'Pairing Code') {
//         await connect()
//       }
//     }


export const PairingFactory = () => {
  const router = useRouter()
  const pairing = ref(false)
  const code = ref('')
  const dialog = reactive({
    demo: false,
  })

  const demoMode = ref('')

  function openDialogDemo() {
    demoMode.value = 'demo'
    dialog.demo = true
  }


  function openImportDataDialog() {
    demoMode.value = 'paired'
    dialog.demo = true
  }

  function start() {
    router
  }

  function selectDemoData(store) {
    toggleOverlay()
    const paired = demoMode.value === 'paired';
    cms.socket.emit('set-demo-store', store, paired, () => {
      if (paired) {
        start()
      } else {
        skipPairing()
      }
      toggleOverlay()
    })
  }

  //todo: should make some function here to be singleton
  async function unlockFeatures() {
    const FeatureModel = cms.getModel('Feature');
    const posFeatures = [
      'fastCheckout', 'manualTable', 'delivery', 'editMenuCard', 'tablePlan', 'editTablePlan',
      'staffReport', 'eodReport', 'monthlyReport', 'alwaysOn',
    ]
    await FeatureModel.updateMany({ name: { $in: posFeatures } }, { enabled: true }, { upsert: true })
  }

  async function skipPairing() {
    await updateSetting({skipPairing: true})
    await unlockFeatures()
    router.push('/pos-login')
  }

  function connect() {
    pairing.value = true
    cms.socket.emit('registerOnlineOrderDevice', code.value, (_error, deviceId, isFirstDevice) => {
      if (_error) {
        signedInFailed.value = true
        errorMessage.value = 'Pair failed. Please try again.'
      } else if (isFirstDevice) {
        openImportDataDialog()
      } else {
        error.value = false
        code.value = ''
        router.push('/pos-login')
        cms.socket.emit('getWebshopName')
      }
      pairing.value = false
    })
  }

  const renderPairingTab = () =>
    <g-tab-item item={items.value[1]} style="height: 200px; padding-top: 4px">
      {genScopeId(() => <>
        <g-text-field-bs large virtualEvent={isIOS.value}
                         class="bs-tf__pos mt-1" v-model={code.value}
                         style="margin-bottom: 12px;"
                         onClick={() => showKeyboard.value = true}>
        </g-text-field-bs>
        {renderErrorMessage()}
        <div class="dialog-message--subtext">
          <b>Note:</b>
          <span style="font-style: italic; color: #757575">
            Please contact your local provider to start using the program. Internet connection is required.
          </span>
        </div>
        <div class="row-flex justify-end">
          <g-btn-bs backgroundColor={pairing.value ? 'grey' : '#2979FF'} text-color="white" width="7.5em" height="44px" onClick={connect} disabled={pairing.value}>
            {(pairing.value) ? <g-progress-circular class="mr-2" indeterminate/> : 'Connect'}
          </g-btn-bs>
        </div>
      </>)()}
    </g-tab-item>
  return { renderPairingTab, demoMode, openDialogDemo, dialog, selectDemoData }
}
