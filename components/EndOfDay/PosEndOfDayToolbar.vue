<template>
  <g-toolbar color="#eee" style="z-index: 2">
    <g-btn :uppercase="false" @click="back">
      <g-icon class="mr-2" svg>icon-back</g-icon>
      {{$t('ui.back')}}
    </g-btn>
    <g-spacer/>

    <pos-end-of-day-reprint-z-report>
      <template v-slot:activator="{open, close}">
        <g-btn :uppercase="false" class="mr-2" v-if="showReprint" @click="open">
          <g-icon class="mr-2" svg>icon-print2</g-icon>
          {{$t('ui.reprint')}}
        </g-btn>
      </template>
    </pos-end-of-day-reprint-z-report>

    <pos-end-of-day-print-dialog>
      <template v-slot:activator="{open, close}">
        <g-btn :uppercase="false" @click="open(selectedReportDate.date)" width="139px" class="mr-2" v-if="showRunEndOfDay">
          {{$t('report.xReport')}}
        </g-btn>
      </template>
    </pos-end-of-day-print-dialog>

    <g-btn :uppercase="false" @click="runEndOfDay" background-color="#E57373" text-color="#FFFFFF" v-if="showRunEndOfDay">
      {{$t('report.runEndOfDay')}}
    </g-btn>

    <pos-end-of-day-print-pending-z-report @confirmed="save" v-model="showPendingEndOfDayConfirmDialog"/>
    <pos-end-of-day-print-z-report @confirmed="save(selectedReportDate.reports)" v-model="showEndOfDayConfirmDialog"/>
  </g-toolbar>
</template>

<script>
  import PosEndOfDayPrintZReport from './PosEndOfDayPrintZReport';
  import PosEndOfDayPrintDialog from './PosEndOfDayPrintDialog';
  import PosEndOfDayPrintPendingZReport from './PosEndOfDayPrintPendingZReport';
  import PosEndOfDayReprintZReport from './PosEndOfDayReprintZReport';

  export default {
    name: 'PosEndOfDayToolbar',
    components: { PosEndOfDayReprintZReport, PosEndOfDayPrintPendingZReport, PosEndOfDayPrintDialog, PosEndOfDayPrintZReport },
    injectService: [
      'ReportsStore:(selectedReportDate,listOfDatesWithReports,getOldestPendingReport,finalizeReport,getDatesWithReports,getDailyReports)'
    ],
    data() {
      return {
        showEndOfDayConfirmDialog: false,
        showPendingEndOfDayConfirmDialog: false,
        // inject.ReportsStore
        selectedReportDate: null,
        listOfDatesWithReports: []
      }
    },
    computed: {
      hasDateReports() {
        return this.selectedReportDate && this.selectedReportDate.reports && this.selectedReportDate.reports.length > 0
      },
      showRunEndOfDay() {
        return this.hasDateReports && this.selectedReportDate.reports.some(report => report.pending)
      },
      showReprint() {
        return this.hasDateReports && !this.selectedReportDate.reports.some(report => report.pending)
      },
    },
    methods: {
      back() {
        this.$router.push({ path: '/pos-dashboard' })
      },
      async runEndOfDay() {
        const oldestPendingReport = await this.getOldestPendingReport()
        if (oldestPendingReport && oldestPendingReport.date < this.selectedReportDate.date) {
          this.showPendingEndOfDayConfirmDialog = true
          return
        }
        this.showEndOfDayConfirmDialog = true
      },
      async save(reports) {
        const date = this.selectedReportDate.date || new Date()
        await this.finalizeReport(reports)
        await this.getDatesWithReports(date)
        this.getDailyReports(date)
      },
      getOldestPendingReport() {
        console.error('ReportsStore:getOldestPendingReport was not injected')
      },
      finalizeReport() {
        console.error('ReportsStore:finalizeReport was not injected')
      },
      getDatesWithReports() {
        console.error('ReportsStore:getDatesWithReports was not injected')
      },
      getDailyReports() {
        console.error('ReportsStore:getDailyReports was not injected')
      }
    }
  }
</script>

<style scoped>

</style>
