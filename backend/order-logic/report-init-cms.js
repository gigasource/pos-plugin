const { staffReport } = require('./report-staff-logic');
const { monthReport } = require('./report-month-report');
const { xReport } = require('./report-x-report-logic');
const { eodReportCalender } = require('./report-eod-calender-logic')
const JsonFn = require('json-fn');

module.exports = function (cms) {
  cms.socket.on('connect', (socket) => {
    socket.on('get-eod-report-calender', async function (from, to, cb) {
      [from, to] = JsonFn.clone([from, to]);
      let result = await eodReportCalender(from, to);
      cb(result)
    })

    socket.on('get-x-report', async function (from, to, cb) {
      [from, to] = JsonFn.clone([from, to]);
      let result = await xReport(from, to);
      cb(result)
    })

    socket.on('make-month-report', async function (from, to, cb) {
      [from, to] = JsonFn.clone([from, to]);
      let result = await monthReport(from, to);
      cb(result)
    })

    socket.on('make-staff-report', async function (from, to, cb) {
      [from, to] = JsonFn.clone([from, to]);
      let result = await staffReport(from, to);
      cb(result)
    })
  })
}
