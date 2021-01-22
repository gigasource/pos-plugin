import dayjs from 'dayjs'
import {ref} from "vue";
import * as jsonfn from "json-fn";
import cms from 'cms'
export const listOfDatesWithReports = ref([])
import _ from 'lodash'

async function getEodReportsCalender(from, to) {
  try {
    // let result = await cms.processData('OrderEODCalendar', {from, to});
    let result = await new Promise((resolve, reject) => {
      cms.socket.emit('get-eod-report-calender', from.toDate(), to.toDate(), (eodReport) => {
        resolve(eodReport)
      })
    })

    result = jsonfn.clone(result, true, true);
    return result.ordersByDate
  } catch (e) {
    console.error(e)
  }
}

export async function getDatesWithReports(month) {
  let eventDates = []

  if (month) {
    let currentDate = dayjs(month).startOf('month')
    const endDate = currentDate.add(1, 'month')

    const dates = await getEodReportsCalender(currentDate, endDate)

    eventDates = _.map(dates, (value, key) => {
      const color = Object.keys(value).includes('') ? '#00E676' : '#EF9A9A'
      return {
        date: dayjs(key).format('YYYY-MM-DD'),
        color
      }
    })
  }

  return eventDates
}

export async function getDailyReports(month) {
  let eventDates = []

  if (month) {
    let currentDate = dayjs(month).startOf('month')
    const endDate = currentDate.add(1, 'month')

    const dates = await getEodReportsCalender(currentDate, endDate)

    eventDates = _.map(dates, (value, key) => {
      const color = Object.keys(value).includes('') ? '#00E676' : '#EF9A9A'
      return {
        date: dayjs(key).format('YYYY-MM-DD'),
        color
      }
    })
  }

  return eventDates
}
