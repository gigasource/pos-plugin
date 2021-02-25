<script>
import { CALL_SYSTEM_MODES } from '../../../components/constants';
import {
  callSystemStatus,
  callSystemConfigChanged,
  callSystemStatusComputed,
  currentCallSystemMode,
  callSystemIpText,
  dialog,
  selectedSerialDevice,
  usbDevices,
  ipAddresses,
  callSystemModes,
  updateUsbDeviceList,
  changeIp,
  update,
  loadData
} from './call-system-logics';
import { genScopeId } from '../../utils';

export default {
  setup() {
    loadData()

    const callSystemModesRender = genScopeId(() => <div class="row-flex align-items-center justify-start">
        <g-grid-select class="mt-2" items={callSystemModes} mandatory grid={false} v-model={currentCallSystemMode.value} v-slots={{
          default: genScopeId(({ toggleSelect, item }) =>
              <g-btn class="mx-1 mb-1" onClick={() => toggleSelect(item)} disabled={item === 'auto'}>
                {item.text}
              </g-btn>
          ),
          selected: genScopeId(({ toggleSelect, item }) =>
              <g-btn class="mx-1 mb-1" onClick={() => toggleSelect(item)} background-color="blue" text-color="white">
                {item.text}
              </g-btn>)
        }}/>
      </div>
    )

    function renderFritzbox() {
      return (
          <div>
            <p class="call-title">{callSystemIpText.value} </p>
            <g-text-field-bs v-model={ipAddresses.value[currentCallSystemMode.value]} v-slots={{
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
          <div class="call-title mb-2">
            <span>Call system</span>
            { (callSystemStatus.value || callSystemConfigChanged.value) && <span> {callSystemStatusComputed.value} </span> }
          </div>

          { callSystemModesRender() }

          { isFritzBoxMode.value
                ? renderFritzbox()
                : isUSRoboticOrArtechModem.value && <div>
                  <p class="call-title">{callSystemIpText.value}</p>
                  <g-list class="call-device-table" selectable mandatory elevation={0} height="200px" v-model={selectedSerialDevice.value} items={usbDevices.value}></g-list>
                </div> }

          <div class="action-buttons">
            { isUSRoboticOrArtechModem.value && <g-btn-bs width="80" background-color="#2979FF" onClick={updateUsbDeviceList}>Refresh</g-btn-bs> }
            <g-btn-bs width="80" background-color="#2979FF" onClick={update}>Update</g-btn-bs>
          </div>

          <dialog-text-filter v-model={dialog.value.ip} label="Call System IP" defaultValue={ipAddresses.value[currentCallSystemMode.value]} onSubmit={changeIp}></dialog-text-filter>
        </div>)
  }
}
</script>

<style scoped lang="scss">
@media only screen and (max-width: 1280px) {
  .call {
    width: initial;
    padding-right: 24px;
  }
}
@media only screen and (min-width: 1281px) {
  .call {
    width: 65%;
  }
}
.call {
  display: flex;
  flex-direction: column;
  background-color: white;
  padding-left: 24px;
  height: 100%;
  overflow: auto;

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
  }

  .action-buttons {
    align-self: flex-end;
    margin-top: 12px;
  }
}
</style>
