<script>

import {ref} from 'vue'
import PosEndOfDayReprintZReport from "./PosEndOfDayReprintZReport";
import PosEndOfDayPrintZReport from "./PosEndOfDayPrintZReport";
import PosEndOfDayPrintPendingZReport from "./PosEndOfDayPrintPendingZReport";
import PosEndOfDayPrintXReport from "./PosEndOfDayPrintXReport";
import {useI18n} from "vue-i18n";
import {getOldestPendingReport, pendingReport, selectedReportDate, showReprint, showRunEndOfDay} from "./eod-shared";
import {backFn} from "../utils";

export default {
  components: {
    PosEndOfDayReprintZReport, PosEndOfDayPrintXReport,
    PosEndOfDayPrintZReport, PosEndOfDayPrintPendingZReport
  },
  setup() {
    const {t} = useI18n();
    const showEndOfDayConfirmDialog = ref(false)
    const showPendingEndOfDayConfirmDialog = ref(false)

    async function runEndOfDay() {
      await getOldestPendingReport()
      if (pendingReport.value && pendingReport.value.date < selectedReportDate.value.date) {
        return showPendingEndOfDayConfirmDialog.value = true
      }
      showEndOfDayConfirmDialog.value = true
    }

    return () => (
        <g-toolbar color="#eee" style="z-index: 2">
          <g-btn uppercase={false} onClick={backFn.value}>
            <g-icon class="mr-2" svg>icon-back</g-icon>
            {t('ui.back')}
          </g-btn>
          <g-spacer/>
          <pos-end-of-day-reprint-z-report v-slots={{
            'activator': ({open, close}) =>
                (showReprint.value) &&
                <g-btn uppercase={false} class="mr-2" onClick={open}>
                  <g-icon class="mr-2" svg>
                    icon-print2
                  </g-icon>
                  {t('ui.reprint')}
                </g-btn>
            ,
          }}/>
          <pos-end-of-day-print-x-report v-slots={{
            'activator': ({open, close}) =>
                showRunEndOfDay.value &&
                <g-btn uppercase={false} onClick={() => open()} width="139px" class="mr-2">
                  {t('report.xReport')}
                </g-btn>
          }}/>

          <g-btn vShow={showRunEndOfDay.value} uppercase={false} onClick={runEndOfDay} background-color="#E57373"
                 text-color="#FFFFFF">
            {t('report.runEndOfDay')}
          </g-btn>

          <pos-end-of-day-print-pending-z-report v-model={showPendingEndOfDayConfirmDialog.value}/>
          <pos-end-of-day-print-z-report v-model={showEndOfDayConfirmDialog.value}/>
        </g-toolbar>
    )
  }
}
</script>

<style scoped>

</style>
