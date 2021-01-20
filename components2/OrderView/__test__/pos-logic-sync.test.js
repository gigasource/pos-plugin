//<editor-fold desc="declare">
import {
	addPayment,
	cancelOrder,
	changeCourse,
	clearPayment,
	removeItem,
	removeModifier,
	updateItem,
	hooks,
	simulateBackendPrint,
	changeItemQuantity
} from "../pos-logic";
import { nextTick } from "vue";

import {
	addProduct,
	orderBeFactory
} from '../pos-logic-be'
import {mockProducts} from "./mock_products";

const orderMaster = orderBeFactory(2)
const orderClient = orderBeFactory(3)

const { syncFactory } = require('../../../test-utils')
const { stringify } = require('schemahandler/utils')

jest.setTimeout(60000)

//<editor-fold desc="prepare test">
const {
	prepareActionCommitTest
} = require('../../../backend/commit/actionCommit.prepare.test')
const {
	prepareOrderTest,
	checkOrderCreated
} = require('../../../backend/order/order.prepare.test')
const {
	prepareOrderCommit
} = require('../../../backend/commit/orderCommit.prepare.test')
//</editor-fold>

let cms
//</editor-fold>

/**
 * cms[0] always is master
 */
beforeAll(async () => {
	cms = await syncFactory('posLogicSync', 2)

	for (let _cms of cms) {
		prepareActionCommitTest(_cms)
		prepareOrderCommit(_cms)
		prepareOrderTest(_cms)
		_cms.triggerFeConnect()
	}
})

beforeEach(async () => {
	for (let _cms of cms) {
		await _cms.orm('Order').remove({}).direct()
		await _cms.orm('Commit').remove({}).direct()
		await _cms.orm('Action').remove({}).direct()
	}
})

/**
 * cms[0] ~ orderMaster
 * cms[1] ~ orderClient
 */
describe('Pos logic sync', function () {
	it('Case 1: Create order + addProduct in master', async (done) => {
		orderMaster.prepareOrder('10')
		const order1 = orderMaster.getCurrentOrder()
		orderClient.prepareOrder('10')
		const order2 = orderClient.getCurrentOrder()
		cms[1].feSocket.on('update-table', async function (order) {
			await checkOrderCreated(cms[0].orm)
			await checkOrderCreated(cms[1].orm)
			await orderClient.syncOrderChange(order)
			expect(stringify(orderMaster.getCurrentOrder())).toMatchSnapshot()
			expect(stringify(orderClient.getCurrentOrder())).toMatchSnapshot()
			expect(stringify(orderClient.actionList.value)).toMatchSnapshot()
			done()
		})
		await nextTick()
		addProduct(order1, mockProducts[0])
		addProduct(order2, mockProducts[1])
		await nextTick()
		expect(stringify(orderMaster.actionList.value)).toMatchSnapshot()
		expect(stringify(orderClient.actionList.value)).toMatchSnapshot()
		await nextTick()
		simulateBackendPrint(order2)
		cms[0].feSocket.emit('print-to-kitchen', orderMaster.actionList.value, order1);
		await nextTick()
	})
})
