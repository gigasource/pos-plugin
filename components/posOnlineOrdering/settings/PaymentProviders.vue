<template>
  <div class="payment-provider-view">
    <div class="payment-provider-view__title">Payment Setting</div>
    <div class="payment-provider-list">
      <!-- PayPal -->
      <div class="provider">
        <div class="provider__logo">
          <img draggable="false" src="/plugins/pos-plugin/assets/paypal.png"/>
        </div>
        <div class="provider__description">
          <div>Enable customers to pay by their PayPal accounts or credit/debit cards.</div>
          <img draggable="false" src="/plugins/pos-plugin/assets/wallet.svg"/>
        </div>
        <template v-if="PayPalActive">
          <div class="provider__balance-info">
            <div class="provider__balance-info__kv">
              <span class="provider__balance-info__key">Net amount: </span>
              <span class="provider__balance-info__value">{{netAmount === -1 ? 'Calculating...' : `\$${netAmount}` }}</span>
            </div>
          </div>
          <div class="provider__notice">
            <div>Note:</div>
            <ul>
              <li>Your pending balance is automatically transfered to your bank account on the first day of the following month.</li>
              <li>Addition fee will be added for each transaction.</li>
            </ul>
          </div>
          <div style="display: flex; justify-content: flex-end">
            <g-btn-bs background-color="#536DFE" text-color="#FFF" @click="deactivePayPalCheckout" style="margin-right: 0">Deactive Paypal Checkout</g-btn-bs>
          </div>
        </template>
        <template v-else>
          <div style="display: flex; justify-content: flex-end">
            <g-btn-bs background-color="#536DFE" text-color="#FFF" @click="activePayPalCheckout" style="margin-right: 0">Activate PayPal Checkout</g-btn-bs>
          </div>
        </template>
      </div>
    </div>
  </div>
</template>
<script>
  export default {
    name: 'PaymentProviders',
    props: {
      store: Object,
    },
    data: function () {
      return {
        netAmount: -1,
      }
    },
    computed: {
      PayPalActive() {
        return this.store.paymentProviders && this.store.paymentProviders.paypal && this.store.paymentProviders.paypal.enable
      },
    },
    created() {
      const now = dayjs()
      const startDate = now.format('YYYY-MM') + '-01T00:00:00-0700'
      const endDate = now.format('YYYY-MM-DD') + 'T23:59:59-0700'
      axios.get(`/payment/paypal/net-amount?store_id=${this.store._id}&start_date=${startDate}&end_date=${endDate}`).then(result => {
        this.netAmount = result.data.netAmount
      })
    },
    methods: {
      deactivePayPalCheckout() {
        this.$emit('deactivePayPalProvider')
      },
      activePayPalCheckout() {
        this.$emit('activePayPalProvider')
      }
    }
  }
</script>
<style scoped lang="scss">
  .payment-provider-view {
    &__title {
      font-family: Muli;
      font-style: normal;
      font-weight: bold;
      font-size: 18px;
      line-height: 23px;
      margin-bottom: 15px;
    }
  }
  
  .payment-provider-list {
    display: flex;
    flex-direction: row;
    flex-wrap: wrap;
    justify-content: space-between;
  }
  
  .provider {
    width: 50%;
    background: #FFF;
    border-radius: 4px;
    padding: 30px;
    
    &__logo {
    
    }
    
    &__description {
      color: #757575;
      font-size: 16px;
      display: flex;
      justify-content: space-between;
      margin-top: 10px;
      margin-bottom: 10px;
    }
    
    &__balance-info {
      
      &__kv {
        /*display: flex;*/
        /*justify-content: space-between;*/
      }
      
      &__key {
        font-weight: bold;
        font-size: 18px;
      }
      
      &__value {
        color: #536DFE;
        font-family: Muli;
        font-style: normal;
        font-weight: 600;
        font-size: 18px;
      }
    }
    
    &__notice {
      color: #616161;
      &>ul {
        margin-block-start: 0 !important;
        font-style: italic;
        &>li {
          font-size: 14px;
        }
      }
    }
  }
</style>
