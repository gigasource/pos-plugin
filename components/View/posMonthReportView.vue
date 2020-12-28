<template>
  <div class="pos-month-report">
    <g-toolbar class="pos-month-report__toolbar">
      <g-btn background-color="white" text-color="#1d1d26" @click="goBack">
        <g-icon>icon-back</g-icon>
        <span class="ml-2">Back</span>
      </g-btn>
      <g-spacer/>
      <g-btn background-color="#1271FF" text-color="#FFFFFF" @click="printReport"></g-btn>
    </g-toolbar>
    <pos-month-report-setting class="pos-month-report__setting"/>
    <pos-month-select class="pos-month-report__month-select"/>
    <pos-month-report class="pos-month-report__report-content"/>
  </div>
</template>
<script>
  import PosMonthReportSetting from '../MonthReport/PosMonthReportSetting';
  import PosMonthSelect from '../MonthReport/PosMonthSelect';
  import PosMonthReport from '../MonthReport/PosMonthReport';
  
  export default {
    name: 'posMonthReportView',
    components: { PosMonthReport, PosMonthSelect, PosMonthReportSetting },
    props: {},
    injectService: ['ReportsStore:(printMonthlyReport,monthReport,showAllZNumber,showProductSold,monthReportFrom,monthReportTo)'],
    data: function () {
      return {
        // inject service
        monthReport: null,
        showAllZNumber: false,
        showProductSold: true,
        monthReportFrom: null,
        monthReportTo: null,
      }
    },
    computed: {},
    methods: {
      goBack() {
        this.$router.push({path: '/pos-dashboard'})
      },
      async printReport() {
        try {
          const posStore = this.$getService('ReportsStore');
          const {monthReport, showAllZNumber,showProductSold, monthReportFrom, monthReportTo} = posStore;
          const {total, salesByCategory, salesByPayment, zNumbers} = monthReport
          const date = `${dayjs(monthReportFrom).format('D MMM YYYY')} - ${dayjs(monthReportTo).format('D MMM YYYY')}`;
          const report = {
            total,
            salesByPayment,
            date,
            ...showAllZNumber && {zNumbers},
            ...showProductSold && {salesByCategory}
          };
          await this.$getService('ReportsStore:printMonthlyReport')(report);
        } catch(e) {
        console.error(e)
        }
      },
      // inject service
      printMonthlyReport() { console.error('ReportsStore:printMonthlyReport was not injected.') }
    }
  }
</script>
<style scoped lang="scss">
  .pos-month-report {
    display: grid;
    grid-template-columns: 75% 25%;
    grid-template-rows: 50px calc(100% - 114px) 64px;
    height: 100%;
    
    &__toolbar {
      grid-area: 3 / 1 / 4 / 3;
      height: calc(64px);
      z-index: 4;
    }
    
    &__setting {
      grid-area: 1 / 2 / 3 / 3;
      z-index: 3;
    }
    
    &__month-select {
      grid-area: 1 / 1 / 2 / 2;
      z-index: 2;
    }
    
    &__report-content {
      grid-area: 2 / 1 / 3 / 2;
      z-index: 1;
    }
  }
</style>
