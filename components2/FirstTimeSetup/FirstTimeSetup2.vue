<script>
import { withModifiers, ref, computed, watch } from 'vue'
import { genScopeId } from '../utils';
import _ from 'lodash';
import { v4 as uuidv4 } from 'uuid';
import { useRouter } from 'vue-router'

export default {
  name: 'FirstTimeSetup2',
  props: {},
  setup() {
    const dialog = ref({
      pairing: true,
      input: false,
      combobox: false,
      demo: false,
    })

    const router = useRouter()

    const code = ref('')
    const error = ref(false)
    const errorMessage = ref('No internet connection')
    const sending = ref(false)
    const pairing = ref(false)
    const offline = ref(false)
    const clickCount = ref(0)
    const showCustomUrlDialog = ref(false)
    const placesSearchResult = ref([])
    const placeId = ref('')
    const place = ref('')
    const debouncedSearch = ref(() => null)
    const signInRequest = ref(null)
    const items = ref([{ title: 'Address' }, { title: 'Pairing Code' }])
    const tab = ref(null)
    const showKeyboard = ref(false)
    const demoMode = ref('demo')
    const phone = ref('')

    // life-cycle
    async function created() {
      tab.value = items.value[0]
      if (!navigator.onLine) {
        offline.value = true
        error.value = true
        errorMessage.value = ''
      }

      window.addEventListener('online', () => {
        error.value = false
      });

      window.addEventListener('offline', () => {
        error.value = true
      });

      debouncedSearch.value = _.debounce(searchPlace, 500)
      await getRequest()

      cms.socket.on('denySignIn', () => {
        if (signInRequest.value) {
          signInRequest.value.status = 'notApproved'
        } else {
          getRequest()
        }
      })
    }

    async function activated() {
      placesSearchResult.value = []
      placeId.value = ''
      await getRequest()
    }

// computed
     const disableSendBtn = computed(() => signInRequest.value && signInRequest.value.status === 'pending')
     const deniedRequest = computed(() => signInRequest.value && signInRequest.value.status === 'notApproved')

// methods
     function changeCode(code) {
      code.value = code
    }

     function start() {
      router.push({ path: '/pos-login' })
    }

     function connect() {
      pairing.value = true

      cms.socket.emit('registerOnlineOrderDevice', code.value, (error, deviceId, isFirstDevice) => {
        if (error) {
          error.value = true
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

     function secretClick() {
      if (clickCount.value === 9) {
        showCustomUrlDialog.value = true
      } else {
        clickCount.value++
      }
    }

     function updateServerUrl(url) {
      console.error('PosStore:updateServerUrl was not injected')
    }

     async function getServerUrl(cb) {
      console.error('PosStore:getServerUrl was not injected')
    }

     function searchPlace(text) {
      if (!text || text.length < 4) {
        placesSearchResult.value = []
        return
      }
      token.value = uuidv4()
      cms.socket.emit('searchPlace', text, token.value, places => {
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

     async function getRequest() {
      const { signInRequest } = await cms.getModel('PosSetting').findOne()
      if (signInRequest) signInRequest.value = signInRequest
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
      cms.socket.emit('sendSignInRequest', phone.value, placeId.value, storeData, request => {
        signInRequest.value = request
        sending.value = false
        if (request.isFirstDevice) openImportDataDialog()
      })
    }

     async function enterPress() {
      if (tab.value.title === 'Address') {
        await sendRequest()
      } else if (tab.value.title === 'Pairing Code') {
        await connect()
      }
    }

     function openDialogDemo() {
      demoMode.value = 'demo'
      dialog.value.demo = true
    }


     function openImportDataDialog() {
      // import data dialog
      demoMode.value = 'paired'
      dialog.value.demo = true
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

     function skipPairing() {
      console.error('PosStore:skipPairing was not injected')
    }

    watch(() => signInRequest, (val) => {
      if (val && val.status !== 'notApproved' && !val.isFirstDevice) {
        start()
      }
    })



    const renderFn = genScopeId(() => (
        <div class="background row-flex align-items-center justify-center">
          <div class={showKeyboard ? 'left' : 'center'}>
            <div class="dialog-title" onClick={withModifiers(secretClick, ['stop'])}>
              Welcome to Restaurant+ POS
            </div>
            <g-tabs v-model={tab} items={items}>
              <g-tab-item item={items[0]} style="height: 230px; padding-top: 4px">
                <g-combobox class="w-100 mt-1" v-model={placeId}
                            text-field-component="PosTextField"
                            key={`tab_${tab.title}`}
                            keep-menu-on-blur
                            clearable
                            virtualEvent={isIOS}
                            skip-search
                            menu-class="menu-autocomplete-setup"
                            items={placesSearchResult}
                            onInputClick={() => showKeyboard = true}
                            onUpdate:searchtext={debouncedSearch}>
                </g-combobox>
                <pos-textfield-new class="tf-phone" label="Phone number"
                                   onClick={() => showKeyboard = true}
                                   v-model={phone}></pos-textfield-new>
                {
                  (error) &&
                  <div class="dialog-message--error">
                    { (offline) && <g-icon>icon-no-connection</g-icon>}
                    <span class="ml-2 fs-small">{errorMessage}</span>
                  </div>
                }
                <div class="dialog-message--subtext">
                  <b>Note:</b>
                  <span style="font-style: italic; color: #757575">
                    {disableSendBtn
                        ? 'Your sign-in request is pending approval.'
                        : 'Please contact your local provider to start using the program.'}
                  </span>
                </div>
                <div class="row-flex w-100">
                  {
                    (deniedRequest) &&
                    <div class="dialog-message--note" style="color: #ff4452">
                      <b>Your last sign-in request was declined!</b>
                    </div>
                  }
                  <g-spacer></g-spacer>
                  <div>
                    <g-btn-bs backgroundColor={sending ? 'grey' : '#2979FF'}
                              text-color="white" width="10em" height="44px"
                              disabled={disableSendBtn}
                              onClick={sendRequest}>
                      {
                        (sending)
                            ? <g-progress-circular className="mr-2" indeterminate color="#fff"></g-progress-circular>
                            : (disableSendBtn) ? 'Request sent' : 'Send Request'
                      }
                    </g-btn-bs>
                  </div>
                </div>
              </g-tab-item>
              <g-tab-item item={items[1]} style="height: 200px; padding-top: 4px">
                <g-text-field-bs large virtualEvent={isIOS}
                                 class="bs-tf__pos mt-1" v-model={code}
                                 style="margin-bottom: 12px;"
                                 onClick={() => showKeyboard = true}>
                </g-text-field-bs>
                {
                  (error) &&
                  <div class="dialog-message--error">
                    { (offline) && <g-icon>icon-no-connection</g-icon> }
                    <span class="ml-2 fs-small">{errorMessage}</span>
                  </div>
                }
                <div class="dialog-message--subtext">
                  <b>Note:</b>
                  <span style="font-style: italic; color: #757575">
                    Please contact your local provider to start using the program. Internet connection is required.
                  </span>
                </div>
                <div class="row-flex justify-end">
                  <g-btn-bs backgroundColor={pairing ? 'grey' : '#2979FF'} text-color="white" width="7.5em" height="44px" onClick={connect} disabled={pairing}>
                    { (pairing) ? <g-progress-circular className="mr-2" indeterminate></g-progress-circular> : 'Connect'}
                  </g-btn-bs>
                </div>
              </g-tab-item>
            </g-tabs>
          </div>
          <dialog-custom-url v-model={showCustomUrlDialog} onConfirm={updateServerUrl} onGetserverurl={async cb => await getServerUrl(cb)}></dialog-custom-url>
          <g-btn style="position: absolute; top: 10px; right: 10px" onClick={openDialogDemo}>
            Skip to Demo
          </g-btn>
          {
            (showKeyboard) &&
            <div class="keyboard-wrapper">
              <pos-keyboard-full type="alpha-number" onEnterPressed={enterPress}></pos-keyboard-full>
            </div>
          }
          <dialog-demo v-model={dialog.demo} mode={demoMode} address={place} phone={phone} onComplete={selectDemoData}></dialog-demo>
        </div>
    ))

    return renderFn
  }
}
</script>
<style scoped lang="scss">
.background {
  height: 100%;
  background-size: cover;
  background-repeat: no-repeat;
  background-image: url("/plugins/pos-plugin/assets/background-blur.png");


  .center, .left {
    background: white;
    display: flex;
    flex-direction: column;
    align-items: center;
    padding: 12px 4px;
  }

  .center {
    padding: 0 24px;
    border-radius: 4px;
    width: 50%;
  }

  .left {
    position: absolute;
    left: 0;
    top: 0;
    bottom: 0;
    width: 40%;
  }

  .keyboard-wrapper {
    position: absolute;
    left: 40%;
    right: 0;
    bottom: 0;
    background-color: #f0f0f0;
    padding: 4px;

    ::v-deep .key {
      font-size: 18px !important;
      transition: none;

      &.key-enter {
        font-size: 14px !important;
      }
    }
  }
}

.dialog {
  width: 100%;
  background: white;
  border-radius: 4px;
  display: flex;
  flex-direction: column;
  align-items: center;

  &-title {
    font-size: 20px;
    font-weight: 700;
    margin: 12px 0;

    &--sub {
      font-size: 15px;
      margin-top: 8px;
      margin-bottom: 12px;
    }
  }

  &-message {
    font-size: 15px;
    color: #424242;
    text-align: center;
    margin-bottom: 16px;
    margin-top: 4px;

    &--error {
      color: #f44336;
      font-style: italic;
    }

    &--note {
      text-align: left;
      font-size: 12px;
      font-style: italic;
      align-self: center;
      margin-left: 5px;
    }

    &--subtext {
      margin-left: 5px;
      font-size: 12px;
      margin-bottom: 8px;
      text-align: left;
      align-self: flex-start;
    }
  }

  .bs-tf-wrapper {
    margin: 8px 0;

    ::v-deep {
      .bs-tf-label {
        font-size: 15px;
      }

      .bs-tf-input {
        font-size: 34px;
        font-weight: 700;
        color: #000000;
        text-align: center;
        width: 100%;
      }
    }

    &.text-small ::v-deep .input {
      flex: 1;

      .bs-tf-input {
        font-size: 24px;
        padding: 13px 6px;
      }
    }
  }
}

.g-combobox ::v-deep {
  .bs-tf-label {
    font-size: 16px;
    font-weight: 700;
    margin-bottom: 8px;
  }

  .bs-tf-input {
    font-size: 18px;
    padding: 12px 6px;
  }
}

.tf-phone {
  ::v-deep fieldset {
    background-color: #F0F0F0;
    border: 1px solid #ced4da;
  }

  &.g-tf__focused ::v-deep fieldset {
    border-color: #1271FF;
  }
}
</style>

<style lang="scss">
.menu-autocomplete-setup {
  .g-list {
    padding: 0;

    &-item {
      min-height: 0;
    }

    .g-list-item-content {
      padding-right: 4px;

      .g-list-item-text {
        white-space: normal;
        word-break: break-word;
        line-height: 1.4;
        padding: 2px 0;
      }
    }

    & > div:not(:last-child) .g-list-item-text {
      border-bottom: 1px solid #F0F0F0;
    }
  }
}
</style>
