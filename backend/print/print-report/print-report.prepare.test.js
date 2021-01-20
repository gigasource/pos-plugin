async function preparePrintReport(cms) {
	await cms.orm('EndOfDay').remove()
	await require('./index')(cms)
}

module.exports = {
	preparePrintReport
}
