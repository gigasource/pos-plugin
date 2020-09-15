<template>
  <g-dialog v-model="dialogLoginSupport" width="100%" eager>
    <g-card width="100%">
      <g-grid-layout :layout="layout" style="height: 100%; width: 100%">
        <p area="version" class="support-item"><b>{{ $t("login.version") }}: </b>{{this.version}}</p>
        <p area="network" class="support-item"><b>{{ $t("login.network") }}: </b>{{this.network}}</p>
        <p area="internet" class="support-item"><b>{{ $t("login.internet") }}: </b>{{this.internet}}</p>
        <p area="ssid" class="support-item"><b>SSID: </b>{{this.ssID}}</p>
        <p area="ip" class="support-item"><b>IP: </b>{{this.ip}}</p>

        <div area="keyboard_input" class="text-field-section">
          <g-text-field clear-icon="cancel" clearable outlined style="color: #1d1d26; width: 85%; margin-right: 10px;" v-model="supportMessage"></g-text-field>
          <g-btn-bs width="15%" background-color="blue" text-color="white">SEND</g-btn-bs>
        </div>

        <div area="keyboard" class="keyboard-wrapper">
          <pos-keyboard-full v-model="supportMessage"/>
        </div>
      </g-grid-layout>

      <g-btn :uppercase="false" @click="dialogLoginSupport = !dialogLoginSupport" class="overlay-close-icon" icon style="position: absolute; top: 5px; right: 5px;">
        <g-icon>mdi-close</g-icon>
      </g-btn>
    </g-card>

  </g-dialog>
</template>

<script>
  import loginSupportDialog from './loginSupportDialog'

  export default {
    name: 'dialogLoginSupport',
    props: {
      value: null
    },
    computed: {
      dialogLoginSupport: {
        get() {
          return this.value;
        },
        set(value) {
          this.$emit('input', value);
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
