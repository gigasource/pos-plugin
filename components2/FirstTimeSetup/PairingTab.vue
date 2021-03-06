<script>
import { reactive, ref } from 'vue';
import { updateSetting } from '../Settings/settings-be';
import { execGenScopeId, genScopeId } from '../utils';
import { isIOS } from '../AppSharedStates';
import { signedInFailed, connect, offline } from './first-time-setup-shared'
import {
  error,
  errorMessage,
  items,
  openImportDataDialog,
  showKeyboard,
  toggleOverlay
} from './first-time-setup-shared';

export default {
  name: 'PairingTab',
  props: {},
  emits: ['start'],
  setup: function (props, { emit }) {
    const pairing = ref(false)
    const code = ref('')
    const renderErrorMessage = () => error.value &&
        <div class="dialog-message--error">
          {(offline.value) && <g-icon>icon-no-connection</g-icon>}
          <span class="ml-2 fs-small"> {errorMessage.value} </span>
        </div>
    //todo: should make some function here to be singleton
    function onConnect() {
      pairing.value = true
      connect(code.value, (_error, deviceId, isFirstDevice) => {
        if (_error) {
          signedInFailed.value = true
          errorMessage.value = 'Pair failed. Please try again.'
        } else if (isFirstDevice) {
          openImportDataDialog()
        } else {
          error.value = false
          code.value = ''
          router.push('/pos-login')
          //todo:
          //cms.socket.emit('getWebshopName')
        }
        pairing.value = false
      })
    }

    const renderPairingTab = () => <>
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
        <g-btn-bs backgroundColor={pairing.value ? 'grey' : '#2979FF'} text-color="white" width="7.5em" height="44px" onClick={onConnect} disabled={pairing.value}>
          {(pairing.value) ? <g-progress-circular class="mr-2" indeterminate/> : 'Connect'}
        </g-btn-bs>
      </div>
    </>
    return { renderPairingTab }
  },
  render() {
    return execGenScopeId(this.renderPairingTab)
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
