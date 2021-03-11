<script>
import { computed } from 'vue'
import {
  CALL_SYSTEM_MODES,
  callSystemStatus,
  changeNotSavedWarningMessage,
  currentCallSystemMode,
  callSystemIpText,
  dialog,
  ipAddresses,
  callSystemModes,
  filteredUsbDevices,
  changeIp,
  switchMode,
  loadData
} from './call-system-logics';
import { genScopeId } from '../../utils';
import { useI18n } from 'vue-i18n';

export default {
  setup() {
    loadData()

    const { t } = useI18n()
    const callSystemModesRender = genScopeId(() => <div class="row-flex align-items-center justify-start">
        <g-select label="Caller Id"
                  style="width: 250px" class="mt-2 mb-4 call_system"
                  text-field-component="GTextFieldBs"
                  mandatory
                  items={callSystemModes} v-model={currentCallSystemMode.value}/>
      </div>
    )

    function renderFritzbox() {
      return (
          <div>
            <g-text-field-bs label={callSystemIpText.value} v-model={ipAddresses.value[currentCallSystemMode.value]} v-slots={{
              'append-inner': () => <g-icon onClick={() => dialog.ip = true}>icon-keyboard</g-icon>
            }}/>
          </div>
      )
    }

    const isFritzBoxMode = computed(() => {
      return currentCallSystemMode.value === CALL_SYSTEM_MODES.FRITZBOX.value || currentCallSystemMode.value === CALL_SYSTEM_MODES.DEMO.value
    })

    const isUSRoboticOrArtechModem = computed(() => {
      return currentCallSystemMode.value === CALL_SYSTEM_MODES.MODEM_ROBOTIC.value || currentCallSystemMode.value === CALL_SYSTEM_MODES.MODEM_ARTECH.value
    })

    return genScopeId(() =>
        <div class="call">
          { callSystemModesRender() }

          { isFritzBoxMode.value
                ? renderFritzbox()
                : isUSRoboticOrArtechModem.value && <div class="call-device-table">
                  <g-list
                      mandatory selectable
                      elevation={0} height="200px"
                      items={filteredUsbDevices.value}
                      model-value={ipAddresses.value[currentCallSystemMode.value]}
                      onUpdate:modelValue={devicePath => ipAddresses.value[currentCallSystemMode.value] = devicePath}
                      />
                </div> }

          <div class="call-title mb-2">
            {<i style="color: red; font-size: 10px"> {callSystemStatus.value[currentCallSystemMode.value]} </i>}
            <g-spacer/>
            {<i style="color: red; font-size: 10px"> {changeNotSavedWarningMessage.value} </i>}
          </div>

          <div class="row-flex">
            <g-spacer/>
            <g-btn-bs style="margin-right:0" width="80" background-color="#2979FF" onClick={switchMode}>{t('dialogs.save')}</g-btn-bs>
          </div>

          <dialog-text-filter v-model={dialog.value.ip} label="Call System IP" defaultValue={ipAddresses.value[currentCallSystemMode.value]} onSubmit={changeIp}></dialog-text-filter>
        </div>)
  }
}
</script>

<style scoped lang="scss">
.call {
  display: flex;
  flex-direction: column;
  background-color: white;
  padding-left: 24px;
  padding-right: 24px;
  height: 100%;
  overflow: auto;

  &_system :deep {
    .bs-tf-wrapper {
      margin: 0;
    }
  }

  &-title {
    font-size: 14px;
    font-weight: bold;
    margin-top: 12px;
    margin-bottom: 4px;
  }

  .bs-tf-wrapper {
    margin: 0;
    width: 100%;

    ::v-deep .input {
      flex: 1;
      padding-right: 12px;
    }
  }

  .g-switch-wrapper {
    margin: 4px;
  }

  &-device-table {
    border: 1px solid #ced4d9;
    min-height: 100px;
  }
}
</style>
