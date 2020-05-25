<template>
  <div>
    <div v-for="tran in transactionInfo" :key="tran.transactionId" style="display: flex; justify-content: space-between">
      <div>{{tran.date}}</div>
      <div>{{tran.name}}</div>
      <div>{{tran.grossAmount}}</div>
      <div>{{tran.netAmount}}</div>
      <div>{{tran.type}}</div>
      <div>{{tran.paidBy}}</div>
    </div>
  </div>
</template>
<script>
  export default {
    name: 'PaymentProvidersTransaction',
    props: {
      transactionInfo: Array
    },
    data: function () {
      return {}
    },
    computed: {},
    methods: {}
  }
</script>
<style scoped>
</style>
