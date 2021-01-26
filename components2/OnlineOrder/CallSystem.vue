<script>
import { CALL_SYSTEM_MODES } from '../../components/constants';
import { ref, computed } from 'vue'
import cloneDeep from 'lodash/cloneDeep';

export default {
  setup() {
    const callSystemModes = ref([
      CALL_SYSTEM_MODES.OFF,
      CALL_SYSTEM_MODES.FRITZBOX,
      CALL_SYSTEM_MODES.DEMO,
      CALL_SYSTEM_MODES.MODEM_ROBOTIC,
      CALL_SYSTEM_MODES.MODEM_ARTECH,
    ])
    const currentCallSystemMode = ref(CALL_SYSTEM_MODES.OFF.value)
    const callSystemStatus = ref('')
    const ipAddresses = ref({})
    const dialog = ref({
      ip: false,
    })
    const lastSavedConfig = ref(null)
    const usbDevices = ref([])
    const selectedSerialDevice = ref('')

    const callSystemConfigChanged = computed(() => {
      return !(lastSavedConfig.value
          && lastSavedConfig.value.mode === currentCallSystemMode.value
          && lastSavedConfig.value.ipAddresses[currentCallSystemMode.value] === ipAddresses.value[currentCallSystemMode.value])
    })
    const callSystemStatusComputed = computed(() => {
      if (!callSystemConfigChanged.value && currentCallSystemMode.value === CALL_SYSTEM_MODES.OFF.value) return '';

      if (callSystemConfigChanged.value) {
        return " (Call system config has changed, press 'Update' to apply changes)";
      } else {
        return ` (${callSystemStatus.value})`;
      }
    })
    const callSystemIpText = computed(() => {
      switch (currentCallSystemMode.value) {
        case CALL_SYSTEM_MODES.FRITZBOX.value:
          return 'Fritzbox local IP';
        case CALL_SYSTEM_MODES.DEMO.value:
          return 'Fritzbox proxy server address';
        default:
          return '';
      }
    })

    async function loadData() {
      const callSystem = (await cms.getModel('PosSetting').findOne()).call
      callSystem.mode = callSystem.mode || CALL_SYSTEM_MODES.OFF.value
      callSystem.ipAddresses = callSystem.ipAddresses || {};

      ipAddresses.value = callSystem.ipAddresses || {}
      currentCallSystemMode.value = callSystem.mode
      lastSavedConfig.value = cloneDeep(callSystem)
      updateUsbDeviceList();
    }
    async function update() {
      const configChanged = callSystemConfigChanged.value;

      const call = {
        ipAddresses: ipAddresses.value,
        mode: currentCallSystemMode.value,
      }
      cms.socket.emit('get-call-system-status', updateConnectStatus);
      await cms.getModel('PosSetting').findOneAndUpdate({}, {call})
      await loadData()
      if (configChanged) cms.socket.emit('refresh-call-system-config')
    }
    function changeIp(value) {
      ipAddresses.value[currentCallSystemMode.value] = value
    }
    function updateConnectStatus(status) {
      if (status) callSystemStatus.value = status;
    }
    function updateUsbDeviceList() {
      cms.socket.emit('list-usb-devices', currentCallSystemMode);
    }
    watch(() => currentCallSystemMode.value, (newValue) => {
      cms.socket.emit('get-call-system-status', updateConnectStatus);
      let defaultValue = null;
      if (newValue === CALL_SYSTEM_MODES.DEMO.value) defaultValue = 'https://fritzbox-proxy-10000.gigasource.io';
      else if (newValue === CALL_SYSTEM_MODES.FRITZBOX.value) defaultValue = '192.168.178.1:1012';
      else if (newValue === CALL_SYSTEM_MODES.OFF.value) defaultValue = null;
      else if (newValue === CALL_SYSTEM_MODES.MODEM_ROBOTIC.value
          || newValue === CALL_SYSTEM_MODES.MODEM_ARTECH.value) updateUsbDeviceList();
      if (defaultValue === null) return;
      ipAddresses[newValue] = ipAddresses[newValue] || defaultValue;
    })
    return () => <>
      <div class="call" >
        <div class="call-title mb-2" >
          <span>
            Call system </span>
          {
            (callSystemStatus.value || callSystemConfigChanged.value) &&
            <span>
              { callSystemStatusComputed.value } </span>
          }
        </div>
        <div class="row-flex align-items-center justify-start" >
          <g-grid-select class="mt-2" items={ callSystemModes.value } mandatory grid={ false } v-model={currentCallSystemMode.value}  v-slots={{ 'default': ({ toggleSelect, item }) => <>
              <g-btn class="mx-1 mb-1" onClick={() => toggleSelect(item)} disabled={ item === 'auto' } >
                { item.text } </g-btn>
            </>
            ,
            'selected': ({ toggleSelect, item }) => <>
              <g-btn class="mx-1 mb-1" onClick={() => toggleSelect(item)} background-color="blue" text-color="white" >

                { item.text }
              </g-btn>
            </>
          }}> </g-grid-select>
        </div>
        {
          (currentCallSystemMode.value === CALL_SYSTEM_MODES.FRITZBOX.value
              || currentCallSystemMode.value === CALL_SYSTEM_MODES.DEMO.value) ?
              <div>
                <p class="call-title" >
                  { callSystemIpText.value } </p>
                <g-text-field-bs v-model={ipAddresses.value[currentCallSystemMode.value]}  v-slots={{ 'append-inner': () => <>
                    <g-icon onClick={() => dialog.ip = true} >
                      icon-keyboard </g-icon>
                  </>
                  ,
                }}> </g-text-field-bs>
              </div>
              :
              (
                  (currentCallSystemMode.value === CALL_SYSTEM_MODES.MODEM_ROBOTIC.value
                      || currentCallSystemMode.value === CALL_SYSTEM_MODES.MODEM_ARTECH.value) &&
                  <div>
                    <p class="call-title" >
                      { callSystemIpText.value } </p>
                    <g-list class="call-device-table" selectable mandatory elevation={ 0 } height="200px" v-model={selectedSerialDevice.value} items={ usbDevices.value } > </g-list>
                  </div>
              )
        }
        <div class="action-buttons" >
          {
            (currentCallSystemMode.value === CALL_SYSTEM_MODES.MODEM_ROBOTIC.value
                || currentCallSystemMode.value === CALL_SYSTEM_MODES.MODEM_ARTECH.value) &&
            <g-btn-bs width="80" background-color="#2979FF" onClick={updateUsbDeviceList} >
              Refresh
            </g-btn-bs>
          }
          <g-btn-bs width="80" background-color="#2979FF" onClick={update} >
            Update
          </g-btn-bs>
        </div>
        <dialog-text-filter v-model={dialog.value.ip} label="Call System IP" defaultValue={ ipAddresses.value[currentCallSystemMode.value] } onSubmit={changeIp} > </dialog-text-filter>
      </div>
    </>
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
