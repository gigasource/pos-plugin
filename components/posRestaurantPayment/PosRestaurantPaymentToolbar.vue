<template>
  <g-toolbar color="#eee" height="100%" elevation="0">
    <g-btn-bs icon="icon-back" @click.stop="back">{{$t('ui.back')}}</g-btn-bs>
    <g-btn-bs icon="icon-menu">{{$t('ui.more')}}</g-btn-bs>
    <g-btn-bs icon="icon-promotion" @click.stop="promotion">{{$t('fnBtn.paymentFunctions.promotion')}}</g-btn-bs>
    <g-btn-bs icon="icon-cashier">{{$t('fnBtn.paymentFunctions.cashDrawer')}}</g-btn-bs>
    <g-btn-bs icon="icon-split_check_2">{{$t('fnBtn.paymentFunctions.splitCheck')}}</g-btn-bs>
    <g-btn-bs icon="icon-red_bill">{{$t('fnBtn.paymentFunctions.redBill')}}</g-btn-bs>
    <g-btn-bs icon="icon-print2">{{$t('fnBtn.paymentFunctions.bill')}}</g-btn-bs>
    <g-spacer/>
    <g-btn-bs class="col-2" background-color="#2979FF" @click.stop="pay" :disabled="!currentOrder.customerPaidEnough">
      {{$t('fnBtn.paymentFunctions.pay')}}
    </g-btn-bs>
  </g-toolbar>
</template>

<script>
  export default {
    name: "PosRestaurantPaymentToolbar",
    props: {
      currentOrder: null,
      paymentAmountTendered: String,
      paymentTotal: Number
    },
    computed: {
      isPayBtnDisabled() {
        return +this.paymentAmountTendered < this.paymentTotal
      }
    },
    methods: {
      back() {
        this.$router.go(-1)
      },
      pay() {
        const backToDashboard = !!this.currentOrder.table
        this.$emit('pay')
        if (backToDashboard) this.$router.push({path: '/pos-dashboard'})
        else this.$router.go(-1)
      },
      promotion() {
        this.$emit('promotion')
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
