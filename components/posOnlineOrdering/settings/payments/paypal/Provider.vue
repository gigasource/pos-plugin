<template>
  <section class="provider">
    <header class="provider__logo">
      <img draggable="false" src="/plugins/pos-plugin/assets/paypal.png"/>
    </header>
    
    <section class="provider__description">
      <p>{{$t('paymentProviders.paypal.desc')}}</p>
    </section>
    
    <template v-if="providerActivated()">
      <section class="provider__balance-info">
        <p style="font-weight: bold;font-size: 18px;">{{$t('paymentProviders.paypal.balance')}}</p>
        <div class="provider__balance-info__value">
          <div v-if="balances.length === 0">{{$t('paymentProviders.paypal.calculating')}}</div>
          <ul v-else class="mt-1">
            <li v-for="(balance, i) in balances" :key="i">
              {{ balance.currencyCode | currencySymbol }}{{ balance.netAmount }}
            </li>
          </ul>
        </div>
      </section>
      
      <section class="provider__notice">
        <p>{{$t('paymentProviders.paypal.note')}}</p>
        <ul>
          <li>{{$t('paymentProviders.paypal.noteContent1')}}</li>
          <li>{{$t('paymentProviders.paypal.noteContent2')}}</li>
        </ul>
      </section>
      
      <section class="i mb-2" style="font-size: small; color: #616161;">
        <div>(*) {{$t('paymentProviders.paypal.lastUpdate')}}{{lastRefreshedDateTime}}</div>
        <div>(*) {{$t('paymentProviders.paypal.transactionHistoryNotice')}}</div>
      </section>
      
      <footer class="row-flex justify-end">
        <g-btn-bs background-color="#536DFE" text-color="#FFF" @click="deactivePayPalCheckout" style="margin-right: 0">Deactive Paypal Checkout</g-btn-bs>
      </footer>
    </template>
    
    <template v-else>
      <section>
        <g-text-field-bs v-model="clientId" prefix="Client ID"/>
        <g-text-field-bs v-model="secretToken" prefix="Secret Token"/>
      </section>
      <footer class="row-flex justify-end">
        <g-btn-bs background-color="#536DFE" text-color="#FFF" @click="activePayPalCheckout" style="margin-right: 0">Activate PayPal Checkout</g-btn-bs>
      </footer>
    </template>
  </section>
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
        // register
        clientId: '',
        secretToken: '',
        
        // registered
        balances: [],
        lastRefreshedDateTime: null,
      }
    },
    computed: {
    },
    created() {
      // TODO: Only get balance if
      if (this.providerActivated()) {
        const now = dayjs()
        const startDate = now.format('YYYY-MM') + '-01T00:00:00-0000'
        const endDate = now.format('YYYY-MM-DD') + 'T23:59:59-0000'
        axios.get(`/payment/paypal/balance?store_id=${this.store._id}&start_date=${startDate}&end_date=${endDate}`).then(result => {
          this.balances.splice(0, this.balances.length, ...result.data.balances)
          this.lastRefreshedDateTime = dayjs(result.data.lastRefreshedDateTime).format('YYYY-MM-DD HH:mm:ss [GMT]Z')
        })
      }
    },
    methods: {
      providerActivated() {
        return this.store.paymentProviders && this.store.paymentProviders.paypal && this.store.paymentProviders.paypal.enable
      },
      deactivePayPalCheckout() {
        this.$emit('deactive')
      },
      activePayPalCheckout() {
        this.$emit('active', { clientId: this.clientId, secretToken: this.secretToken })
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
      height: 53px;
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
  
  ::v-deep {
    .bs-tf-input-prepend > *:first-child {
      width: 100px;
    }
  }
</style>
