<template>
  <div class="payment">
    <div class="payment-main">
      <pos-payment-screen-payment-methods
          :current-order="currentOrder"
          :payment-total="paymentTotal"
          :is-mobile="isMobile"
          :store-locale="storeLocale"
          @updateCurrentOrder="updateCurrentOrder"
      />
      <pos-payment-screen-keyboard
          :is-mobile="isMobile"
          :current-order="currentOrder"
          :payment-total="paymentTotal"
          @updateCurrentOrder="updateCurrentOrder"
      />
    </div>
    <pos-restaurant-payment-order-detail
        :user="user"
        :total="paymentTotal"
        :current-order="currentOrder"
        :compact-order="compactOrder"
    />
    <pos-restaurant-payment-toolbar
        :current-order="currentOrder"
        :payment-total="paymentTotal"
        :payment-amount-tendered="paymentAmountTendered"
        @pay="saveRestaurantOrder"
        @promotion="setOrderDiscount"
    />
  </div>
  <g-snackbar v-model="snackbar" color="#FFC107" timeout="2000" top>
    <div style="color: #FF4552; display: flex; align-items: center">
      <g-icon color="#FF4552" style="margin-right: 8px">warning</g-icon>
      <span>{{$t('payment.alertDiscount')}}</span>
    </div>
  </g-snackbar>
  <dialog-change-value ref="dialog" @submit="discountCurrentOrder"/>
</template>

<script>
  import PosRestaurantPaymentOrderDetail from "../posRestaurantPayment/PosRestaurantPaymentOrderDetail";
  import PosRestaurantPaymentToolbar from "../posRestaurantPayment/PosRestaurantPaymentToolbar";
  import PosPaymentScreenPaymentMethods from "../Payment/PosPaymentScreenPaymentMethods";
  import PosPaymentScreenKeyboard from "../Payment/PosPaymentScreenKeyboard";
  import DialogChangeValue from "../pos-shared-components/dialogChangeValue";
  export default {
    name: "Payment",
    components: {
      DialogChangeValue,
      PosPaymentScreenKeyboard,
      PosPaymentScreenPaymentMethods,
      PosRestaurantPaymentToolbar,
      PosRestaurantPaymentOrderDetail,
    },
    injectService: [
        'PosStore:(storeLocale, isMobile, user)',
        'OrderStore: (discountCurrentOrder, updateCurrentOrder, currentOrder, paymentTotal, compactOrder, saveRestaurantOrder, paymentAmountTendered, setOrderDiscount)'
    ],
    data() {
      return {
        snackbar: false,
        //inject
        storeLocale: null,
        isMobile: null,
        user: null,
        currentOrder: null,
        paymentTotal: null,
        compactOrder: null,
        paymentAmountTendered: null
      }
    },
    methods: {
      openSnackbar() {
        this.snackbar = true
      },
      openDialog(originalValue, discount) {
        this.$refs.dialog.open(originalValue, discount)
      },
      discountCurrentOrder() {
        console.log('OrderStore:discountCurrentOrder was not injected')
      },
      updateCurrentOrder() {
        console.log('OrderStore:updateCurrentOrder was not injected')
      },
      saveRestaurantOrder() {
        console.log('OrderStore:saveRestaurantOrder was not injected')
      },
      setOrderDiscount() {
        console.log('OrderStore:setOrderDiscount was not injected')
      }
    }
  }
</script>

<style scoped lang="scss">
  .payment {
    height: 100%;
    display: grid;
    grid-template-columns: 70% 30%;
    grid-template-rows: calc(100% - 64px) 64px;

    .g-toolbar {
      grid-column: span 2;
    }

    &-main {
      display: grid;
      grid-template-columns: 100%;
      grid-template-rows: 40% 60%;
    }
  }
</style>
