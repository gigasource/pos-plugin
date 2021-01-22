import {ref} from "vue";
import * as jsonfn from "json-fn";
export const listOfDatesWithReports = ref([])

async function getEodReports(from, to) {
  try {
    let result = await cms.processData('OrderEODCalendar', {from, to});
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

    const dates = await getEodReports(currentDate, endDate)
    this.reportsFromMonth = dates

    eventDates = _.map(dates, (value, key) => {
      const color = Object.keys(value).includes('') ? '#00E676' : '#EF9A9A'
      return {
        date: dayjs(key).format('YYYY-MM-DD'),
        color
      }
    })
  }

  this.listOfDatesWithReports = eventDates
  return eventDates
}

export async function getDailyReports(month) {
  let eventDates = []

  if (month) {
    let currentDate = dayjs(month).startOf('month')
    const endDate = currentDate.add(1, 'month')

    const dates = await getEodReports(currentDate, endDate)
    this.reportsFromMonth = dates

    eventDates = _.map(dates, (value, key) => {
      const color = Object.keys(value).includes('') ? '#00E676' : '#EF9A9A'
      return {
        date: dayjs(key).format('YYYY-MM-DD'),
        color
      }
    })
  }

  this.listOfDatesWithReports = eventDates
  return eventDates
}
