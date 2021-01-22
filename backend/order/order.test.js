const syncFlow = require("schemahandler/sync/sync-flow");
const syncPlugin = require("schemahandler/sync/sync-plugin-multi")
const syncTranspoter = require('schemahandler/sync/sync-transporter')

jest.setTimeout(60000)

const {
	prepareOrderTest,
	checkOrderCreated
} = require('./order.prepare.test')

const { cmsFactory } = require('../../test-utils')
let cms = cmsFactory('orderTest')
let feSocket
const mockActionList = require('./mockActionList.json')

beforeAll(async () => {
	await cms.init()
	await prepareOrderTest(cms)
	cms.triggerFeConnect()
	cms.orm.plugin(syncPlugin)
	cms.orm.plugin(syncFlow)
	cms.orm.plugin(syncTranspoter)
	feSocket = cms.feSocket
	cms.orm.emit('commit:flow:setMaster', true)
})

beforeEach(async () => {
	await cms.orm('Order').remove({}).direct()
	await cms.orm('Commit').remove({}).direct()
})

describe('Order test', function () {
	it('Case 1: Emit print-to-kitchen normally', async (done) => {
		const spy = jest.spyOn(global, 'setTimeout')
		feSocket.emit('print-to-kitchen', mockActionList, { _id: "5fee660055ffda39f723e225" })
		feSocket.on('update-table', async function () {
			await checkOrderCreated(cms.orm)
			expect(spy).toBeCalled()
			done()
		})
	})

	it('Case 2: Emit print-to-kitchen with timeout', async (done) => {
		const spy = jest.spyOn(global, 'setTimeout')
		const cb = async function (commit) {
			if (commit.data.isLastCommit) {
				this.stop()
			}
		}
		cms.orm.on('update:Commit:c', -1, cb)
		feSocket.on('update-table', async function () {
			await checkOrderCreated(cms.orm)
			expect(spy).toBeCalled()
			done()
		})
		feSocket.emit('print-to-kitchen', mockActionList, { _id: "5fee660055ffda39f723e225" })
	})
})
