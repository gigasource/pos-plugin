<script>
import { computed, onActivated, ref } from 'vue';
import _ from 'lodash';
import { execGenScopeId, internalValueFactory } from '../utils';
import { isIOS } from '../AppSharedStates';
import {
  error,
  errorMessage,
  offline,
  openImportDataDialog,
  providedPlaceId,
  sending,
  sendRequest,
  showKeyboard
} from './first-time-setup-shared';
import { v4 as uuidv4 } from 'uuid';

export default {
  name: 'SendRequestTab',
  props: {
    place: String,
    phone: String
  },
  emits: ['update:phone'],
  setup: function (props, { emit }) {
    const signInRequest = ref(null)
    const token = uuidv4()

    async function getSignInRequest() {
      const { signInRequest: _signInRequest } = await cms.getModel('PosSetting').findOne()
      if (_signInRequest) signInRequest.value = _signInRequest
    }

    const placesSearchResult = ref([])
    const placeId = ref('')
    const debouncedSearch = _.debounce(searchPlace, 500)
    const phone = internalValueFactory(props, { emit }, 'phone')

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
        // placesSearchResult.value = []
        return
      }
      cms.socket.emit('searchPlace', text, token, places => {
        console.log(places)
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


    async function onSendRequest() {
      sending.value = true
      const details = await getPlaceDetail()
      if (!details) {
        providedPlaceId.value = false
        errorMessage.value = 'For some app features, we need your Google Map PlaceId. Please choose the address as suggested by Google.'
        sending.value = false
        return
      } else {
        providedPlaceId.value = true
        errorMessage.value = ''
      }
      const { name, formatted_address: address, geometry: { location }, address_components } = details
      const storeData = { name, address, location }
      if (address_components && address_components.length) {
        const countryComponent = address_components.find(c => c.types.includes('country'))
        storeData.country = countryComponent && countryComponent.long_name
        const zipCodeComponent = address_components.find(c => c.types.includes('postal_code'))
        storeData.zipCode = zipCodeComponent && zipCodeComponent.long_name
      }
      sendRequest(phone.value, placeId.value, storeData, response => {
        signInRequest.value = response
        sending.value = false
        if (response.isFirstDevice) openImportDataDialog()
      })
    }

    const renderErrorMessage = () => error.value &&
        <div class="dialog-message--error">
          {(offline.value) && <g-icon>icon-no-connection</g-icon>}
          <span class="ml-2 fs-small"> {errorMessage.value} </span>
        </div>
    const renderRequestTab = () => <>
      <g-combobox class="w-100 mt-1" v-model={placeId.value}
                  text-field-component="GTextFieldBs"
          // key={`tab_${items.value[0].title}`}
                  keep-menu-on-blur
                  clearable
                  virtualEvent={isIOS.value}
                  skip-search
                  menu-class="menu-autocomplete-setup"
                  items={placesSearchResult.value}
                  onInputClick={() => showKeyboard.value = true}
                  onUpdate:searchText={debouncedSearch}/>
      <g-text-field-bs class="tf-phone" label="Phone number"
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
                    onClick={onSendRequest}>
            {
              (sending.value)
                  ? <g-progress-circular class="mr-2" indeterminate color="#fff"/>
                  : (disableSendBtn.value) ? 'Request sent' : 'Send Request'
            }
          </g-btn-bs>
        </div>
      </div>
    </>
    return {
      renderRequestTab, placeId, phone, searchPlace, placesSearchResult, getSignInRequest, onSendRequest
    }
  },
  render() {
    return execGenScopeId(this.renderRequestTab)
  }
}
</script>
<style scoped lang="scss">
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
}
</style>
