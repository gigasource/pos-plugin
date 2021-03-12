//<editor-fold desc="declare">
require('initPrint').init(__dirname, ['bon1.png', 'bon2.png']);

jest.mock('cms', () => {
  const {cmsFactory} = require('../../../test-utils')
  const _cms = cmsFactory('inventoryDom')
  global.cms = _cms
  return {
    socket: _cms.feSocket,
    getModel: function (modelName) {
      return _cms.orm(modelName)
    }
  }
})

import "../../../jest.setup";
import {nextTick} from "vue";
import _ from "lodash";
import {
  addSinglePayment,
  changeCourse,
  changeItemQuantity, getRestTotal,
  hooks, makeLastItemTakeaway,
  removeItem,
  removeModifier,
  simulateBackendPrint,
  updateItem
} from "../pos-logic";
import {
  actionList,
  actionList2,
  addProduct,
  cancelSplitOrder,
  createPrintAction,
  currentTable,
  disablePay,
  finishMoveItemsOrder,
  finishSplitOrder,
  getCurrentOrder,
  getRecentCancellationItems,
  getRecentItems,
  getSecondOrder,
  itemQuantityChangeCheck,
  makeSplitOrder,
  moveItemToSecondOrder,
  onlyCheckoutPrintedItems,
  order2,
  payBtnClickable,
  payPrintMode,
  prepareMoveItemsOrder,
  prepareOrder,
  prepareSecondOrder,
  quickBtnAction,
  returnItem,
  showIcon,
  togglePayPrintBtn, toggleRefundOrder,
  makeActionList, makeRefundOrder
} from "../pos-logic-be";
import '../../AppSharedStates.js'
import {mockProduct} from "./mock_product";
import {mockOrder} from "./mock-order";
import {mockProducts} from "./mock_products";

const {Socket, Io} = require("schemahandler/io/io");

const syncFlow = require("schemahandler/sync/sync-flow");
const syncPlugin = require("schemahandler/sync/sync-plugin-multi");
const {stringify} = require("schemahandler/utils");
const Hooks = require("schemahandler/hooks/hooks");
const {cmsFactory} = require("../../../test-utils");

// These requires must be after globalHooks initialization
const {
  prepareActionCommitTest
} = require('../../../backend/commit/actionCommit.prepare.test')
const {
  prepareOrderTest,
  checkOrderCreated
} = require('../../../backend/order/order.prepare.test')
const {
  prepareKitchenPrinter
} = require('../../../backend/print/print-kitchen/kitchen-printer.prepare.test')

//jest.useFakeTimers("modern").setSystemTime(new Date("2021-01-01").getTime());
require("mockdate").set(new Date("2021-01-01").getTime());

const {
  makeDiscount,
  makeTakeaway,
  addModifier,
  addItem,
  createOrder,
  makeLastItemDiscount
} = require("../pos-logic");

//const cms = cmsFactory('posLogicBe')
//global.cms = cms
const cms = global.cms;
const {orm, feSocket} = cms

import delay from "delay";

let cola, pepsi, water, soda;
const ketchup = {name: "Add Ketchup", price: 3, quantity: 1};

jest.setTimeout(60000)

beforeAll(async () => {
  await cms.init()
  orm.registerSchema("Order", {
    items: [{}]
  });
  await orm("Order").deleteMany();
  await orm("Commit").deleteMany();

  orm.plugin(syncPlugin);
  orm.plugin(syncFlow);
  orm.registerCommitBaseCollection("Order");
  orm.plugin(require("../../../backend/commit/orderCommit"));
  orm.registerCollectionOptions("Order");
  orm.emit("commit:flow:setMaster", true);
  prepareActionCommitTest(cms)
  prepareOrderTest(cms)
  prepareKitchenPrinter(cms)
  cms.triggerFeConnect();
  let mockProducts = await orm('Product').find();
  [cola, pepsi, water, soda] = mockProducts;
});

afterEach(async () => {
  await orm("Order")
    .deleteMany()
    .direct();
  await orm("Commit")
    .deleteMany()
    .direct();
});

let actions = [];
["showOrderReceipt", "pay", "printOrder"].forEach(e =>
  hooks.on(e, () => actions.push(e))
);
let expectArray = () => [
  "payBtnClickable",
  payBtnClickable.value,
  "payPrintMode",
  payPrintMode.value,
  "showIcon",
  showIcon.value,
  "disablePay",
  disablePay.value,
  actions
];
//</editor-fold>

