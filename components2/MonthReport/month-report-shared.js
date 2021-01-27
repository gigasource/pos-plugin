import dayjs from "dayjs";
import {dateFormat} from "../utils";
import {computed, ref} from 'vue';
import cms from "cms";
import JsonFn from "json-fn";
import _ from 'lodash';

export const monthReport = ref();
export const showProductSold = ref(true)
export const showAllZNumber = ref();
export const selectedMonth = ref(dayjs().toDate());
export const selectedMonthFrom = computed(() => dayjs(selectedMonth.value).startOf('month').toDate());
export const selectedMonthTo = computed(() => dayjs(selectedMonth.value).endOf('month').toDate());
export const monthReportFrom = ref(selectedMonthFrom.value)
export const monthReportTo = ref(selectedMonthTo.value)

export function autoAssignFromTo() {
  monthReportFrom.value = selectedMonthFrom.value
  monthReportTo.value = selectedMonthTo.value
}

export const selectedPeriod = computed(() => {
  if (monthReportFrom.value && monthReportTo.value) {
    const start = dayjs(monthReportFrom.value);
    const end = dayjs(monthReportTo.value);
    if (!start.isSame(selectedMonthFrom.value, 'day') || !end.isSame(selectedMonthTo.value, 'day')) {
      return `${start.format(dateFormat.value)} - ${end.format(dateFormat.value)}`
    }
  }
  if (selectedMonth.value) {
    return dayjs(selectedMonth.value).format('MMMM YYYY')
  }
})

//todo: test this first
export async function getMonthReport() {
  let {total, salesByCategory, salesByPayment, zNumbers, salesByCategoryName}
    = JsonFn.clone(await new Promise(
    r => cms.socket.emit('make-month-report', monthReportFrom.value, monthReportTo.value, r)));

  zNumbers = _.reduce(zNumbers, (acc, data, date) => {
    _.forEach(data, (sum, z) => {
      if (!z) return;
      const _item = {z: parseInt(z), sum: sum, date: dayjs(date, 'DD.MM.YYYY').format(dateFormat.value)}
      acc.push(_item);
    })
    return acc
  }, [])

  monthReport.value = {total, salesByCategory, salesByPayment, zNumbers, salesByCategoryName}
}
