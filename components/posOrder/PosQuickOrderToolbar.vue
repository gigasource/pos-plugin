<template>
  <g-toolbar elevation="0" color="#eee">
    <g-btn-bs icon="icon-back" @click="back">{{$t('ui.back')}}</g-btn-bs>
    <g-menu top nudge-top="5" v-model="showMenu">
      <template v-slot:activator="{toggleContent}">
        <g-btn-bs icon="icon-menu" @click="toggleContent">{{$t('ui.more')}}</g-btn-bs>
      </template>
      <div class="col-flex bg-white">
        <g-btn-bs icon="icon-move-items" @click.stop="moveItems" :disabled="disableMoveItemsBtn">{{$t('order.moveItem')}}</g-btn-bs>
        <g-btn-bs icon="icon-voucher" @click="showVoucherDialog">{{$t('order.voucher')}}</g-btn-bs>
      </div>
    </g-menu>
<!--    <g-btn-bs icon="icon-cashier">{{$t('fnBtn.paymentFunctions.cashDrawer')}}</g-btn-bs>-->
    <g-btn-bs icon="icon-delivery" :background-color="currentOrder.takeAway ? '#2979FF' : '#fff'"
              :disabled="disableTakeAway"
              @click="toggleTakeAwayOrder">Take Away</g-btn-bs>
    <g-spacer/>
    <g-btn-bs v-if="currentOrder.table" background-color="#1271ff" text-color="#fff"
              :disabled="disablePrintBtn" icon="icon-print"
              @click.stop="print">
      {{$t('ui.print')}}
    </g-btn-bs>
    <template v-if="currentOrder.table">
      <g-btn-bs :disabled="!enablePayBtn" icon="icon-split_check_2"
                @click.stop="splitOrder">
        {{$t('order.splitOrder')}}
      </g-btn-bs>
    </template>
    <template v-else>
      <g-btn-bs class="col-2" background-color="#4CAF50" :disabled="!enablePayBtn"
                @click.stop="quickCash(false)">
        {{$t('restaurant.cashAndDineIn')}}
      </g-btn-bs>
      <g-btn-bs class="col-2" background-color="#4CAF50" :disabled="!enablePayBtn"
                @click.stop="quickCash(true)">
        {{$t('restaurant.cashAndTakeAway')}}
      </g-btn-bs>
    </template>
    <g-btn-bs class="col-2" icon="icon-pay" :disabled="disablePay" @click="pay">
      {{$t('fnBtn.paymentFunctions.pay')}}
    </g-btn-bs>
  </g-toolbar>
</template>

<script>
  export default {
    name: "PosQuickOrderToolbar",
    props: {
      currentOrder: null,
      actionList: Array,
    },
    data() {
      return {
        showMenu: false,
        onlyCheckoutPrintedItems: true,
      }
    },
    computed: {
      enablePayBtn() {
        if (this.currentOrder && this.currentOrder.items) return this.currentOrder.items.length > 0
      },
      disablePrintBtn() {
        return this.actionList.length === 0
      },
      disableMoveItemsBtn() {
        return !this.currentOrder.items.length
      },
      disablePay() {
        if (this.currentOrder && this.currentOrder.items) {
          if (!this.currentOrder.table) return false
          if (!this.currentOrder.items.some(i => i.quantity)) return true
          if (this.onlyCheckoutPrintedItems) {
            return this.currentOrder.items.some(i => !i.printed && i.quantity)
          }
        }
      },
      disableTakeAway() {
        if (this.currentOrder && this.currentOrder.items) {
          return !this.currentOrder.items.some(i => i.quantity)
        }
      }
    },
    methods: {
      back() {
        this.$emit('updateOrderTable', null)
        this.$emit('resetOrderData')
        this.$emit('updateOrderTable', null)
        this.$router.push({path: '/pos-dashboard'})
      },
      pay() {
        this.$router.push({path: '/pos-payment'})
      },
      quickCash(isTakeout = false) {
        this.currentOrder.takeOut = isTakeout
        this.$emit('quickCash')
      },
      splitOrder() {
        this.$emit('openDialog', 'split')
      },
      print() {
        this.$emit('saveTableOrder')
      },
      moveItems() {
        this.$emit('openDialog', 'move')
      },
      showVoucherDialog() {
        this.$emit('openDialog', 'voucher')
      },
      toggleTakeAwayOrder() {
        this.$emit('updateCurrentOrder', 'takeAway', !this.currentOrder.takeAway, true)
      }
    },
    async activated() {
      const posSettings = await cms.getModel('PosSetting').findOne()

      if (posSettings && posSettings.generalSetting) {
        this.onlyCheckoutPrintedItems = posSettings.generalSetting.onlyCheckoutPrintedItems
      }
    }
  }
</script>

<style scoped lang="scss">
  .g-btn-bs {
    background-color: white;
    font-size: 14px;
  }
</style>
