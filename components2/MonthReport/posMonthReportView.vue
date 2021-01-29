<script>
import {backFn, genScopeId} from '../utils';
import {printMonthReport} from './month-report-shared';
import PosMonthReport from './PosMonthReport';
import PosMonthSelect from './PosMonthSelect';
import PosMonthReportSetting from './PosMonthReportSetting';

export default {
  name: 'PosMonthReportView',
  components: [PosMonthReport, PosMonthSelect, PosMonthReportSetting],
  setup() {
    //todo: ReportsStore, printMonthlyReport
    return genScopeId(() =>
        <div class="pos-month-report">
          <g-toolbar class="pos-month-report__toolbar">
            <g-btn background-color="white" text-color="#1d1d26" onClick={backFn.value}>
              <g-icon>
                icon-back
              </g-icon>
              <span class="ml-2">Back </span>
            </g-btn>
            <g-spacer>
            </g-spacer>
            <g-btn background-color="#1271FF" text-color="#FFFFFF" onClick={printMonthReport}>
              <g-icon>
                icon-printer_2
              </g-icon>
              <span class="ml-2">
                Print report </span>
            </g-btn>
          </g-toolbar>
          <PosMonthReportSetting class="pos-month-report__setting"/>
          <PosMonthSelect class="pos-month-report__month-select"/>
          <PosMonthReport class="pos-month-report__report-content"/>
        </div>)
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
