<template>
  <section class="balance">
    <header></header>
    <!-- balance info -->
    <section class="balance__info">
      <div style="font-weight: bold; font-size: 18px;">Balance:</div>
      <ul>
        <li class="balance__info__value">{{ balance === '-1' ? 'Calculating...' : balance }}</li>
      </ul>
    </section>
    
    <section class="balance__notice">
      <p>Note</p>
      <ul>
        <li>Your pending balance is automatically transfered to your bank account everyday.</li>
        <li>Addition fee will be added for each transaction.</li>
      </ul>
    </section>
    
    <footer style="display: flex; justify-content: flex-end">
      <g-btn-bs background-color="#eee" text-color="#444" @click="$emit('deactive')" class="mr-2">Edit Info</g-btn-bs>
      <g-btn-bs background-color="#536DFE" text-color="#FFF"  @click="$emit('deactive')" style="margin-right: 0">Deactive Adyen</g-btn-bs>
    </footer>
  </section>
</template>
<script>
  // TODO: Show update account information
  export default {
    name: 'Balance',
    props: {},
    data: function () {
      return {
        showAdyenAccount: false,
        balance: -1,
      }
    },
    async created() {
      const balanceInfo = (await (axios.post('payment/adyen/accountHolderBalance', { accountHolderCode: store.paymentProviders.adyen.accountHolder.accountHolderCode }))).data
      this.balance = balanceInfo.balance
    },
    computed: {},
    methods: {}
  }
</script>
<style scoped lang="scss">
  .balance {
    &__description {
      color: #757575;
      font-size: 16px;
      display: flex;
      justify-content: space-between;
      margin-top: 10px;
      margin-bottom: 10px;
    }
  
    &__info {
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
