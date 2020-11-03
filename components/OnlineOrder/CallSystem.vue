<template>
  <div class="call">
    <p class="call-title mb-2">{{ `Call System${callSystemStatus}` }}</p>
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

    <div v-if="currentCallSystemMode !== CALL_SYSTEM_MODES.OFF.value">
      <p class="call-title">{{ callSystemIpText }}</p>
      <g-text-field-bs v-model="ipAddresses[currentCallSystemMode]">
        <template v-slot:append-inner>
          <g-icon @click="dialog.ip = true">icon-keyboard</g-icon>
        </template>
      </g-text-field-bs>
    </div>

    <p class="call-title">Google Map API Key</p>
    <g-text-field-bs v-model="apiKey">
      <template v-slot:append-inner>
        <g-icon @click="dialog.api = true">icon-keyboard</g-icon>
      </template>
    </g-text-field-bs>
    <g-btn-bs width="80" background-color="#2979FF" style="margin: 16px 0 0; flex: 0 0 36px; align-self: flex-end"
              @click="update">Update
    </g-btn-bs>
    <dialog-text-filter v-model="dialog.ip" label="Call System IP" :default-value="''" @submit="changeIp"/>
    <dialog-text-filter v-model="dialog.api" label="Google Map API Key" :default-value="apiKey" @submit="changeApiKey"/>
  </div>
</template>

<script>
import cloneDeep from 'lodash/cloneDeep'

const CALL_SYSTEM_MODES = {
  OFF: {text: 'Off', value: 'off'},
  FRITZBOX: {text: 'Localhost (Fritzbox)', value: 'localhost-fritzbox'},
  DEMO: {text: 'Demo (Fritzbox)', value: 'demo-fritzbox'},
}

export default {
  name: "CallSystem",
  data() {
    return {
      callSystemModes: [CALL_SYSTEM_MODES.OFF, CALL_SYSTEM_MODES.FRITZBOX, CALL_SYSTEM_MODES.DEMO],
      currentCallSystemMode: CALL_SYSTEM_MODES.OFF.value,
      active: false,
      callSystemConnectionStatus: '',
      ipAddresses: {},
      apiKey: '',
      dialog: {
        ip: false,
        api: false,
      },
      lastSavedConfig: null,
      CALL_SYSTEM_MODES,
    }
  },
  async created() {
    await this.loadData()
    cms.socket.on('update-call-system-status', this.updateConnectStatus);
    cms.socket.emit('get-call-system-status', this.updateConnectStatus);
  },
  async activated() {

  },
  computed: {
    // demoModeLabel() {
    //   if (!this.demoMode) {
    //     return 'Demo mode'
    //   } else {
    //     if (this.lastSavedConfig && !this.lastSavedConfig.demoMode && this.demoMode) {
    //       return "Demo mode (press 'Update' to connect)"
    //     } else {
    //       return `Demo mode${this.demoModeStatus ? ` (${this.demoModeStatus})` : ''}`
    //     }
    //   }
    // },
    callSystemConfigChanged() {
      return !(this.lastSavedConfig
          && this.lastSavedConfig.mode === this.currentCallSystemMode
          && this.lastSavedConfig.ipAddresses[this.currentCallSystemMode] === this.ipAddresses[this.currentCallSystemMode])
    },
    callSystemStatus() {
      if (!this.callSystemConfigChanged && this.currentCallSystemMode === CALL_SYSTEM_MODES.OFF.value) return '';

      if (this.callSystemConfigChanged) {
        return " (Call system config has changed, press 'Update' to apply changes)";
      } else {
        return ` (${this.callSystemConnectionStatus})`;
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
      let defaultValue = '';

      if (value === CALL_SYSTEM_MODES.DEMO.value) defaultValue = 'https://fritzbox-proxy-10000.gigasource.io';
      else if (value === CALL_SYSTEM_MODES.FRITZBOX.value) defaultValue = '192.168.178.1:1012';
      else if (value === CALL_SYSTEM_MODES.OFF.value) defaultValue = '';

      this.ipAddresses[value] = this.ipAddresses[value] || defaultValue;
    }
  },
  methods: {
    async loadData() {
      const callSystem = (await cms.getModel('PosSetting').findOne())['call']
      callSystem.mode = callSystem.mode || CALL_SYSTEM_MODES.OFF.value
      callSystem.ipAddresses = callSystem.ipAddresses || {};

      this.active = callSystem.active
      this.ipAddresses = callSystem.ipAddresses || {}
      this.apiKey = callSystem.googleMapApiKey
      this.currentCallSystemMode = callSystem.mode
      this.lastSavedConfig = cloneDeep(callSystem)
    },
    async update() {
      const configChanged = this.callSystemConfigChanged;
      const call = {
        active: this.active,
        ipAddresses: this.ipAddresses,
        googleMapApiKey: this.apiKey,
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
    changeApiKey(value) {
      this.apiKey = value
    },
    updateConnectStatus(status) {
      if (status) this.callSystemConnectionStatus = status;
    }
  }
}
</script>

<style scoped lang="scss">
.call {
  width: 65%;
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
}
</style>
