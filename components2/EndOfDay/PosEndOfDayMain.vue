<script>
import {useI18n} from 'vue-i18n'
import { onMounted, onActivated, ref } from 'vue'

export default {
  setup() {
    const {t} = useI18n();

    const date = ref(null)
    const eventDates = ref([])
    const selectedReportDate = ref(null)
    const listOfDatesWithReports = ref([])
    const daysOfWeek = ref([
      'onlineOrder.weekday.sun',
      'onlineOrder.weekday.mon',
      'onlineOrder.weekday.tue',
      'onlineOrder.weekday.wed',
      'onlineOrder.weekday.thu',
      'onlineOrder.weekday.fri',
      'onlineOrder.weekday.sat',
    ])

    const getDay = function (date) {
      let i = new Date(date).getDay();
      return t(daysOfWeek.value[i])
    }

    const selectDate = function (value) {
      if (!selectedReportDate.value || !value) selectedReportDate.value = {}
      if (selectedReportDate.value && selectedReportDate.value.date === value) return
      date.value = value
      getDailyReports(dayjs(value, 'YYYY-MM-DD').toDate())
    }

    const getDatesWithReport = async function (date) {
      eventDates.value = await getDatesWithReports(date)
    }

    const getDailyReports = function () {
      console.error('ReportsStore:getDailyReports wasn\'t not injected')
    }

    const getDatesWithReports = function () {
      console.error('ReportsStore:getDatesWithReports wasn\'t not injected')
    }

    onMounted(() => {
      setTimeout(async() => {
        const currentDate = dayjs().format('YYYY-MM-DD');
        await getDatesWithReport(currentDate)
        await selectDate(currentDate)
      }, 100)
    })

    onActivated(() => {
      setTimeout(async () => {
        const currentDate = dayjs().format('YYYY-MM-DD');
        await getDatesWithReport(currentDate)
        await selectDate(currentDate)
      }, 100)
    })

    return () => <>
      <div style="height: 100%; background-color: #EEEEEE;">
        <pos-end-of-day-date-picker
            eventDates={listOfDatesWithReports.value}
            firstDayOfWeek={1}
            monthSelectDisabled={true}
            weekdayFormat={getDay} color="#fff"
            full-width no-title
            modelValue={date.value} onUpdate:modelValue={selectDate}
            onClick:prev={getDatesWithReport}
            onClick:next={getDatesWithReport}>
        </pos-end-of-day-date-picker>
      </div>
    </>
  }
}
</script>

<style scoped>
.g-picker {
  box-shadow: none;
  height: 100%;
}
</style>
