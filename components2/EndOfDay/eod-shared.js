import dayjs from 'dayjs'
import {computed, ref} from "vue";
import * as jsonfn from "json-fn";
import cms from 'cms'
import _ from 'lodash'

export const listOfDatesWithReports = ref([])
export const selectedDate = ref(new Date());

export const eventDates = computed(() => {
  return _.map(listOfDatesWithReports.value, (value, key) => {
    const color = Object.keys(value).includes('') ? '#00E676' : '#EF9A9A'
    return {
      date: dayjs(key).format('YYYY-MM-DD'),
      color
    }
  })
});
export const highestZNumber = ref(1);

export function mapCalendarReports(dates) {
  const detailReports = [];
  for (const _date of Object.keys(dates)) {
    const date = dayjs(_date).toDate();
    const _reports = dates[_date];
    //todo: this.getHighestZNumber

    const reports = _.map(_reports, (r, key) => {
      if (!key) getHighestZNumber();
      return {
        sum: r.vSum,
        z: key ? parseInt(key) : highestZNumber.value,
        begin: r.from,
        end: r.to,
        pending: !key
      }
    }).sort((cur, next) => cur.begin - next.begin)

    detailReports.push({
      date,
      reports
    })
  }
  return detailReports;
}

export const detailsDailyReport = computed(() => mapCalendarReports(listOfDatesWithReports.value))

export const selectedReportDate = computed(() => {
  //base on selectedDate and detailsDailyReport
  //target ->
  //todo: begin hours concept
  return detailsDailyReport.value.find(item => dayjs(item.date).startOf('d').isSame(dayjs(selectedDate.value).startOf('d')));
})

export const hasDateReports = computed(() => {
  return selectedReportDate.value && selectedReportDate.value.reports && selectedReportDate.value.reports.length > 0
})

export const showRunEndOfDay = computed(() => {
  return hasDateReports.value && selectedReportDate.value.reports.some(report => report.pending)
})

export const showReprint = computed(() => {
  return hasDateReports.value && !selectedReportDate.value.reports.some(report => report.pending)
})

async function getHighestZNumber() {
  const eod0 = await cms.getModel('EndOfDay').findOne({}).sort({z: '-1'});
  highestZNumber.value = eod0 ? eod0.z + 1 : 1;
}

export async function getEodReportsInMonthCalender(month = new Date()) {
  //todo: beginHours
  let from = dayjs(month).startOf('month').toDate()
  const to = dayjs(month).endOf('month').toDate()
  await getEodReportsCalender(from, to)
}

async function getEodReportsCalender(from, to, fillToSingleton = true) {
  let result = await new Promise((resolve, reject) => {
    cms.socket.emit('get-eod-report-calender', from, to, (eodReport) => {
      resolve(eodReport)
    })
  })

  result = jsonfn.clone(result);
  if (fillToSingleton) listOfDatesWithReports.value = result.ordersByDate;
  return result.ordersByDate
}

export const xReport = ref();

export async function getXReport() {
  //todo: XReport, beginHour
  /*const beginHour = cms.getList('PosSetting')[0].generalSetting.beginHour || '00:00'
  const [hour, minutes] = beginHour.split(':')
  const from = dayjs(date).startOf('day').hour(parseInt(hour)).minute(parseInt(minutes)).toDate()
  const to = dayjs(from).add(1, 'day').toDate()*/
  const from = dayjs(selectedDate.value).startOf('d').toDate();
  const to = dayjs(selectedDate.value).endOf('d').toDate();

  cms.socket.emit('get-x-report', from, to, async (result) => {
    result = jsonfn.clone(result);
    xReport.value = result;
  })
}

export const pendingReport = ref();

/**
 * find one report (computed base on list of orders) which doesn't have z
 * @returns {Promise<void>}
 */
export async function getOldestPendingReport() {
  //todo: beginHour
  const pendingOrder = await cms.getModel('Order').findOne({z: {$exists: false}, status: 'paid'}).sort('date')
  if (pendingOrder) {
    const fromDate = dayjs(pendingOrder.vDate);
    let eodData = await getEodReportsCalender(fromDate.toDate(), fromDate.add(1, 'day').toDate(), false)
    await getHighestZNumber();
    let reports = mapCalendarReports(eodData)
    pendingReport.value = reports.reduce((l,i) => l.concat(i.reports), []).find(r => r.pending);
  }
}

export async function makeEODReport(report) {
  if (!report || !report.pending) return;
  await new Promise(resolve => cms.socket.emit('endOfDay', report, resolve))
  //todo: binding with backend
  /*await new Promise(resolve => cms.socket.emit('printReport', 'XReport', date, function () {
    resolve();
  }))*/
}

export async function printXReport() {
  await new Promise(resolve => cms.socket.emit('printReport', 'XReport', selectedDate.value, resolve))
}

export async function printZReport(report) {
  await new Promise(resolve => cms.socket.emit('printReport', 'ZReport', report, resolve))
}

