const { stringify } = require('schemahandler/utils')
const { cmsFactory } = require('../../../test-utils')
const moment = require('moment')
const {
	printInvoiceHandler
} = require('./report-index')
const {
	prepareDb
} = require('../../order-logic/report.prepare.test')

const cms = cmsFactory('testPrintReport')

global.cms = cms

jest.setTimeout(60000)

describe('Test print report', function () {
	beforeAll(async () => {
		await cms.init('')
		await require('./report-index')(cms)
		await prepareDb(cms.orm)
	})

	it('Case 1: Test EOD report printer', async () => {
		printInvoiceHandler('ZReport')
	})

	it('Case 2: Month report', async () => {
		printInvoiceHandler('MonthlyReport')
	})

	it('Case 3: Staff report', async () => {
		printInvoiceHandler('StaffReport', {staffName: 'Waiter 1', from: moment('04.01.2021', 'DD.MM.YYYY').toDate(), to: moment('06.01.2021', 'DD.MM.YYYY').toDate()})
	})

	// todo: Finish x report
	it('Case 4: X report', async () => {
		printInvoiceHandler('XReport', {from: moment('04.01.2021', 'DD.MM.YYYY').toDate(), to: moment('07.01.2021', 'DD.MM.YYYY').toDate()})
	})
})
