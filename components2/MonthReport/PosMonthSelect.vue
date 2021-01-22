<script>
import dayjs from 'dayjs'
import { ref, computed, onCreated } from 'vue'
export default {
  name: 'PosMonthSelect',
  setup() {
    const monthReportFrom = ref(null)
    const monthReportTo = ref(null)
    const selectedMonth = ref(dayjs())
    const dateFormat = ref(null)

    const month = computed(() => {
      if (monthReportFrom.value && monthReportTo.value) {
        const start = dayjs(monthReportFrom.value);
        const end = dayjs(monthReportTo.value);
        if (!start.isSame(end, 'month')) {
          return `${start.format(dateFormat.value)} - ${end.format(dateFormat.value)}`
        }
      }
      if (selectedMonth.value) {
        return selectedMonth.value.format('MMMM YYYY')
      }
    })

    const nextMonth = async function () {
      selectedMonth.value = selectedMonth.value.add(1, 'month')
      await updateMonth()
    }

    const previousMonth = async function () {
      selectedMonth.value = selectedMonth.value.add(-1, 'month')
      await updateMonth()
    }

    const updateMonth = async function () {
      monthReportFrom.value = selectedMonth.value.startOf('month').format('YYYY-MM-DD')
      monthReportTo.value = dayjs().isSame(selectedMonth.value.endOf('month'), 'month')
      && dayjs().isBefore(selectedMonth.value.endOf('month'))
          ? dayjs().format('YYYY-MM-DD')
          : selectedMonth.value.endOf('month').format('YYYY-MM-DD')
      await getMonthReport()
    }

    const getMonthReport = function () {
      console.error('ReportsStore:getMonthReport was not injected')
    }

    onCreated(() => {
      selectedMonth.value = dayjs()
      setTimeout(async () => {
        await updateMonth();
      }, 100);
    })

    return () => <>
      <div class="month-select-wrapper" >
        <g-icon class="mr-4" onClick={previousMonth} >
          arrow_back_ios
        </g-icon>
        <span>
          {month.value} </span>
        <g-icon class="ml-4" onClick={nextMonth} >
          arrow_forward_ios
        </g-icon>
      </div>
    </>
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
