<template>
  <div class="generator">
    <div class="generator-input col-6">
      <g-text-field-bs label="Enter your restaurant ID" v-model="storeId"/>
      <g-btn-bs min-width="90" :class="['generator-btn--create',!storeId && 'disabled']" @click="createQRcode">Create</g-btn-bs>
    </div>
    <div class="generator-canvas">
      <div id="qrcode" class="generator-canvas--detail">
        <canvas id="canvas" width="360px" height="360px"></canvas>
      </div>
      <g-btn-bs :class="['generator-btn--download']" @click="downloadQRCode">DOWNLOAD QR CODE</g-btn-bs>
    </div>
    <g-overlay v-model="loading">
      <g-progress-circular indeterminate size="32" width="4" color="white" value="90"/>
    </g-overlay>
  </div>
</template>

<script>
  import domtoimage from 'dom-to-image'
  import QRCode from 'qrcode'

  export default {
    name: "QRCodeGenerator",
    data() {
      return {
        storeId: '',
        loading: false,
        url: null
      }
    },
    mounted() {
      this.$nextTick(() => {
        const el = document.getElementById('canvas')
        if(el) {
          QRCode.toCanvas(el, 'https://enjoylocal.de/qrcode')
        }
      })
    },
    methods: {
      async createQRcode() {
        const store = await cms.getModel('Store').findOne({id: this.storeId})
        const url = ['https://enjoylocal.de', 'menu', store.alias].join('/')
        const el = document.getElementById('canvas')
        if(el) {
          await QRCode.toCanvas(el, url)
        }
      },
      async downloadQRCode() {
        const el = document.getElementById('qrcode')
        if(el) {
          this.loading = true
          const url = await domtoimage.toJpeg(el)
          const link = document.createElement('a');
          link.download = 'QRCode.jpeg';
          link.href = url;
          this.loading = false
          link.click();
        }
      }
    }
  }
</script>

<style scoped lang="scss">
  .generator {
    display: flex;
    align-items: center;
    padding: 45px;

    &-input {
      display: flex;
      padding: 24px;
    }

    &-canvas {
      display: flex;
      flex-direction: column;
      align-items: center;
      padding: 56px 44px;
      background-color: #E1F5FE;
      border-radius: 8px;

      &--detail {
        background: #FFA800;
        border-radius: 8px;
        padding: 36px 69px;
      }
    }

    &-btn {
      &--create {
        align-self: flex-end;
        background-color: #C4C4C4;
        padding: 6px;
        margin-bottom: 8px;
      }

      &--download {
        text-decoration: none;
        color: black;
        padding: 8px;
        background-color: #2979ff;
        width: 100%;
        margin-top: 16px;
        border-radius: 4px;
        text-align: center;
      }
    }
  }
</style>
