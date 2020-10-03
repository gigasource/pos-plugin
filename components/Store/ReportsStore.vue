<template>
  <fragment/>
</template>

<script>
  import * as jsonfn from 'json-fn';
  import { getProvided } from '../logic/commonUtils';

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
        selectedMonth: null,
        monthReportFrom: null,
        monthReportTo: null,
        showProductSold: true,
        showAllZNumber: false,
        monthReport: null,
        virtualReports: []
      }
    },
    computed: {
      virtualReportCount () {
        return this.virtualReports.length
      }
    },
    methods: {
      //<!--<editor-fold desc="End-of-day Report">-->
      async getEodReports(from, to) {
        try {
          let result = await cms.processData('OrderEODCalendar', { from, to });
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
          const pendingOrder = await cms.getModel('Order').findOne({ z: { $exists: false }, status: 'paid' }).sort('date')
          if (pendingOrder) {
            const fromDate = dayjs(pendingOrder.vDate);
            let eodData = await this.getEodReports(fromDate.toDate(), fromDate.add(1, 'day').toDate())
            eodData = jsonfn.clone(eodData, true, true)
            const reports = _.map(eodData, (val,key) => ({ date: dayjs(key), reports: val }))
            return reports.find(i => i.reports[''])
          }
        } catch (e) {
          console.error(e)
        }
      },
      async finalizeReport(reports) {
        if (!reports || !reports.length) return
        const report = Object.assign(reports.find(i => i.pending))

        try {
          const orderModel = cms.getModel('Order')
          let vDateOrders = await orderModel.find({ status: 'paid', vDate: dayjs(report.begin).startOf('day').toDate() })
          vDateOrders = jsonfn.clone(vDateOrders, true, true)

          const ordersToUpdate = vDateOrders.filter(order => report.begin <= order.date && order.date <= report.end).map(i => i._id)

          await orderModel.updateMany({ _id: { $in: ordersToUpdate} }, { $set: { z: report.z } })
          await cms.getModel('EndOfDay').create(report)
          await this.printZReport(report.z)
        } catch (e) {
          console.error(e)
        }
      },
      printZReport(z) {
        return new Promise((resolve, reject) => {
          if (_.isNil(z)) reject()
          cms.socket.emit('printReport', 'ZReport', { z: parseInt(z) }, this.device, ({ success, message }) => {
            if (success) resolve()
            reject(message)
          })

        })
      },
      async getXReport(date) {
        try {
          const beginHour = cms.getList('PosSetting')[0].generalSetting.beginHour || '00:00'
          const [hour, minutes] = beginHour.split(':')
          const from = dayjs(date).startOf('day').hour(parseInt(hour)).minute(parseInt(minutes)).toDate()
          const to = dayjs(from).add(1, 'day').toDate()

          const xReport = await cms.processData('OrderXReport', { from, to })
          return xReport.dayReport[dayjs(date).format('DD-MM-YYYY')]
        } catch (e) {
          console.error(e)
        }
      },
      async printXReport(date) {
        const from = dayjs(date).startOf('day').toDate()
        const to = dayjs(from).add(1, 'day').toDate()

        return new Promise((resolve, reject) => {
          cms.socket.emit('printReport', 'XReport',
            { from, to }, this.device, ({ success, message }) => {
              if (success) resolve()
              reject(message)
            })
        })
      },
      //<!--</editor-fold>-->

      //<!--<editor-fold desc="Monthly Report">-->
      async getMonthReport() {
        const from = dayjs(this.monthReportFrom).toDate()
        const to = dayjs(this.monthReportTo).toDate()
        let { total, salesByCategory, salesByPayment, zNumbers } = await cms.processData('OrderMonthReport', {from, to})

        salesByCategory = _.mapValues(salesByCategory, (value) => {
          const products = _.reduce(value, (acc, {quantity, gross}, product) => {
            acc.push({product, quantity, gross})
            return acc
          }, [])
          return {
            products,
            sum: products.reduce((acc, { gross }) => acc + gross, 0)
          }
        })
        zNumbers = _.reduce(zNumbers, (acc, data, date) => {
          acc.push(..._.map(data, (sum, z) => ({ z, sum, date: dayjs(date, 'DD-MM-YYYY').format(this.dateFormat) })))
          return acc
        }, [])

        this.monthReport = { total, salesByCategory, salesByPayment, zNumbers }

        return { total, salesByCategory, salesByPayment, zNumbers }
      },
      printMonthlyReport(report) {
        return new Promise((resolve, reject) => {
          cms.socket.emit('printReport', 'MonthlyReport',
            report, this.device,
            ({ success, message }) => {
              if (success) resolve()
              reject(message)
            })
        })
      },
      //<!--</editor-fold>-->

      //<!--<editor-fold desc="Staff Report">-->
      async getOrderSalesByStaff(staffName, date = new Date()) {
        if (!staffName) {
          return
        }
        const fromTime = dayjs(date).startOf('day').toDate();
        const toTime = dayjs(date).startOf('day').add(1, 'day').toDate();

        return await cms.processData('OrderSalesByStaff', { from: fromTime, to: toTime, name: staffName })
      },
      printStaffReport(report) {
        return new Promise((resolve, reject) => {
          cms.socket.emit('printReport', 'StaffReport',
            report, this.device,
            ({ success, message }) => {
              if (success) {
                resolve()
              }
              reject(message)
            })
        })
      },
      //<!--</editor-fold>-->

      getHighestZNumber() {
        const reportWithHighestZ = cms.getList('EndOfDay').sort((cur, next) => next.z - cur.z)[0]
        return reportWithHighestZ ? reportWithHighestZ.z + 1 : 1
      },

      //<!--<editor-fold desc="Virtual print report">-->
      onVirtualReportReceived({ path }) {
        // save to db
        this.$set(this, 'virtualReports', [...this.virtualReports, { path, issueDate: dayjs() } ])
      },
      cleanOutOfDateVirtualReports() {
        // remove from db
      }
      //<!--</editor-fold>-->
    },
    provide() {
      return {
        ...getProvided(this.$data, this),
        ...getProvided(this.$options.methods, this),
        ...getProvided(this.$options.computed, this),
      }
    }
  }
</script>
