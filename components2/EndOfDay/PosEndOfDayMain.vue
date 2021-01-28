<script>
import {useI18n} from 'vue-i18n'
import {onActivated, onMounted, ref} from 'vue'
import PosEndOfDayDatePicker from "./PosEndOfDayDatePicker";
import dayjs from 'dayjs'
import {eventDates, getDailyReports, getEodReportsInMonthCalender, selectedDate} from "./eod-shared";

export default {
  components:{PosEndOfDayDatePicker},
  setup() {
    const {t} = useI18n();

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

    const getDatesWithReport = async function (date) {
      await getEodReportsInMonthCalender(date);
    }

    onMounted(async () => {
      const currentDate = dayjs().format('YYYY-MM-DD');
      await getEodReportsInMonthCalender(currentDate);

    })

    onActivated(async () => {
      const currentDate = dayjs().format('YYYY-MM-DD');
      await getEodReportsInMonthCalender(currentDate);
    })

    return () => <>
      <div style="height: 100%; background-color: #EEEEEE;">
        <pos-end-of-day-date-picker
            eventDates={eventDates.value}
            firstDayOfWeek={1}
            monthSelectDisabled={true}
            weekdayFormat={getDay} color="#fff"
            full-width no-title
            modelValue={selectedDate.value}
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
