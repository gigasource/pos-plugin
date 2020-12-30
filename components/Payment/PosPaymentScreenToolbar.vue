<template>
  <g-toolbar color="#eee" elevation="0" fill-height>
    <g-btn :uppercase="false" background-color="white" class="mr-3" @click.stop="back">
      <g-icon class="mr-2" svg>icon-back</g-icon>
      <span style="color: rgba(0, 0, 0, 0.87)">{{$t('ui.back')}}</span>
    </g-btn>
    <g-btn :uppercase="false" background-color="white" class="mr-3">
      <g-icon class="mr-2" svg>icon-menu</g-icon>
      {{$t('ui.more')}}
    </g-btn>
  </g-toolbar>
</template>

<script>
  import _ from 'lodash'

  export default {
    name: 'PosPaymentScreenToolbar',
    injectService: [
      'OrderStore:currentOrder'
    ],
    methods: {
      back() {
        if(this.currentOrder.isDiscountInTotal) {
          this.currentOrder.items = this.currentOrder.items.map(item => ({
            ..._.omit(item, ['discount', 'discountUnit', 'vDiscount']),
            price: item.originalPrice,
          }))

          this.currentOrder.isDiscountInTotal = false
        }
        this.$router.push({path: '/pos-order'})
      }
    }
  }
</script>

<style scoped lang="scss">
  .toolbar {
    grid-area: toolbar;
    width: 100%;

    ::v-deep .g-badge-wrapper .g-btn {
      margin-right: 0;
    }

    ::v-deep .g-toolbar-content > .g-btn:first-child {
      margin-left: 0;
    }

    ::v-deep .g-toolbar-background > div {
      box-shadow: inset -8px 0 8px -8px rgba(0, 0, 0, 0.25);
    }
  }
</style>
