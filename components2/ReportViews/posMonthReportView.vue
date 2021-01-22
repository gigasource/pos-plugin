<script>
import { useRoute } from 'vue-router';

export default {

  setup() {

    const monthReport = ref(null)
    const showAllZNumber = ref(false)
    const showProductSold = ref(true)
    const monthReportFrom = ref(null)
    const monthReportTo = ref(null)
    function goBack() {
      //todo: router.go(-1) ???
      router.push({ path: '/pos-dashboard' })
    }

    //todo: ReportsStore, printMonthlyReport
    async function printReport() {
      try {
        const posStore = $getService('ReportsStore');
        const { monthReport, showAllZNumber, showProductSold, monthReportFrom, monthReportTo } = posStore;
        const { total, salesByCategory, salesByPayment, zNumbers } = monthReport
        const date = `${dayjs(monthReportFrom).format('D MMM YYYY')} - ${dayjs(monthReportTo).format('D MMM YYYY')}`;
        const report = {
          total,
          salesByPayment,
          date,
          ...showAllZNumber && { zNumbers },
          ...showProductSold && { salesByCategory }
        };
        await $getService('ReportsStore:printMonthlyReport')(report);
      } catch (e) {
        console.error(e)
      }
    }

    return () => <>
      <div class="pos-month-report">
        <g-toolbar class="pos-month-report__toolbar">
          <g-btn background-color="white" text-color="#1d1d26" onClick={goBack}>
            <g-icon>
              icon-back
            </g-icon>
            <span class="ml-2">
              Back </span>
          </g-btn>
          <g-spacer>
          </g-spacer>
          <g-btn background-color="#1271FF" text-color="#FFFFFF" onClick={printReport}>
            <g-icon>
              icon-printer_2
            </g-icon>
            <span class="ml-2">
              Print report </span>
          </g-btn>
        </g-toolbar>
        <pos-month-report-setting class="pos-month-report__setting">
        </pos-month-report-setting>
        <pos-month-select class="pos-month-report__month-select">
        </pos-month-select>
        <pos-month-report class="pos-month-report__report-content">
        </pos-month-report>
      </div>
    </>
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
