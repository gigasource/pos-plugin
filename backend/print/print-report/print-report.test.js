const { stringify } = require('schemahandler/utils')
const { cmsFactory } = require('../../../test-utils')
const moment = require('moment')
const {
	preparePrintReport
} = require('./print-report.prepare.test')
const {
	printInvoiceHandler
} = require('./index')
const {
	prepareDb
} = require('../../order-logic/report.prepare.test')

const cms = cmsFactory('testPrintReport')

global.cms = cms

jest.setTimeout(60000)

describe('Test print report', function () {
	beforeAll(async () => {
		await cms.init('')
		await preparePrintReport(cms)
		await prepareDb(cms.orm)
	})

	it('Case 1: Test EOD report printer', async () => {
		const result = printInvoiceHandler('ZReport')
		expect(stringify(result)).toMatchSnapshot()
	})

	it('Case 2: Month report', async () => {
		const result = printInvoiceHandler('MonthlyReport')
	})

	it('Case 3: Staff report', async () => {
		const result = printInvoiceHandler('StaffReport', {staffName: 'Waiter 1', from: moment('04.01.2021', 'DD.MM.YYYY').toDate(), to: moment('06.01.2021', 'DD.MM.YYYY').toDate()})
	})
})
