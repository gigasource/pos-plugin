//<editor-fold desc="declare">
import {cola, makeWrapper, orm, wrapper} from "../../test-utils";

jest.mock('cms', () => {
  process.env.USE_GLOBAL_ORM = true
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
const cms = global.cms;

import {nextTick} from "vue";

import {addProduct, getCurrentOrder, prepareOrder} from "../pos-logic-be";

import {mockProduct} from "./mock_product";
import {mockOrder} from "./mock-order";
import Order2 from "../Order2";
import {orderLayout} from "../pos-ui-shared";
import {demoData} from "./demoData";
import PosOrderLayout from "../PosOrderLayout";
import {isMobile} from "../../AppSharedStates";
import PosOrderReceipt2 from "../Helper/PosOrderReceipt2";
import {addSinglePayment, genSplitId, getRestTotal, simulateBackendPrint} from "../pos-logic";

const {stringify} = require("schemahandler/utils");

const {
  makeDiscount,
  makeTakeaway,
  addModifier,
  addItem,
  createOrder,
  makeLastItemDiscount
} = require("../pos-logic");

const delay = require("delay");

//</editor-fold>

describe("order-view test", function () {
  beforeAll(async () => {
    await cms.init()
    await orm("PosSetting").remove({});
    await orm("PosSetting").create(demoData.PosSetting[0]);
    await orm("OrderLayout").remove({});
    await orm("OrderLayout").create(demoData.OrderLayout[0]);
  });
  it("case 1 integration", async function () {
    //order have 1 sent item, add one item -> should display print,
    prepareOrder(mockOrder);
    let order = getCurrentOrder();
    addProduct(order, mockProduct);
    orderLayout.value = demoData.OrderLayout[0];
    isMobile.value = true;
    makeWrapper(Order2, {shallow: false});
    await nextTick();
    await delay(50);
    expect(wrapper.html()).toMatchSnapshot();
  }, 80000);

  it("case 2 orderLayout", async function () {
    //order have 1 sent item, add one item -> should display print,
    prepareOrder(mockOrder);
    let order = getCurrentOrder();
    addProduct(order, mockProduct);
    orderLayout.value = demoData.OrderLayout[0];
    makeWrapper(PosOrderLayout, {shallow: true});
    await nextTick();
    await delay(50);
    expect(wrapper.html()).toMatchSnapshot()
  }, 80000);

  it('case 3: split payment', async function () {
    let order, splitId;
    for (const i of [1]) {
      order = createOrder();
      await nextTick();
      addItem(order, cola, 3);
      await nextTick();
      if (!splitId) {
        genSplitId(order);
        splitId = order.splitId;
      } else {
        order.splitId = splitId;
      }
      addSinglePayment(order, {type: 'cash', value: getRestTotal(order)});
      await nextTick();
      simulateBackendPrint(order);
      await nextTick();
      await orm('Order').create(order);
    }
    const orders = await orm('Order').find();
    makeWrapper(PosOrderReceipt2, {
      shallow: false, props: {
        modelValue: true,
        split: true,
        splitOrders: orders
      }
    });
    expect(wrapper.html()).toMatchSnapshot()
  })
});
