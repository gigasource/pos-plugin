<script>
import { attrComputed, genScopeId } from '../utils';
import { appHooks, posSettings } from '../AppSharedStates';
import { computed, ref, withModifiers, watch } from 'vue'
import cms from 'cms'
import { useI18n } from 'vue-i18n';
import { updateSetting } from './settings-be';

export default {
  setup() {
    const { t } = useI18n()
    appHooks.emit('settingChange')

    async function fetchGeneralSettings() {
      return await cms.getModel('PosSetting').findOne({})
    }

    const isConnectToMaster = ref(false)
    const generalSettings = ref(null)
    fetchGeneralSettings().then(posSettings => {
      const _generalSettings = posSettings.generalSetting || {};
      if (!_generalSettings.googleMapApiKey && posSettings.call) {
        _generalSettings['googleMapApiKey'] = posSettings.call.googleMapApiKey
      }
      generalSettings.value = _generalSettings
    })
    const quickPayButtonActions = ['auto', 'pay', 'receipt']
    const dialog = ref({ googleMapApiKey: false })
    const barcode = attrComputed(generalSettings, 'barcode')
    const favoriteArticle = attrComputed(generalSettings, 'favoriteArticle')
    const virtualKeyboard = attrComputed(generalSettings, 'virtualKeyboard')
    const automaticCashdrawer = attrComputed(generalSettings, 'automaticCashdrawer')
    const quickFnRows = attrComputed(generalSettings, 'quickFnRows')
    const beginHour = attrComputed(generalSettings, 'beginHour', '00:00')
    const printReceiptWithPay = attrComputed(generalSettings, 'printReceiptWithPay')
    const quickBtn = attrComputed(generalSettings, 'quickBtn')
    const quickBtnAction = attrComputed(generalSettings, 'quickBtnAction', 'pay')
    const onlyCheckoutPrintedItems = attrComputed(generalSettings, 'onlyCheckoutPrintedItems', 'pay')
    const useVirtualPrinter = attrComputed(generalSettings, 'useVirtualPrinter')
    const deliveryOrderMode = attrComputed(generalSettings, 'deliveryOrderMode', 'tablet')
    const googleMapApiKey = attrComputed(generalSettings, 'googleMapApiKey')
    const showTutorial = attrComputed(generalSettings, 'showTutorial', false)
    const isMaster = attrComputed(generalSettings, 'isMaster', false)
    const masterIp = attrComputed(generalSettings, 'masterIp', '')
    //todo: should not watch like this, should add handler for update:modelValue
    watch(() => generalSettings.value,(val, oldV) => {
      if (val) {
        updateSetting({ generalSetting: val })
      }
    }, {
      deep: true
    })

    cms.socket.on('isMaster', (_isMaster, _masterIp) => {
      generalSettings.value.isMaster = _isMaster
      console.log('Is master is', isMaster.value)
      if (_masterIp)
        masterIp.value = _masterIp
    })
    cms.socket.emit('isConnectedToMaster', (isConnected) => {
      isConnectToMaster.value = isConnected
    })
    cms.socket.on('connectedToMaster', (val) => { // val is true or false which is status of client socket
      isConnectToMaster.value = val
    })
    function updateIsMaster(val) {
      isMaster.value = val
      cms.socket.emit('setMasterFe', val)
    }
    function updateMasterIp(val) {
      masterIp.value = val
      cms.socket.emit('setMasterFe', false, masterIp.value)
    }

    const leftSideRender = genScopeId(() => <div class="col-5 px-3">
      <div class="row-flex align-items-center justify-between">
        <span> {t('settings.companyBarcode')} </span>
        <g-switch v-model={barcode.value}></g-switch>
      </div>
      <div class="row-flex align-items-center justify-between">
        <span> {t('settings.showFav')} </span>
        <g-switch v-model={favoriteArticle.value}></g-switch>
      </div>
      <div class="row-flex align-items-center justify-between">
        <span> {t('settings.autoCashdrawer')} </span>
        <g-switch v-model={automaticCashdrawer.value}></g-switch>
      </div>
      <div class="row-flex align-items-center justify-between">
        <span> Quick pay/print button </span>
        <g-switch v-model={quickBtn.value}></g-switch>
      </div>
      <div class="row-flex align-items-center justify-between">
        <span> Only checkout printed items </span>
        <g-switch v-model={onlyCheckoutPrintedItems.value}></g-switch>
      </div>
      <div class="row-flex align-items-center justify-between">
        <span> Using virtual printer </span>
        <g-switch v-model={useVirtualPrinter.value}></g-switch>
      </div>
      <div class="row-flex align-items-center justify-between">
        <span> Pay button prints receipt </span>
        <g-switch v-model={printReceiptWithPay.value}></g-switch>
      </div>
      <div class="row-flex align-items-center justify-between">
        <span> Show tutorial button </span>
        <g-switch v-model={showTutorial.value}></g-switch>
      </div>
      <div className="row-flex align-items-center justify-between">
        <span> Is master </span>
        <g-switch modelValue={isMaster.value} onUpdate:modelValue={updateIsMaster}></g-switch>
      </div>
    </div>)

    const rightSideRender = genScopeId(() => <div class="flex-grow-1 offset-1">
      <div className="row-flex align-items-center justify-center">
        <pos-time-picker label={t('settings.beginHour')} v-model={beginHour.value} v-slots={{
          'append': () => <g-icon> access_time </g-icon>
        }}>
        </pos-time-picker>
      </div>
      <g-select text-field-component="GTextFieldBs" text-field-class="bs-tf__pos" class="mt-2" items={['tablet', 'mobile']} label="Delivery order mode" v-model={deliveryOrderMode.value}/>
      <div class="row-flex align-items-center justify-between">
        Google Map API Key
      </div>
      <g-text-field-bs class="google-map-api-input bs-tf__pos" v-model={googleMapApiKey.value} v-slots={{
        'append-inner': () =>
            <g-icon onClick={() => dialog.value.googleMapApiKey = true}> icon-keyboard </g-icon>
      }}>
      </g-text-field-bs>
      <dialog-text-filter v-model={dialog.value.googleMapApiKey} label="Google Map API Key" defaultValue={googleMapApiKey.value} onSubmit={(value) => googleMapApiKey.value = value}/>
      <div className="row-flex align-items-center justify-between">
        Master IP
      </div>
      <g-text-field-bs disable={isMaster.value} className="google-map-api-input bs-tf__pos" v-model={masterIp.value} v-slots={{
        'append-inner': () =>
            <g-icon onClick={() => dialog.value.masterIp = isMaster.value ? false : true}> icon-keyboard </g-icon>
      }}>
      </g-text-field-bs>
      <dialog-text-filter v-model={dialog.value.masterIp} label="Master IP"
                          defaultValue={masterIp.value} onSubmit={(value) => updateMasterIp(value)}/>
      <div className="row-flex align-items-center justify-between" style="color:red">
        {isConnectToMaster.value ? 'Connected' : 'No connection'}
      </div>
      <div class="row-flex align-items-center justify-between">
        Quick pay button's action
      </div>
      <div class="row-flex align-items-center justify-start">
        <g-grid-select class="mt-2" items={quickPayButtonActions} mandatory grid={false} v-model={quickBtnAction.value} v-slots={{
          'default': genScopeId(({ toggleSelect, item }) =>
              <g-btn class="mx-1 mb-1" onClick={() => toggleSelect(item)} disabled={item === 'auto'}> {item} </g-btn>)
          ,
          'selected': genScopeId(({ toggleSelect, item }) =>
              <g-btn class="mx-1 mb-1" onClick={() => toggleSelect(item)} background-color="blue" text-color="white">
                {item}
              </g-btn>)
        }}>
        </g-grid-select>
      </div>
    </div>)
    return genScopeId(() =>
        <div class="wrapper">
          {leftSideRender()}
          {rightSideRender()}
        </div>)
  }
}
</script>

<style scoped lang="scss">
.wrapper {
  display: flex;
  padding: 16px;
  font-size: 13px;
  line-height: 16px;
  overflow-y: scroll;
}

.btn-fn-row {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 40px;
  height: 40px;
  background: #F0F0F0;
  border: 1px solid #C9C9C9;
  border-radius: 2px;
  font-size: 13px;
  line-height: 16px;
  color: #1D1D26;
  margin-left: 8px;

  &.selected {
    border-color: #1271FF;
  }
}

.btn-fn-row:first-of-type {
  margin-left: 4px;
}

span {
  max-width: 150px;
}

.g-select ::v-deep {
  .bs-tf-wrapper {
    margin-left: 0;

    .input {
      color: #1d1d26;
    }
  }
}

.google-map-api-input {
  margin-left: 0;
  margin-right: 0;
  width: calc(100% - 10px);

  ::v-deep .input {
    flex: 1;
    padding-right: 12px;
  }
}
</style>
