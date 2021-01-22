<script>

import { computed, ref } from 'vue'
import { useRoute } from 'vue-router';

export default {
  setup() {
    const  showEndOfDayConfirmDialog = ref(false)
    const showPendingEndOfDayConfirmDialog = ref(false)
        // inject.ReportsStore
    const selectedReportDate = ref(null)
    const listOfDatesWithReports = ref([])
    const hasDateReports = computed(() => {
      return selectedReportDate.value && selectedReportDate.value.reports && selectedReportDate.value.reports.length > 0
    })
    const showRunEndOfDay = computed(() => {
      return hasDateReports.value && selectedReportDate.value.reports.some(report => report.pending)
    })
    const showReprint = computed(() => {
      return hasDateReports.value && !selectedReportDate.value.reports.some(report => report.pending)
    })
    const router = useRoute()
    function back() {
      router.push({ path: '/pos-dashboard' })
    }

    //todo: getOldestPendingReport, finalizeReport, getDatesWithReports, getDailyReports
    async function runEndOfDay() {
      const oldestPendingReport = await getOldestPendingReport()
      if (oldestPendingReport && oldestPendingReport.date < selectedReportDate.value.date) {
        showPendingEndOfDayConfirmDialog.value = true
        return
      }
      showEndOfDayConfirmDialog.value = true
    }
    async function save(reports) {
      const date = selectedReportDate.date || new Date()
      await finalizeReport(reports)
      await getDatesWithReports(date)
      getDailyReports(date)
    }
    return () => <>
      <g-toolbar color="#eee" style="z-index: 2">
        <g-btn uppercase={false} onClick={back}>
          <g-icon class="mr-2" svg>
            icon-back
          </g-icon>
          {t('ui.back')}
        </g-btn>
        <g-spacer>
        </g-spacer>
        <pos-end-of-day-reprint-z-report v-slots={{
          'activator': ({ open, close }) => <>
            {
              (showReprint.value) &&
              <g-btn uppercase={false} class="mr-2" onClick={open}>
                <g-icon class="mr-2" svg>
                  icon-print2
                </g-icon>
                {t('ui.reprint')}
              </g-btn>
            }
          </>
          ,
        }}></pos-end-of-day-reprint-z-report>
        <pos-end-of-day-print-dialog v-slots={{
          'activator': ({ open, close }) => <>
            {
              (showRunEndOfDay.value) &&
              <g-btn uppercase={false} onClick={() => open(selectedReportDate.value.date)} width="139px" class="mr-2">
                {t('report.xReport')}
              </g-btn>
            }
          </>
        }}></pos-end-of-day-print-dialog>
        {
          (showRunEndOfDay.value) &&
          <g-btn uppercase={false} onClick={runEndOfDay} background-color="#E57373" text-color="#FFFFFF">

            {t('report.runEndOfDay')}
          </g-btn>
        }
        <pos-end-of-day-print-pending-z-report onConfirmed={save} v-model={showPendingEndOfDayConfirmDialog.value}>
        </pos-end-of-day-print-pending-z-report>
        <pos-end-of-day-print-z-report onConfirmed={() => save(selectedReportDate.value.reports)} v-model={showEndOfDayConfirmDialog.value}>
        </pos-end-of-day-print-z-report>
      </g-toolbar>
    </>
  }
}
</script>

<style scoped>

</style>
