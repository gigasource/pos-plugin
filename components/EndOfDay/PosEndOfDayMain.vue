<template>
  <div style="height: 100%; background-color: #EEEEEE;">
    <pos-end-of-day-date-picker :event-dates="listOfDatesWithReports"
                                :first-day-of-week="1"
                                :month-select-disabled="true"
                                :weekday-format="getDay"
                                color="#fff" full-width no-title
                                :value="date"
                                @input="selectDate"
                                @click:prev="getDatesWithReport"
                                @click:next="getDatesWithReport"
    >
    </pos-end-of-day-date-picker>
  </div>
</template>

<script>
  import PosEndOfDayDatePicker from './PosEndOfDayDatePicker';

  export default {
    name: 'PosEndOfDayMain',
    components: { PosEndOfDayDatePicker },
    injectService: ['ReportsStore:(selectedReportDate,listOfDatesWithReports,getDailyReports,getDatesWithReports)'],
    data: () => ({
      date: null,
      eventDates: [],
      // inject.ReportsStore
      selectedReportDate: null,
      listOfDatesWithReports: []
    }),
    methods: {
      getDay(date) {
        const daysOfWeek = this.$t('dates.daysOfWeek');
        let i = new Date(date).getDay();
        return daysOfWeek[i]
      },
      selectDate(value) {
        if (!this.selectedReportDate || !value) this.selectedReportDate = {}
        if (this.selectedReportDate && this.selectedReportDate.date === value) return
        this.date = value
        this.getDailyReports(dayjs(value, 'YYYY-MM-DD').toDate())
      },
      async getDatesWithReport(date) {
        this.eventDates = await this.getDatesWithReports(date)
      },
      getDailyReports() {
        console.error('ReportsStore:getDailyReports wasn\'t not injected')
      },
      getDatesWithReports() {
        console.error('ReportsStore:getDatesWithReports wasn\'t not injected')
      }
    },
    async mounted() {
      setTimeout(async() => {
        const currentDate = dayjs().format('YYYY-MM-DD');
        await this.getDatesWithReport(currentDate)
        await this.selectDate(currentDate)
      }, 100)
    },
    async activated() {
      setTimeout(async () => {
        const currentDate = dayjs().format('YYYY-MM-DD');
        await this.getDatesWithReport(currentDate)
        await this.selectDate(currentDate)
      }, 100)
    }
  }
</script>

<style scoped>
  .g-picker {
    box-shadow: none;
    height: 100%;
  }
</style>
