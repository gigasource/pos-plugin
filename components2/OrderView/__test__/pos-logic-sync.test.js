//<editor-fold desc="declare">
import {
  addPayment,
  cancelOrder,
  changeCourse,
  clearPayment,
  removeItem,
  removeModifier,
  updateItem,
  hooks as orderHooks,
  simulateBackendPrint,
  changeItemQuantity, createOrder
} from "../pos-logic";
require('initPrint').init(__dirname);
import {nextTick} from "vue";
import delay from "delay";

import {
  addProduct,
  orderBeFactory
} from '../pos-logic-be'
//import {mockProducts} from "./mock_products";
let mockProducts, cola, pepsi, water, soda;
import _ from 'lodash';
import {ObjectID} from "bson";

const orderMaster = orderBeFactory(2)
const orderClient = orderBeFactory(3)

const {syncFactory} = require('../../../test-utils')
const {stringify} = require('schemahandler/utils')

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
require("mockdate").set(new Date("2021-01-01").getTime());

//</editor-fold>

let cmsList
//</editor-fold>

/**
 * cms[0] always is master
 */
beforeAll(async () => {
  cmsList = await syncFactory('posLogicSync', 2)

  for (let _cms of cmsList) {
    await _cms.init()
    prepareActionCommitTest(_cms)
    prepareOrderCommit(_cms)
    prepareOrderTest(_cms)
    _cms.triggerFeConnect()
    if (!mockProducts) {
      _cms.orm.registerSchema('Product', {
        groupPrinter: {type: ObjectID, autopopulate: true, ref: 'GroupPrinter'},
        groupPrinter2: {type: ObjectID, autopopulate: true, ref: 'GroupPrinter'}
      })
      mockProducts = await _cms.orm('Product').find();
      [cola, pepsi, water, soda] = mockProducts;
    }
  }
})


beforeEach(async () => {
  for (let _cms of cmsList) {
    await _cms.orm('Order').remove({}).direct()
    await _cms.orm('Commit').remove({}).direct()
    await _cms.orm('Action').remove({}).direct()
  }
})

const convert = actionList => {
  return actionList.value.filter(i => i.action[0].fn === 'findOneAndUpdate' && i.action[0].args[1].$push).map(i => i.action[0].args[1].$push.items)
}

/**
 * cms[0] ~ orderMaster
 * cms[1] ~ orderClient
 */
describe('Pos logic sync', function () {
  it('Case 1: Create order + addProduct in master', async (done) => {
    orderMaster.prepareOrder('10')
    let order1 = createOrder();
    addProduct(order1, water, 2);
    await nextTick()
    simulateBackendPrint(order1);
    await cmsList[0].orm('Order').create(order1);
    orderMaster.prepareOrder(order1);
    order1 = orderMaster.getCurrentOrder()
    orderClient.prepareOrder(_.cloneDeep(order1));
    const order2 = orderClient.getCurrentOrder()
    cmsList[1].feSocket.on('update-table', async function (order) {
      console.log('update-table');
      await checkOrderCreated(cmsList[0].orm)
      await checkOrderCreated(cmsList[1].orm)
      await orderClient.syncOrderChange(order)
      //todo: fix condition :uuid
      expect(stringify(orderMaster.getCurrentOrder())).toMatchSnapshot()
      expect(stringify(orderClient.getCurrentOrder())).toMatchSnapshot()
      expect(stringify(orderClient.actionList.value)).toMatchSnapshot()
      await delay(500);
      done()
    })
    await nextTick()
    addProduct(order1, cola)

    await nextTick()
    addProduct(order1, soda, 2)
    await nextTick()
    removeItem(order1, 0, 1);
    await nextTick()
    changeItemQuantity(order2, 0, 2);
    addProduct(order2, pepsi)
    await nextTick()
    expect(stringify(convert(orderMaster.actionList))).toMatchSnapshot()
    expect(stringify(orderClient.actionList.value)).toMatchSnapshot()
    await nextTick()
    //simulateBackendPrint(order1)
    //use hooks by pos-logic-be
    let recent = {
      items: orderMaster.getRecentItems(),
      cancellationItems: orderMaster.getRecentCancellationItems()
    }

    cmsList[0].feSocket.emit('print-to-kitchen', orderMaster.actionList.value, order1, recent, 'Terminal 1');
    await nextTick()
    await delay(1000);
  })
})
