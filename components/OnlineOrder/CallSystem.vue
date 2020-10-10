<template>
  <div class="call">
    <p class="call-title">Call System</p>
    <g-switch label="Active" v-model="active"/>
    <g-switch :label="demoModeLabel"
              v-model="demoMode"/>
    <p class="call-title">Call System IP</p>
    <g-text-field-bs v-model="ip">
      <template v-slot:append-inner>
        <g-icon @click="dialog.ip = true">icon-keyboard</g-icon>
      </template>
    </g-text-field-bs>
    <p class="call-title">Google Map API Key</p>
    <g-text-field-bs v-model="apiKey">
      <template v-slot:append-inner>
        <g-icon @click="dialog.api = true">icon-keyboard</g-icon>
      </template>
    </g-text-field-bs>
    <g-btn-bs width="80" background-color="#2979FF" style="margin: 16px 0 0; flex: 0 0 36px; align-self: flex-end" @click="update">Update</g-btn-bs>
    <dialog-text-filter v-model="dialog.ip" label="Call System IP" :default-value="ip" @submit="changeIp"/>
    <dialog-text-filter v-model="dialog.api" label="Google Map API Key" :default-value="apiKey" @submit="changeApiKey"/>
  </div>
</template>

<script>
  export default {
    name: "CallSystem",
    data() {
      return {
        active: false,
        demoMode: false,
        demoModeStatus: '',
        ip: '',
        apiKey: '',
        dialog: {
          ip: false,
          api: false,
        },
        lastSavedConfig: null,
      }
    },
    async created() {
      await this.loadData()
      cms.socket.on('update-fritzbox-demo-status', (status) => this.demoModeStatus = status);
      cms.socket.emit('get-fritzbox-demo-status', (status) => this.demoModeStatus = status);
    },
    async activated() {
      await this.loadData()
    },
    computed: {
      demoModeLabel() {
        if (!this.demoMode) {
          return 'Demo mode'
        } else {
          if (this.lastSavedConfig && !this.lastSavedConfig.demoMode && this.demoMode) {
            return "Demo mode (press 'Update' to connect)"
          } else {
            return `Demo mode${this.demoModeStatus ? ` (${this.demoModeStatus})` : ''}`
          }
        }
      },
    },
    methods: {
      async loadData() {
        const callSystem = (await cms.getModel('PosSetting').findOne())['call']
        this.active = callSystem.active
        this.ip = callSystem.ip
        this.apiKey = callSystem.googleMapApiKey
        this.demoMode = callSystem.demoMode
        this.lastSavedConfig = callSystem
      },
      async update() {
        const call = {
          active: this.active,
          ip: this.ip,
          googleMapApiKey: this.apiKey,
          demoMode: this.demoMode,
        }
        await cms.getModel('PosSetting').findOneAndUpdate({}, { call })
        await this.loadData()
        cms.socket.emit('refresh-fritzbox-config')
      },
      changeIp(value) {
        this.ip = value
      },
      changeApiKey(value) {
        this.apiKey = value
      },
    }
  }
</script>

<style scoped lang="scss">
  .call {
    width: 65%;
    display: flex;
    flex-direction: column;
    background-color: white;
    padding: 24px;
    height: 100%;
    overflow: auto;

    &-title {
      font-size: 14px;
      font-weight: bold;
      margin-top: 12px;
    }

    .bs-tf-wrapper {
      margin: 8px 0 0;
      width: 100%;

      ::v-deep .input {
        flex: 1;
        padding-right: 12px;
      }
    }
  }
</style>
