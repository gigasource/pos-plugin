<script>
import dayjs from 'dayjs'
import {autoAssignFromTo, getMonthReport, selectedMonth, selectedPeriod} from './month-report-shared';
import {genScopeId} from '../utils';

export default {
  name: 'PosMonthSelect',
  setup() {
    const nextMonth = async function () {
      selectedMonth.value = dayjs(selectedMonth.value).add(1, 'month').toDate()
      autoAssignFromTo()
      await getMonthReport()
    }

    const previousMonth = async function () {
      selectedMonth.value = dayjs(selectedMonth.value).subtract(1, 'month').toDate()
      autoAssignFromTo()
      await getMonthReport()
    }
    getMonthReport();

    return genScopeId(() => (
        <div class="month-select-wrapper">
          <g-icon previous class="mr-4" onClick={previousMonth}>
            arrow_back_ios
          </g-icon>
          <span>
            {selectedPeriod.value} </span>
          <g-icon next class="ml-4" onClick={nextMonth}>
            arrow_forward_ios
          </g-icon>
        </div>
    ))
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
