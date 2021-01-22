<script>
export default {
  setup() {
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
              (showReprint) &&
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
              (showRunEndOfDay) &&
              <g-btn uppercase={false} onClick={() => open(selectedReportDate.date)} width="139px" class="mr-2">

                {t('report.xReport')}
              </g-btn>
            }
          </>
          ,
        }}></pos-end-of-day-print-dialog>
        {
          (showRunEndOfDay) &&
          <g-btn uppercase={false} onClick={runEndOfDay} background-color="#E57373" text-color="#FFFFFF">

            {t('report.runEndOfDay')}
          </g-btn>
        }
        <pos-end-of-day-print-pending-z-report onConfirmed={save} v-model={showPendingEndOfDayConfirmDialog}>
        </pos-end-of-day-print-pending-z-report>
        <pos-end-of-day-print-z-report onConfirmed={() => save(selectedReportDate.reports)} v-model={showEndOfDayConfirmDialog}>
        </pos-end-of-day-print-z-report>
      </g-toolbar>
    </>


  }
}
</script>

<style scoped>

</style>
