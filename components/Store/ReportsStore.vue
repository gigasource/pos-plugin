<template>
</template>

<script>
import * as jsonfn from 'json-fn';
import {getProvided} from '../logic/commonUtils';

export default {
  name: 'ReportsStore',
  domain: 'ReportsStore',
  injectService: ['PosStore:(dateFormat, device)'],
  data() {
    return {
      selectedReportDate: null,
      listOfDatesWithReports: [],
      reportsFromMonth: [],
      //month report screen
      selectedMonth: dayjs(),
      monthReportFrom: null,
      monthReportTo: null,
      showProductSold: true,
      showAllZNumber: false,
      monthReport: null
    }
  },
  methods: {
    //<!--<editor-fold desc="End-of-day Report">-->
    async getEodReports(from, to) {
      try {
        let result = await cms.processData('OrderEODCalendar', {from, to});
        result = jsonfn.clone(result, true, true);
        return result.ordersByDate
      } catch (e) {
        console.error(e)
      }
    },
    async getDatesWithReports(month) {
      let eventDates = []

      if (month) {
        let currentDate = dayjs(month).startOf('month')
        const endDate = currentDate.add(1, 'month')

        const dates = await this.getEodReports(currentDate, endDate)
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
    },
    getDailyReports(date) {
      try {
        const reports = this.reportsFromMonth[dayjs(date).toISOString()]
        if (!reports) return

        const sortedReports = _.map(reports, (value, key) => ({
          z: key ? key : this.getHighestZNumber(),
          begin: value.from,
          end: value.to,
          sum: value.vSum,
          pending: !key
        })).sort((cur, next) => cur.begin - next.begin);

        this.selectedReportDate = Object.assign({}, this.selectedReportDate, {
          date,
          reports: sortedReports
        })

        return sortedReports
      } catch (e) {
        console.error(e)
      }
    },
    async getOldestPendingReport() {
      try {
        const pendingOrder = await cms.getModel('Order').findOne({z: {$exists: false}, status: 'paid'}).sort('date')
        if (pendingOrder) {
          const fromDate = dayjs(pendingOrder.vDate);
          let eodData = await this.getEodReports(fromDate.toDate(), fromDate.add(1, 'day').toDate())
          eodData = jsonfn.clone(eodData, true, true)
          const reports = _.map(eodData, (val, key) => ({date: dayjs(key), reports: val}))
          return reports.find(i => i.reports[''])
        }
      } catch (e) {
        console.error(e)
      }
    },
    async finalizeReport(reports) {
      if (!reports || !reports.length) return
      const report = Object.assign(reports.find(i => i.pending))
      await new Promise(resolve => cms.socket.emit('endOfDay', report, function () {
        resolve();
      }))
    },
    printZReport(z) {
      return new Promise(async resolve => {
        console.log('print Z Report', z)
        if (_.isNil(z)) reject()
        cms.socket.emit('printReport', 'ZReport', { z: parseInt(z) }, () => {
          resolve()
        })
      })
    },
    async getXReport(date) {
      try {
        const beginHour = cms.getList('PosSetting')[0].generalSetting.beginHour || '00:00'
        const [hour, minutes] = beginHour.split(':')
        const from = dayjs(date).startOf('day').hour(parseInt(hour)).minute(parseInt(minutes)).toDate()
        const to = dayjs(from).add(1, 'day').toDate()

        const xReport = await cms.processData('OrderXReport', {from, to})
        return xReport.dayReport[dayjs(date).format('DD-MM-YYYY')]
      } catch (e) {
        console.error(e)
      }
    },
    async printXReport(date) {
      await new Promise(resolve => cms.socket.emit('printReport', 'XReport', date, function () {
        resolve();
      }))
    },
    //<!--</editor-fold>-->

    //<!--<editor-fold desc="Monthly Report">-->
    async getMonthReport() {
      const from = dayjs(this.monthReportFrom).toDate()
      const to = dayjs(this.monthReportTo).toDate()
      let {total, salesByCategory, salesByPayment, zNumbers} = await cms.processData('OrderMonthReport', {from, to})

      salesByCategory = _.mapValues(salesByCategory, (value) => {
        const products = _.reduce(value, (acc, {quantity, gross}, product) => {
          acc.push({product, quantity, gross})
          return acc
        }, [])
        return {
          products,
          sum: products.reduce((acc, {gross}) => acc + gross, 0)
        }
      })
      zNumbers = _.reduce(zNumbers, (acc, data, date) => {
        acc.push(..._.map(data, (sum, z) => ({z, sum, date: dayjs(date, 'DD-MM-YYYY').format(this.dateFormat)})))
        return acc
      }, [])

      this.monthReport = {total, salesByCategory, salesByPayment, zNumbers}

      return {total, salesByCategory, salesByPayment, zNumbers}
    },
    printMonthlyReport(report) {
      return new Promise(resolve => cms.socket.emit('printReport', 'MonthlyReport', report, function () {
        resolve();
      }))
    },
    //<!--</editor-fold>-->

    //<!--<editor-fold desc="Staff Report">-->
    async getOrderSalesByStaff(staffName, date = new Date()) {
      if (!staffName) {
        return
      }
      const fromTime = dayjs(date).startOf('day').toDate();
      const toTime = dayjs(date).startOf('day').add(1, 'day').toDate();

      return await cms.processData('OrderSalesByStaff', {from: fromTime, to: toTime, name: staffName})
    },
    printStaffReport(report) {
      return new Promise(resolve => cms.socket.emit('printReport', 'StaffReport', report, function () {
        resolve();
      }))
    },
    //<!--</editor-fold>-->

    getHighestZNumber() {
      const reportWithHighestZ = cms.getList('EndOfDay').sort((cur, next) => next.z - cur.z)[0]
      return reportWithHighestZ ? reportWithHighestZ.z + 1 : 1
    },
  },
  provide() {
    return {
      ...getProvided(this.$data, this),
      ...getProvided(this.$options.methods, this)
    }
  }
}
</script>
