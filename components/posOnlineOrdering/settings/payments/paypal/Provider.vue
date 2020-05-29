<template>
  <div class="provider">
    <div class="provider__logo">
      <img draggable="false" src="/plugins/pos-plugin/assets/paypal.png"/>
    </div>
    <div class="provider__description">
      <div>Enable customers to pay by their PayPal accounts or credit/debit cards.</div>
      <!--          <img draggable="false" src="/plugins/pos-plugin/assets/wallet.svg"/>-->
    </div>
    <template v-if="providerActivated">
      <div class="provider__balance-info">
        <div class="provider__balance-info__key">PayPal Balance: </div>
        <div class="provider__balance-info__value">
          <div v-if="balances.length === 0">Calculating...</div>
          <ul v-else class="mt-1">
            <li v-for="(balance, i) in balances" :key="i">
              {{ balance.currencyCode | currencySymbol }}{{balance.netAmount}}
            </li>
          </ul>
        </div>
      </div>
      <div class="provider__notice">
        <div>Note:</div>
        <ul>
          <li>Your pending balance is automatically transfered to your bank account on the first day of the following month.</li>
          <li>Addition fee will be added for each transaction.</li>
        </ul>
      </div>
      <div style="font-style: italic; font-size: small;margin-bottom: 10px; color: #616161;">
        <div>(*) Last update: {{lastRefreshedDateTime}}</div>
        <div>(*) It takes a maximum of three hours for executed transactions to be added into net amount.</div>
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
</template>
<script>
  import { currencyCodeToSymbol } from '../../../../Store/currencyHelper';

  export default {
    name: 'PayPalProvider',
    props: {
      store: Object
    },
    filters: {
      currencySymbol(code) {
        return currencyCodeToSymbol(code);
      }
    },
    data: function () {
      return {
        balances: [],
        lastRefreshedDateTime: null,
      }
    },
    computed: {
      providerActivated() {
        return this.store.paymentProviders && this.store.paymentProviders.paypal && this.store.paymentProviders.paypal.enable
      },
    },
    created() {
      const now = dayjs()
      const startDate = now.format('YYYY-MM') + '-01T00:00:00-0000'
      const endDate = now.format('YYYY-MM-DD') + 'T23:59:59-0000'
      axios.get(`/payment/paypal/balance?store_id=${this.store._id}&start_date=${startDate}&end_date=${endDate}`).then(result => {
        this.balances.splice(0, this.balances.length, ...result.data.balances)
        this.lastRefreshedDateTime = dayjs(result.data.lastRefreshedDateTime).format('YYYY-MM-DD HH:mm:ss [GMT]Z')
      })
    },
    methods: {
      deactivePayPalCheckout() {
        this.$emit('deactive')
      },
      activePayPalCheckout() {
        this.$emit('active')
      }
    }
  }
</script>
<style scoped lang="scss">
  .provider {
    width: 49%;
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
      margin-top: 20px;
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
