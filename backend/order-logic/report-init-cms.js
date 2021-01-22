const { eodReport } = require('./report-eod-logic')
const { eodReportCalender } = require('./report-eod-calender-logic')

module.exports = function (cms) {
	cms.socket.on('connect', (socket) => {
		socket.on('get-eod-report-calender', async function (from, to, cb) {
			cb(await eodReportCalender(from, to))
		})
	})
}
