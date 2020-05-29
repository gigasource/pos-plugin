<template>
  <div class="provider-transaction">
    <!-- Action bar -->
    <div class="row-flex align-items-center mb-4">
      <div class="provider-transaction__title">Transaction History</div>
      <g-spacer/>
      <date-range-picker :from="startDate" :to="endDate" @save="changeDate"/>
    </div>
  
    <!-- Transactions -->
    <paypal-transactions :store="store" :start-date="startDate" :end-date="endDate"/>
    <adyen-transactions :store="store" :start-date="startDate" :end-date="endDate"/>
  </div>
</template>
<script>
  import DateRangePicker from '../dateRangePicker';
  import PaypalTransactions from './paypal/Transactions';
  import AdyenTransactions from './adyen/Transactions';

  export default {
    name: 'PaymentProvidersTransaction',
    components: { AdyenTransactions, PaypalTransactions, DateRangePicker },
    props: {
      store: Object,
    },
    data: function () {
      const startDate = dayjs().format('YYYY-MM') + '-01T00:00:00'
      const endDate = dayjs().format('YYYY-MM-DD') + 'T23:59:59'
      
      return {
        startDate: startDate,
        endDate: endDate,
      }
    },
    methods: {
      changeDate(val) {
        const dateFormatPattern = 'YYYY-MM-DDTHH:mm:ss'
        const fromDateDayJs = dayjs(val.fromDate)
        const toDateDayJs = dayjs(val.toDate)
        this.startDate = fromDateDayJs.format(dateFormatPattern)
        const dayDiffs = toDateDayJs.diff(fromDateDayJs, 'day')
        if (dayDiffs > 31) {
          alert('The maximum supported date range is 31 days.')
          this.endDate = fromDateDayJs.add(30, 'day').format(dateFormatPattern)
        } else {
          this.endDate = toDateDayJs.format(dateFormatPattern)
        }
      },
    }
  }
</script>
<style scoped lang="scss">

</style>
