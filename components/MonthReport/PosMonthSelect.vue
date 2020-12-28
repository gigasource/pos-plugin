<template>
  <div class="month-select-wrapper">
    <g-icon class="mr-4" @click="previousMonth">
      arrow_back_ios
    </g-icon>
    <span>{{month}}</span>
    <g-icon class="ml-4" @click="nextMonth">
      arrow_forward_ios
    </g-icon>
  </div>
</template>

<script>
  export default {
    name: 'PosMonthSelect',
    injectService: ['ReportsStore:(monthReportFrom,monthReportTo,selectedMonth,getMonthReport)', 'PosStore:(dateFormat)'],
    data() {
      return {
        // inject
        monthReportFrom: null,
        monthReportTo: null,
        selectedMonth: dayjs(),
        dateFormat: null
      }
    },
    computed: {
      month() {
        if (this.monthReportFrom && this.monthReportTo) {
          const start = dayjs(this.monthReportFrom);
          const end = dayjs(this.monthReportTo);
          if (!start.isSame(end, 'month')) {
            return `${start.format(this.dateFormat)} - ${end.format(this.dateFormat)}`
          }
        }
        if (this.selectedMonth) {
          return this.selectedMonth.format('MMMM YYYY')
        }
      },
    },
    methods: {
      async nextMonth() {
        this.selectedMonth = this.selectedMonth.add(1, 'month');
        await this.updateMonth();
      },
      async previousMonth() {
        this.selectedMonth = this.selectedMonth.add(-1, 'month');
        await this.updateMonth();
      },
      async updateMonth() {
        this.monthReportFrom = this.selectedMonth.startOf('month').format('YYYY-MM-DD');
        this.monthReportTo = dayjs().isSame(this.selectedMonth.endOf('month'), 'month')
        && dayjs().isBefore(this.selectedMonth.endOf('month'))
          ? dayjs().format('YYYY-MM-DD')
          : this.selectedMonth.endOf('month').format('YYYY-MM-DD');
        await this.getMonthReport();
      },
      // inject
      getMonthReport() {
        console.error('ReportsStore:getMonthReport was not injected')
      }
    },
    async created() {
      this.selectedMonth = dayjs();
      setTimeout(async () => {
        await this.updateMonth();
      }, 100);
    }
  }
</script>

<style scoped lang="scss">
  .month-select-wrapper {
    display: flex;
    justify-content: center;
    align-items: center;
    font-weight: 700;
    font-size: 18px;
    color: #212B35;
    background: #F0F0F0;
    box-shadow: 0px 1px 4px rgba(0, 0, 0, 0.14);
  }
</style>
