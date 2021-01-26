const {xReport} = require("./report-x-report-logic");
const {eodReport} = require('./report-eod-logic')
const {eodReportCalender} = require('./report-eod-calender-logic')

module.exports = function (cms) {
  cms.socket.on('connect', (socket) => {
    socket.on('get-eod-report-calender', async function (from, to, cb) {
      let result = await eodReportCalender(from, to);
      cb(result)
    })

    socket.on('get-x-report', async function (from, to, cb) {
      let result = await xReport(from, to);
      cb(result)
    })

    socket.on('make-eod-report', async function (from, to, cb) {
      let result = await xReport(from, to);
      cb(result)
    })
  })
}
