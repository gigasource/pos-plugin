<template>
  <div class="call">
    <div class="call-title mb-2">
      <span>Call system</span>
      <span v-if="callSystemStatus"> {{ callSystemStatusComputed }}</span>
    </div>
    <div class="row-flex align-items-center justify-start">
      <g-grid-select class="mt-2"
                     :items="callSystemModes"
                     mandatory
                     :grid="false"
                     v-model="currentCallSystemMode">
        <template #default="{ toggleSelect, item }">
          <g-btn class="mx-1 mb-1" @click="toggleSelect(item)" :disabled="item === 'auto'">{{ item.text }}</g-btn>
        </template>
        <template #selected="{ toggleSelect, item }">
          <g-btn class="mx-1 mb-1" @click="toggleSelect(item)" background-color="blue" text-color="white">
            {{ item.text }}
          </g-btn>
        </template>
      </g-grid-select>
    </div>

    <div v-if="currentCallSystemMode === CALL_SYSTEM_MODES.FRITZBOX.value
            || currentCallSystemMode === CALL_SYSTEM_MODES.DEMO.value">
      <p class="call-title">{{ callSystemIpText }}</p>
      <g-text-field-bs v-model="ipAddresses[currentCallSystemMode]">
        <template v-slot:append-inner>
          <g-icon @click="dialog.ip = true">icon-keyboard</g-icon>
        </template>
      </g-text-field-bs>
    </div>

    <div v-else-if="currentCallSystemMode === CALL_SYSTEM_MODES.MODEM_ROBOTIC.value">
      <p class="call-title">{{ callSystemIpText }}</p>
      <g-list class="call-device-table"
              selectable
              mandatory
              :elevation="0"
              height="200px"
              v-model="selectedSerialDevice"
              :items="usbDevices"/>
    </div>

    <div class="action-buttons">
      <g-btn-bs v-if="currentCallSystemMode === CALL_SYSTEM_MODES.MODEM_ROBOTIC.value"
                width="80"
                background-color="#2979FF"
                @click="updateUsbDeviceList">
        Refresh
      </g-btn-bs>
      <g-btn-bs width="80"
                background-color="#2979FF"
                @click="update">
        Update
      </g-btn-bs>
    </div>

    <dialog-text-filter
        v-model="dialog.ip"
        label="Call System IP"
        :default-value="ipAddresses[this.currentCallSystemMode]"
        @submit="changeIp"/>
  </div>
</template>

<script>
import cloneDeep from 'lodash/cloneDeep'
import {CALL_SYSTEM_MODES} from '../constants';

export default {
  name: "CallSystem",
  data() {
    return {
      callSystemModes: [
        CALL_SYSTEM_MODES.OFF,
        CALL_SYSTEM_MODES.FRITZBOX,
        CALL_SYSTEM_MODES.DEMO,
        CALL_SYSTEM_MODES.MODEM_ROBOTIC],
      currentCallSystemMode: CALL_SYSTEM_MODES.OFF.value,
      callSystemStatus: '',
      ipAddresses: {},
      dialog: {
        ip: false,
      },
      lastSavedConfig: null,
      CALL_SYSTEM_MODES,
      usbDevices: [],
      selectedSerialDevice: '',
    }
  },
  async created() {
    await this.loadData();
    cms.socket.on('update-call-system-status', this.updateConnectStatus);
    cms.socket.on('list-usb-devices', (devices) => {
      this.usbDevices = devices.map(({devicePath, deviceManufacturerName, deviceProductName}) => {
        return {
          text: `${devicePath} - ${deviceProductName} - ${deviceManufacturerName}`,
          value: devicePath,
        };
      });

      this.selectedSerialDevice = this.ipAddresses[CALL_SYSTEM_MODES.MODEM_ROBOTIC.value]
          ? this.ipAddresses[CALL_SYSTEM_MODES.MODEM_ROBOTIC.value]
          : (this.usbDevices.length > 0 ? this.usbDevices[0].value : '');
    });

    this.updateUsbDeviceList();
  },
  async activated() {

  },
  computed: {
    callSystemConfigChanged() {
      return !(this.lastSavedConfig
          && this.lastSavedConfig.mode === this.currentCallSystemMode
          && this.lastSavedConfig.ipAddresses[this.currentCallSystemMode] === this.ipAddresses[this.currentCallSystemMode])
    },
    callSystemStatusComputed() {
      if (!this.callSystemConfigChanged && this.currentCallSystemMode === CALL_SYSTEM_MODES.OFF.value) return '';

      if (this.callSystemConfigChanged) {
        return " (Call system config has changed, press 'Update' to apply changes)";
      } else {
        return ` (${this.callSystemStatus})`;
      }
    },
    callSystemIpText() {
      switch (this.currentCallSystemMode) {
        case CALL_SYSTEM_MODES.FRITZBOX.value:
          return 'Fritzbox local IP';
        case CALL_SYSTEM_MODES.DEMO.value:
          return 'Fritzbox proxy server address';
        default:
          return '';
      }
    }
  },
  watch: {
    currentCallSystemMode(value) {
      cms.socket.emit('get-call-system-status', this.updateConnectStatus);
      let defaultValue = '';

      if (value === CALL_SYSTEM_MODES.DEMO.value) defaultValue = 'https://fritzbox-proxy-10000.gigasource.io';
      else if (value === CALL_SYSTEM_MODES.FRITZBOX.value) defaultValue = '192.168.178.1:1012';
      else if (value === CALL_SYSTEM_MODES.OFF.value) defaultValue = '';
      else if (value === CALL_SYSTEM_MODES.MODEM_ROBOTIC.value) this.updateUsbDeviceList();

      this.ipAddresses[value] = this.ipAddresses[value] || defaultValue;
    },
    selectedSerialDevice(value) {
      this.ipAddresses[CALL_SYSTEM_MODES.MODEM_ROBOTIC.value] = value;
    },
    callSystemStatusComputed(value) {
      this.test = value;
    }
  },
  methods: {
    async loadData() {
      const callSystem = (await cms.getModel('PosSetting').findOne()).call
      callSystem.mode = callSystem.mode || CALL_SYSTEM_MODES.OFF.value
      callSystem.ipAddresses = callSystem.ipAddresses || {};

      this.ipAddresses = callSystem.ipAddresses || {}
      this.currentCallSystemMode = callSystem.mode
      this.lastSavedConfig = cloneDeep(callSystem)

      this.updateUsbDeviceList();
    },
    async update() {
      const configChanged = this.callSystemConfigChanged;

      const call = {
        ipAddresses: this.ipAddresses,
        mode: this.currentCallSystemMode,
      }
      cms.socket.emit('get-call-system-status', this.updateConnectStatus);
      await cms.getModel('PosSetting').findOneAndUpdate({}, {call})
      await this.loadData()
      if (configChanged) cms.socket.emit('refresh-call-system-config')
    },
    changeIp(value) {
      this.ipAddresses[this.currentCallSystemMode] = value
    },
    updateConnectStatus(status) {
      if (status) this.callSystemStatus = status;
    },
    updateUsbDeviceList() {
      cms.socket.emit('list-usb-devices');
    },
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
