<script>
import { appHooks, posSettings } from '../../AppSharedStates';
import _ from 'lodash';
// import cms from 'cms'
import { computed, ref } from 'vue'
import Snackbar from '../../../components/Store/Snackbar';
import { genScopeId } from '../../utils';

export default {
  components: { Snackbar },
  setup() {
    appHooks.emit("settingChange")
    const keyboardDeliveryConfig = computed(() => (posSettings.value && posSettings.value.keyboardDeliveryConfig) || [])
    const position = ref({})
    const dialog = ref(false)
    const snackbarRef = ref(null)
    function fetchMenu() {
      //fixme: getDeliveryProducts never call to callback
      cms.socket.emit('getDeliveryProducts', () => {
        const contentFn = () => (
            <div style="margin: 0 auto">
              <span>Fetch menu successfully!</span>
            </div>);
        snackbarRef.value.showSnackbar(contentFn, '#536dfe', 3000)
      })
    }


    const changeExtraRows = function (val) {
      if (val > keyboardDeliveryConfig.value.length) {
        keyboardDeliveryConfig.value.unshift([' ', ' ', ' '])
      } else {
        keyboardDeliveryConfig.value.shift()
      }
      updateKeyboard(keyboardDeliveryConfig.value)
    }
    const openDialogEdit = function (_position) {
      position.value = _position
      dialog.value = true
    }
    const changeKeyboardExtension = async function (val) {
      _.set(keyboardDeliveryConfig.value, [position.value.top, position.value.left], val)
      updateKeyboard(keyboardDeliveryConfig.value)
    }

    async function updateKeyboard(val) {
      await cms.getModel('PosSetting').findOneAndUpdate({}, { keyboardDeliveryConfig: val })
      appHooks.emit('settingChange')
    }

    const keyboardRender = genScopeId(() =>
        <pos-order-delivery-keyboard key={dialog.value}
                                     mode="edit"
                                     keyboardConfig={keyboardDeliveryConfig.value}
                                     onEdit:keyboard={openDialogEdit}
        />)
    return genScopeId(() => <div class="delivery-config">
      <div class="delivery-config__title">
        Configuration
      </div>
      <div class="row-flex flex-grow-1">
        <div class="col-6">
          <div class="row-flex align-items-center mb-2">
            <p class="fw-600">Delivery Menu</p>
            <g-btn-bs background-color="#1271FF" onClick={fetchMenu}>Fetch</g-btn-bs>
          </div>
          <div class="mb-2 fw-600">Delivery keyboard</div>
          <div class="row-flex align-items-center mb-2">
            <p class="mr-2">External rows</p>
            <input-number width="148" modelValue={keyboardDeliveryConfig.value.length} onUpdate:modelValue={changeExtraRows}/>
          </div>
        </div>
        <div class="col-6 col-flex h-100">
          <g-spacer/>
          {keyboardRender()}
        </div>
      </div>
      <dialog-text-filter v-model={dialog.value} label="Enter key" onSubmit={changeKeyboardExtension}/>
      <Snackbar ref={snackbarRef}></Snackbar>
    </div>)
  }
}
</script>

<style scoped lang="scss">
.delivery-config {
  padding: 24px;
  height: 100%;
  display: flex;
  flex-direction: column;

  &__title {
    font-size: 18px;
    font-weight: 700;
    margin-bottom: 16px;
    display: flex;
    justify-content: space-between;
  }
}
</style>
