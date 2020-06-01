<template>
  <div>
    <!-- balance info -->
    <div>Balance:</div>
    <ul>
      <li>{{ balance === '-1' ? 'Calculating...' : balance }}</li>
    </ul>
    
    <!-- action buttons -->
    <div style="display: flex; justify-content: flex-end">
      <g-btn-bs v-if="isActivated" background-color="#536DFE" text-color="#FFF" @click="$emit('deactive')" style="margin-right: 0">Deactive Adyen</g-btn-bs>
    </div>
  </div>
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
<style scoped>
</style>