describe("pos-logic", function () {
  it("Create duplicate order", async () => {
    const m1 = await orm("Order")
      .create({table: 10, items: [], status: "inProgress"})
      .commit("createOrder");

    expect(stringify(m1)).toMatchInlineSnapshot(`
      Object {
        "_id": "ObjectID",
        "items": Array [],
        "status": "inProgress",
        "table": 10,
      }
    `);

    const m2 = await orm("Order")
      .create({table: 10, items: [], inProgress: true})
      .commit("createOrder");

    expect(m2).toMatchInlineSnapshot(`undefined`);
  });

  it("case 2a: create Order + addProduct", async function () {
    prepareOrder("10");
    const order = getCurrentOrder();
    await nextTick();
    addProduct(order, mockProduct);
    await nextTick();
    expect(stringify(actionList.value)).toMatchSnapshot();
  });

  it("case 2b: create Order + add 2 products", async function () {
    prepareOrder("10");
    const order = getCurrentOrder();
    await nextTick();
    addProduct(order, mockProduct);
    await nextTick();
    addProduct(order, mockProduct);
    await nextTick();
    expect(stringify(actionList.value)).toMatchSnapshot();
  });

  it("case 2c: create Order + addModifier", async function () {
    prepareOrder("10");
    const order = getCurrentOrder();
    await nextTick();
    addProduct(order, mockProduct);
    await nextTick();
    //actionList.value.length = 0;
    addModifier(order, ketchup);
    await nextTick();
    //expect(stringify(actionList.value)).toMatchSnapshot();

    for (const action of _.cloneDeep(actionList.value)) {
      await orm.execChain({name: action.modelName, chain: action.action}, true);
    }
    const _order = await orm("Order").findOne();
    expect(stringify(_order)).toMatchSnapshot();
  });

  it("case 2d: create Order + removeModifier", async function () {
    prepareOrder("10");
    const order = getCurrentOrder();
    await nextTick();
    addProduct(order, mockProduct);
    await nextTick();
    addModifier(order, ketchup);
    await nextTick();
    actionList.value.length = 0;
    removeModifier(order, 0, 0);
    await nextTick();
    expect(stringify(actionList.value)).toMatchSnapshot();
  });

  it('case 2e: create order + add 2 different items', async function () {
    prepareOrder("10");
    const order = getCurrentOrder();
    await nextTick();
    addProduct(order, mockProducts[0]);
    await nextTick();
    addProduct(order, mockProducts[1]);
    await nextTick();
    expect(stringify(actionList.value)).toMatchSnapshot();
  })

  it("case 2f: load order + load order", async function () {
    const order1 = createOrder();
    addItem(order1, cola);
    simulateBackendPrint(order1);

    prepareOrder(order1);
    const order = getCurrentOrder();
    await nextTick();
    addProduct(order, pepsi);
    await nextTick();
    removeItem(order, 0 , 1)
    await hooks.emit('printOrder');

    expect(stringify(actionList.value)).toMatchSnapshot();

    prepareOrder('10');
    await nextTick();
  });

  //todo: remove modifiers

  it("case 3: updateItem", async function () {
    prepareOrder("10");
    const order = getCurrentOrder();
    await nextTick();
    addProduct(order, mockProduct);
    await nextTick();
    actionList.value.length = 0;
    updateItem(order, 0, {quantity: 10, course: 3});
    await nextTick();
    expect(stringify(actionList.value)).toMatchSnapshot();
  });

  //todo: test integration discount -> backend -> query snapshot
  it("case 4: discount", async function () {
    prepareOrder("10");
    const order = getCurrentOrder();
    await nextTick();
    addProduct(order, mockProduct);
    await nextTick();
    makeDiscount(order, "50%");
    await nextTick();
    await nextTick();
    expect(stringify(actionList.value)).toMatchSnapshot();
    for (const chain of _.cloneDeep(actionList.value)) {
      await orm.execChain({name: "Order", chain: chain}, true);
    }
    const _order = await orm("Order").findOne();
    expect(stringify(_order)).toMatchSnapshot();
  });

  it("case 5: change course", async function () {
    prepareOrder("10");
    const order = getCurrentOrder();
    await nextTick();
    addProduct(order, mockProduct);
    await nextTick();
    changeCourse(order, 0, -1);
    await nextTick();
    expect(stringify(actionList.value)).toMatchSnapshot();
  });

  it("case 6: removeItem", async function () {
    prepareOrder("10");
    const order = getCurrentOrder();
    await nextTick();
    addProduct(order, mockProduct);
    await nextTick();
    actionList.value.length = 0;
    removeItem(order, 0, 1);
    await nextTick();
    expect(stringify(actionList.value)).toMatchSnapshot();
  });

  it("case 7: currentTable", async function () {
    prepareOrder("10");
    let order = getCurrentOrder();
    await nextTick();

    prepareOrder("12");
    order = getCurrentOrder();
    await nextTick();

    expect(currentTable.value).toMatchInlineSnapshot(`"12"`);
  });

  it("case 8: logic-ui", async function () {
    prepareOrder("10");
    let order = getCurrentOrder();
    await nextTick();
    addProduct(order, mockProduct);
    await nextTick();
    simulateBackendPrint(order);
    await nextTick();

    expect(expectArray()).toMatchInlineSnapshot(`
      Array [
        "payBtnClickable",
        true,
        "payPrintMode",
        "print",
        "showIcon",
        false,
        "disablePay",
        true,
        Array [],
      ]
    `);

    quickBtnAction.value = "receipt";
    onlyCheckoutPrintedItems.value = false;
    togglePayPrintBtn();
    togglePayPrintBtn();
    await nextTick();
    expect(expectArray()).toMatchInlineSnapshot(`
      Array [
        "payBtnClickable",
        true,
        "payPrintMode",
        "print",
        "showIcon",
        false,
        "disablePay",
        false,
        Array [
          "printOrder",
        ],
      ]
    `);
  });

  it("case 9: order from backend: change quantity", async function () {
    prepareOrder(mockOrder);
    let order = getCurrentOrder();
    await nextTick();
    changeItemQuantity(order, 0, 1);
    await nextTick();
    // h làm cho items -> compare to snapshot ở hàm payBtnClickable

    expect(itemQuantityChangeCheck(order.items[0])).toMatchInlineSnapshot(
      `true`
    );
    //disable pay = true moi dung
    expect(expectArray()).toMatchInlineSnapshot(`
      Array [
        "payBtnClickable",
        true,
        "payPrintMode",
        "print",
        "showIcon",
        false,
        "disablePay",
        true,
        Array [],
      ]
    `);
  });

  it("case 9 b: order: cancel item from backend", async function () {
    prepareOrder(mockOrder);
    let order = getCurrentOrder();
    await nextTick();
    //addProduct(order, mockProduct, 3);
    //changeItemQuantity(order, 0, 1);
    await nextTick();
    removeItem(order, 0, 1);

    expect([order.items.length, order.cancellationItems.length])
      .toMatchInlineSnapshot(`
      Array [
        0,
        1,
      ]
    `);
  });

  it("case 9 c: order: cancel item from backend remove all", async function () {
    prepareOrder(mockOrder);
    let order = getCurrentOrder();
    await nextTick();
    //addProduct(order, mockProduct, 3);
    changeItemQuantity(order, 0, 3);
    await nextTick();
    removeItem(order, 0, 1);

    expect([order.items.length, order.cancellationItems.length])
      .toMatchInlineSnapshot(`
      Array [
        1,
        0,
      ]
    `);
  });

  it("case 9 d: order: cancel item not from backend", async function () {
    let order = getCurrentOrder();
    await nextTick();
    addProduct(order, mockProduct, 3);
    //changeItemQuantity(order, 0, 3);
    await nextTick();
    removeItem(order, 0, 1);

    expect([order.items.length, order.cancellationItems.length])
      .toMatchInlineSnapshot(`
      Array [
        1,
        0,
      ]
    `);
  });

  it("case 9 e: order: recent items", async function () {
    prepareOrder(mockOrder);
    let order = getCurrentOrder();
    await nextTick();
    addProduct(order, mockProduct, 3);
    //changeItemQuantity(order, 0, 3);
    await nextTick();
    removeItem(order, 0, 1);
    await nextTick();

    expect(stringify(getRecentItems())).toMatchInlineSnapshot(`
      Array [
        Object {
          "_id": "ObjectID",
          "course": 1,
          "groupPrinter": "Bar",
          "id": "48",
          "name": "Whiskey",
          "price": 40,
          "product": "ObjectID",
          "quantity": 3,
          "tax": 19,
          "taxes": Array [
            19,
            7,
          ],
          "vSum": 120,
          "vTakeAway": false,
          "vTaxSum": Object {
            "19": Object {
              "gross": 120,
              "net": 100.84,
              "tax": 19.16,
            },
          },
        },
      ]
    `);
    expect(stringify(getRecentCancellationItems())).toMatchInlineSnapshot(`
      Array [
        Object {
          "_id": "ObjectID",
          "course": 1,
          "groupPrinter": "Bar",
          "id": "48",
          "name": "Whiskey",
          "originalQuantity": 1,
          "price": 40,
          "printed": true,
          "product": "ObjectID",
          "quantity": 1,
          "sent": true,
          "tax": 19,
          "taxes": Array [
            19,
            7,
          ],
          "vSum": 40,
          "vTakeAway": false,
          "vTaxSum": Object {
            "19": Object {
              "gross": 40,
              "net": 33.61,
              "tax": 6.39,
            },
          },
        },
      ]
    `);
  });

  it("case 10: order from backend: cancel item", async function () {
    prepareOrder(mockOrder);
    let order = getCurrentOrder();
    await nextTick();
    removeItem(order, 0, 1);
    //changeItemQuantity(order, 0, 1);
    await nextTick();

    expect(expectArray()).toMatchInlineSnapshot(`
      Array [
        "payBtnClickable",
        false,
        "payPrintMode",
        "print",
        "showIcon",
        false,
        "disablePay",
        true,
        Array [],
      ]
    `);
  });

  it("case 11: factory test", async function () {
    prepareSecondOrder("10");
    const order = getSecondOrder();
    await nextTick();
    addProduct(order, mockProduct);
    await nextTick();
    expect(stringify(actionList2.value)).toMatchSnapshot();
  });

  //todo: move items
  //todo: split order
  it("case 12: split order: cancel", async function () {
    prepareOrder("10");
    const order = getCurrentOrder();
    await nextTick();
    addProduct(order, mockProduct);
    await nextTick();
    changeItemQuantity(order, 0, 2);
    await nextTick();

    //todo: clone order:
    await makeSplitOrder();
    await nextTick();
    moveItemToSecondOrder(0);
    await nextTick();
    moveItemToSecondOrder(0);
    await nextTick();
    cancelSplitOrder();
    expect(stringify([order, order2])).toMatchSnapshot();
  });

  it("case 12 a: split order one time snapshot", async function () {
    prepareOrder("10");
    const order = getCurrentOrder();
    await nextTick();
    addProduct(order, mockProduct);
    await nextTick();
    changeItemQuantity(order, 0, 2);
    await nextTick();

    actionList.value.length = 0;
    //begin split
    await makeSplitOrder();
    await nextTick();
    moveItemToSecondOrder(0);
    await nextTick();
    moveItemToSecondOrder(0);
    await nextTick();
    finishSplitOrder();
    await nextTick();
    expect(stringify(actionList2.value)).toMatchSnapshot();
  });

  it("case 12 b: split order", async function () {
    prepareOrder("10");
    const order = getCurrentOrder();
    await nextTick();
    addProduct(order, mockProduct);
    await nextTick();
    //changeItemQuantity(order, 0, 2);
    await nextTick();

    //todo: clone order:
    await makeSplitOrder();
    await nextTick();
    moveItemToSecondOrder(0);
    await nextTick();
    const a = order2;
    returnItem(0);
    await nextTick();
    expect(stringify([order, order2])).toMatchSnapshot();

    expect(stringify(actionList2.value)).toMatchSnapshot();
  });

  it("case 13 a: move items : inProgress order", async function () {
    prepareOrder("10");
    const order = getCurrentOrder();
    await nextTick();
    addProduct(order, mockProduct, 3);
    await nextTick();
    simulateBackendPrint(order);
    const orderTable10 = _.cloneDeep(order);

    prepareOrder("15");
    addProduct(order, mockProduct, 5);

    //todo: clone order:
    //problems: can not use items here ->
    prepareMoveItemsOrder();
    await nextTick();
    moveItemToSecondOrder(0);
    await nextTick();
    //returnItem(0)
    await nextTick();
    finishMoveItemsOrder(orderTable10);
    await nextTick();
    expect(stringify([order, order2])).toMatchSnapshot();

    expect(stringify(actionList2.value)).toMatchSnapshot();
  });

  it("case 14a: create Order + addProduct + togglePrint + printToKitchen", async function (done) {
    prepareOrder("10");
    const order = getCurrentOrder();
    await nextTick();
    const _mockProduct = _.cloneDeep(mockProduct)
    _mockProduct.groupPrinter.name = "Kitchen"
    addProduct(order, _mockProduct);
    await nextTick();
    console.log(actionList.value)
    expect(stringify(actionList.value)).toMatchSnapshot();
    createPrintAction('kitchenAdd', order, actionList.value)
    cms.once('run:print', function (commit) {
      expect(stringify(actionList.value)).toMatchSnapshot();
      expect(stringify(commit)).toMatchSnapshot()
      checkOrderCreated(cms.orm)
      done()
    })
    //todo: add code to frontend
    feSocket.emit('print-to-kitchen', actionList.value, order)
  });

  it("case 15a: print to kitchen", async function (done) {
    prepareOrder("10");
    const order = getCurrentOrder();
    await nextTick();
    const _mockProduct = _.cloneDeep(mockProduct)
    _mockProduct.groupPrinter.name = "Kitchen"
    addProduct(order, _mockProduct, 2);
    addModifier(order, ketchup);
    await nextTick();
    removeItem(order, 0, 1, true);
    await nextTick();
    console.log(actionList.value)
    cms.once('run:print', async function (commit) {
      expect(stringify(actionList.value)).toMatchSnapshot();
      expect(stringify(commit)).toMatchSnapshot()
      await checkOrderCreated(cms.orm)
      await delay(1000);
      done()
    })
    hooks.emit('printOrder')
    //todo: add code to frontend
  });

  it("case 15b: pay", async function (done) {
    require('initPrint').setFiles(['15b_1.png', '15b_2.png']);
    prepareOrder("10");
    const order = getCurrentOrder();
    await nextTick();
    const _mockProduct = _.cloneDeep(mockProduct)
    _mockProduct.groupPrinter.name = "Kitchen"
    addProduct(order, _mockProduct, 2);
    await nextTick();
    addModifier(order, ketchup);
    await nextTick();
    removeItem(order, 0, 1, true);
    await nextTick();
    addSinglePayment(order, {type: "cash", value: getRestTotal(order) + 5});
    await nextTick();
    cms.once('run:print', async function (commit) {
      expect(stringify(actionList.value)).toMatchSnapshot();
      expect(stringify(commit)).toMatchSnapshot()
      await checkOrderCreated(cms.orm)
      await delay(1000);
      done()
    })
    hooks.emit('pay', true)
    //todo: add code to frontend
  });

  it("case 15c: print to kitchen", async function (done) {
    prepareOrder("10");
    const order = getCurrentOrder();
    await nextTick();
    const _mockProduct = _.cloneDeep(mockProduct)
    _mockProduct.groupPrinter.name = "Kitchen"
    addProduct(order, _mockProduct, 2);
    await nextTick()
    addModifier(order, ketchup);
    await nextTick()
    makeLastItemTakeaway(order);
    await nextTick();
    console.log(actionList.value)
    cms.once('run:print', async function (commit) {
      const orders = await orm('Order').find({});
      done();
    })
    hooks.emit('printOrder')
    //todo: add code to frontend
  });

  it("case 16: split order intergrate", async function () {
    require('initPrint').setFiles(['16_1.png', '16.png']);
    prepareOrder("10");
    const order = getCurrentOrder();
    await nextTick();
    addItem(order, cola, 2);
    await nextTick();
    removeItem(order, 0, 1, true);
    await nextTick();
    addItem(order, fanta, 1);
    await nextTick();

    //begin split
    await makeSplitOrder();
    await nextTick();
    moveItemToSecondOrder(0)
    await nextTick();
    const a = order;
    addSinglePayment(order2, {type: "cash", value: getRestTotal(order2)});
    await nextTick();
    //expect(stringify(_.omit(actionList2.value, ['splitId']))).toMatchSnapshot();
    //todo: pay
    //todo: problem: update old order, print invoice for split order
    await hooks.emit('pay-split', true);
    const orders = await orm('Order').find({});
    expect(orders).toMatchSnapshot();
    await delay(1000);
  });

  it('Case 17: refund order', async function () {
    prepareOrder("10");
    const order = getCurrentOrder();
    await nextTick();
    addProduct(order, mockProducts[0]);
    await nextTick();
    addProduct(order, mockProducts[1])
    await nextTick()
    //actionList.value.length = 0;
    //expect(stringify(actionList.value)).toMatchSnapshot();
    await makeActionList()
    for (const action of _.cloneDeep(actionList.value)) {
      await orm.execChain({name: action.modelName, chain: action.action}, true);
    }
    const _order = await orm("Order").findOne();
    expect(stringify(_order)).toMatchSnapshot();
    const refundOrder = makeRefundOrder(order)
    changeItemQuantity(refundOrder, 0, 1)
    await nextTick()
    await toggleRefundOrder(refundOrder)
    const _orderAfterRefund = await orm('Order').find()
    expect(stringify(_orderAfterRefund)).toMatchSnapshot()
  })

  it("case 17a: refund order", async function() {
    const order = createOrder();
    addItem(order, mockProducts[0], 5);
    await nextTick();
    addItem(order, mockProducts[1], 10);
    await nextTick();
    const refundOrder = makeRefundOrder(order);
    await nextTick();
    expect(refundOrder._id).not.toEqual(order._id);
    expect(stringify(refundOrder)).toMatchSnapshot();
  });
});
