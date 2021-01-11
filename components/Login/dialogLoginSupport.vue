<template>
  <g-dialog v-model="dialogLoginSupport" width="100%" eager>
    <g-card width="100%">
      <div class="grid" style="height: 100%; width: 100%">
        <p class="version support-item"><b>{{ $t("login.version") }}: </b>{{version}}</p>
        <p class="network support-item"><b>{{ $t("login.network") }}: </b>{{network}}</p>
        <p class="internet support-item"><b>{{ $t("login.internet") }}: </b>{{internet}}</p>
        <p class="ssid support-item"><b>SSID: </b>{{ssID}}</p>
        <p class="ip support-item"><b>IP: </b>{{ip}}</p>

        <div class="input text-field-section">
          <g-text-field clear-icon="cancel" clearable outlined style="color: #1d1d26; width: 85%; margin-right: 10px;" v-model="supportMessage"></g-text-field>
          <g-btn-bs width="15%" background-color="blue" text-color="white">SEND</g-btn-bs>
        </div>

        <div class="keyboard keyboard-wrapper">
          <pos-keyboard-full v-model="supportMessage"/>
        </div>
      </div>

      <g-btn :uppercase="false" @click="dialogLoginSupport = !dialogLoginSupport"
             class="overlay-close-icon" icon
             style="position: absolute; top: 5px; right: 5px;">
        <g-icon>mdi-close</g-icon>
      </g-btn>
    </g-card>

  </g-dialog>
</template>

<script>
  import loginSupportDialog from './loginSupportDialog.json'

  export default {
    name: 'dialogLoginSupport',
    props: {
      modelValue: null
    },
    emits: ['update:modelValue'],
    injectService: ['PosStore:(version)'],
    computed: {
      dialogLoginSupport: {
        get() {
          return this.modelValue;
        },
        set(value) {
          this.$emit('update:modelValue', value);
        }
      }
    },
    data: () => ({
      layout: loginSupportDialog,
      show: Boolean,
      supportMessage: '',
      version: 0.3,
      network: 'Wifi',
      internet: 'Yes',
      ssID: 'Giga5',
      ip: '192.168.10.90',
    })
  }
</script>

<style lang="scss" scoped>
  .grid {
    display: grid;
    grid-template-rows: minmax(auto, 60px) minmax(auto, 60px) 1fr minmax(60px, auto) minmax(140px, auto);
    grid-template-columns: 1fr 1fr 1fr 1fr;

    .keyboard {
      grid-area: 5/1/6/5;
      align-self: flex-end;
    }

    .version {
      grid-area: 1/1/2/2;
    }

    .network {
      grid-area: 1/2/2/3;
    }

    .internet {
      grid-area: 1/3/2/4;
    }

    .ssid {
      grid-area: 1/4/2/5;
    }

    .ip {
      grid-area: 2/1/3/2;
    }

    .input {
      grid-area: 4/1/5/5;
    }
  }

  .support-item {
    margin-top: 24px;
    margin-left: 16px;
    margin-bottom: 12px;
    font-size: 20px;
    line-height: 25px;
  }

  .g-tf-wrapper {
    margin: 0;
  }

  .text-field-section {
    background-color: rgba(196, 196, 196, 0.4);
    width: 100%;
    display: inline-flex;
    padding: 10px;

    .g-tf-wrapper {
      background-color: #ffffff;
      ::v-deep fieldset {
        border: none !important;
      }
    }

  }

  ::v-deep .keyboard-wrapper {
    padding: 16px;
    background-color: #BDBDBD;

    .key {
      border-radius: 0;
      font-size: 24px;
    }
  }

  .dialog-content-wrapper {
    width: 100%;
    height: 100%;
    position: relative;
  }

  @media screen and (max-width: 1023px) {
    .support-item {
      margin-top: 16px;
      margin-left: 12px;
      font-size: 14px;
    }

    ::v-deep .keyboard-wrapper {
      padding: 8px;
      height: 100%;

      .key {
        border-radius: 0;
        font-size: 16px;
      }
    }
  }
</style>
