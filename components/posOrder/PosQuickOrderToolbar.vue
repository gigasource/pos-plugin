<template>
  <g-toolbar height="100%" elevation="0" color="#eee">
    <g-btn-bs icon="icon-back" @click="back">{{$t('ui.back')}}</g-btn-bs>
    <template v-if="type === 'default'">
      <g-menu top nudge-top="5" v-model="showMenu">
        <template v-slot:activator="{toggleContent}">
          <g-btn-bs icon="icon-menu" @click="toggleContent">{{$t('ui.more')}}</g-btn-bs>
        </template>
        <div class="col-flex bg-white">
          <g-btn-bs icon="icon-dinner_copy">{{$t('ui.moreItems')}}</g-btn-bs>
          <g-btn-bs icon="icon-promotion">
            {{$t('fnBtn.paymentFunctions.discount')}}
          </g-btn-bs>
        </div>
      </g-menu>
      <g-btn-bs icon="icon-cashier">{{$t('fnBtn.paymentFunctions.cashDrawer')}}</g-btn-bs>
      <g-spacer/>
      <g-btn-bs class="col-2" background-color="#4CAF50" :disabled="!enablePayBtn"
                @click.stop="quickCash(false)">
        {{$t('restaurant.cashAndDineIn')}}
      </g-btn-bs>
      <g-btn-bs class="col-2" background-color="#4CAF50" :disabled="!enablePayBtn"
                @click.stop="quickCash(true)">
        {{$t('restaurant.cashAndTakeAway')}}
      </g-btn-bs>
      <g-btn-bs class="col-2" icon="icon-pay" :disabled="!enablePayBtn" @click="pay">
        {{$t('fnBtn.paymentFunctions.pay')}}
      </g-btn-bs>
    </template>
    <template v-if="type === 'delivery'">
      <g-spacer/>
      <g-btn-bs background-color="#1271FF" @click="">
        <div class="mr-2">Next</div>
        <g-icon size="16" color="white" class="ml-1">fas fa-chevron-right</g-icon>
      </g-btn-bs>

      <dialog-order v-model="dialog.createOrder" :customer="selectedCustomer" :type="orderType"/>
    </template>
  </g-toolbar>
</template>

<script>
  export default {
    name: "PosQuickOrderToolbar",
    props: {
      currentOrder: null
    },
    injectService:[
      'OrderStore:( selectedCustomer, orderType )'
    ],
    data() {
      return {
        showMenu: false,
        type: ''
      }
    },
    computed: {
      enablePayBtn() {
        if (this.currentOrder && this.currentOrder.items) return this.currentOrder.items.length > 0
      }
    },
    methods: {
      back() {
        this.$emit('resetOrderData')
        this.$router.push({path: '/pos-dashboard'})
      },
      pay() {
        this.$router.push({path: '/pos-payment'})
      },
      quickCash(isTakeout = false) {
        this.currentOrder.takeOut = isTakeout
        this.$emit('quickCash')
      }
    },
    activated() {
      this.type = 'default'
      if (this.$router.currentRoute.query && this.$router.currentRoute.query.type) {
        this.type = this.$router.currentRoute.query.type
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
