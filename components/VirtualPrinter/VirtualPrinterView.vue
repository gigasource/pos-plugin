<template>
  <div class="virtualPrinter">
    <!-- header -->
    <div class="virtualPrinter__header">
      <g-btn @click="selectMode('all')" class="virtualPrinter__header__btn">All</g-btn>
      <g-btn @click="selectMode('bon')" class="virtualPrinter__header__btn">Bon</g-btn>
      <g-btn @click="selectMode('receipt')" class="virtualPrinter__header__btn">Receipt</g-btn>
      <g-select textComponentBase="GBtn" :items="zoom.availables" v-model="zoom.current"/>
      <div class="virtualPrinter__header__swipe-zone">
        >>> Swipe right to dismiss >>>
      </div>
    </div>
    
    <div class="virtualPrinter__preview">
      <div :style="previewStyle">
        <img v-for="imgSrc in imgSrcs" :src="imgSrc" :style="imgStyle"/>
      </div>
    </div>
  </div>
</template>

<script>
  export default {
    name: 'VirtualPrinterView',
    props: {},
    data: function () {
      return {
        receipts: [],
        bons: [],
        mode: 'all',
        zoom: {
          current: 75,
          availables: [
            { text: '75%',  value:  75 },
            { text: '100%', value: 100 },
            { text: '125%', value: 125 },
            { text: '150%', value: 150 }
          ],
        }
      }
    },
    computed: {
      imgSrcs() {
        switch (this.mode) {
          case 'all':
            return [];
          case 'bon':
            return [];
          case 'receipt':
            return [];
          default:
            return [];
        }
      },
      receiptWidth() {
        return this.zoom.current * 4 + 'px';
      },
      imgStyle() {
        return {
          maxWidth: this.receiptWidth,
        }
      },
      previewStyle() {
        return {
          maxWidth: this.receiptWidth,
          display: 'flex',
          flexDirection: 'column'
        }
      }
    },
    methods: {
      dismiss() {
      
      }
    }
  }
</script>

<style scoped lang="scss">
  .virtualPrinter {
    width: 100%;
    height: 100%;
    background-image: url('/plugins/pos-plugin/assets/out.png');
    
    &__header {
      display: flex;
      flex-direction: row;
      align-items: center;
      background-color: rgba(0, 0, 0, 0.3);
      padding: 10px;
      
      &__btn {
        margin-right: 5px;
      }
      
      &__swipe-zone {
        flex: 1;
        text-align: right;
      }
    }
    
    &__preview {
    
    }
  }
</style>
