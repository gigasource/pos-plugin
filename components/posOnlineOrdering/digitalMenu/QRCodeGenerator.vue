<template>
  <div class="generator-wrapper">
    <div class="generator">
      <div class="col-6 mr-4">
        <div class="generator-input">
          <g-text-field-bs label="Enter your restaurant ID" v-model="storeId"/>
          <g-btn-bs min-width="90" :class="['generator-btn--create',!storeId && 'disabled']" @click="createQRcode">Create</g-btn-bs>
        </div>
        <p class="ml-1">Select background</p>
        <g-grid-select class="ml-1" :items="[1, 2, 3, 4]" v-model="type" mandatory :grid="false">
          <template #default="{item, toggleSelect}">
            <g-btn-bs style="margin: 16px 16px 0 0;" border-color="#E0E0E0" text-color="black" height="30" min-width="72" @click.stop="toggleSelect(item)">{{item}}</g-btn-bs>
          </template>
          <template #selected="{item}">
            <g-btn-bs style="margin: 16px 16px 0 0;" border-color="#90CAF9" background-color="#E3F2FD" text-color="black" height="30" width="72">{{item}}</g-btn-bs>
          </template>
        </g-grid-select>
      </div>
      <div class="generator-canvas">
        <div id="qrcode" class="generator-canvas--detail" :style="background">
          <canvas id="canvas" :style="margin"></canvas>
        </div>
        <g-btn-bs :class="['generator-btn--download']" @click="downloadQRCode">DOWNLOAD QR CODE</g-btn-bs>
      </div>
      <g-overlay v-model="loading">
        <g-progress-circular indeterminate size="32" width="4" color="white" value="90"/>
      </g-overlay>
    </div>
    <div id="print" class="generator-print">
      <div class="generator-print--content" :style="{...background, marginRight: '300px'}">
        <canvas id="canvas1" :style="{marginTop: [2,3].includes(type) ? '226px' : 0}"></canvas>
      </div>
      <div class="generator-print--content" :style="background">
        <canvas id="canvas2" :style="{marginTop: [2,3].includes(type) ? '226px' : 0}"></canvas>
      </div>
    </div>
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
        url: null,
        type: 1,
      }
    },
    mounted() {
      this.$nextTick(() => {
        const el = document.getElementById('canvas')
        if(el) {
          QRCode.toCanvas(el, 'https://m.restaurantplus.net/qrcode', {width: 280, margin: 2})
        }
      })
    },
    computed: {
      background() {
        return {
          'background-image': `url("/plugins/pos-plugin/assets/images/QA-code_table${this.type}.png")`
        }
      },
      margin() {
        return {
          'margin-top': [2,3].includes(this.type) ? '32px' : 0
        }
      }
    },
    methods: {
      async createQRcode() {
        this.loading = true
        const store = await cms.getModel('Store').findOne({id: this.storeId})
        const url = ['https://m.restaurantplus.net', 'menu', store.alias].join('/')
        const el = document.getElementById('canvas')
        const el1 = document.getElementById('canvas1')
        const el2 = document.getElementById('canvas2')
        if(el) {
          await QRCode.toCanvas(el, url, {width: 280, margin: 2})
        }
        if(el1) {
          await QRCode.toCanvas(el1, url, {width: 1977, margin: 2})
        }
        if(el2) {
          await QRCode.toCanvas(el2, url, {width: 1977, margin: 2})
        }
        this.loading = false
      },
      async downloadQRCode() {
        const el = document.getElementById('print')
        if(el) {
          this.loading = true
          const url = await domtoimage.toPng(el, {width: 4200, height: 6230})
          const link = document.createElement('a');
          link.download = 'QRCode.png';
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
    padding: 45px;
    position: absolute;
    z-index: 2;
    top: 0;
    left: 0;
    bottom: 0;
    right: 0;
    background: white;

    &-wrapper {
      position: relative;
      width: 100%;
      height: 100vh;
      overflow: hidden;
    }

    &-input {
      display: flex;
      margin-bottom: 24px;
    }

    &-canvas {
      display: flex;
      flex-direction: column;
      align-items: center;
      padding: 56px 44px;
      background-color: #E1F5FE;
      border-radius: 8px;
      align-self: flex-start;

      &--detail {
        border-radius: 8px;
        padding: 180px 70px 0;
        width: 420px;
        height: 595px;
        background-size: cover;
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

    &-print {
      display: flex;
      transform: rotate(90deg) translateY(-100%);
      transform-origin:top left;
      height: 4200px;
      background: white;
      position: absolute;
      z-index: 1;
      top: 0;
      left: 0;

      &--content {
        padding: 1270px 494px 0;
        width: 2965px;
        height: 4200px;
        background-size: cover;
      }
    }
  }
</style>
