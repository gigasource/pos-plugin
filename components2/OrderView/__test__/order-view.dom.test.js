//<editor-fold desc="declare">
import {makeWrapper, orm, wrapper} from "../../test-utils";

import {nextTick} from "vue";

import {addProduct, getCurrentOrder, prepareOrder} from "../pos-logic-be";

import {mockProduct} from "./mock_product";
import {mockOrder} from "./mock-order";
import Order2 from "../Order2";
import {orderLayout} from "../pos-ui-shared";
import {demoData} from "./demoData";
import PosOrderLayout2 from "../PosOrderLayout2";
import {isMobile} from "../../AppSharedStates";

const { stringify } = require("schemahandler/utils");

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

describe("order-view test", function() {
  beforeAll(async () => {
    await orm("PosSetting").remove({});
    await orm("PosSetting").create(demoData.PosSetting[0]);
    await orm("OrderLayout").remove({});
    await orm("OrderLayout").create(demoData.OrderLayout[0]);
  });
  it("case 1 integration", async function() {
    //order have 1 sent item, add one item -> should display print,
    prepareOrder(mockOrder);
    let order = getCurrentOrder();
    addProduct(order, mockProduct);
    orderLayout.value = demoData.OrderLayout[0];
    isMobile.value = true;
    makeWrapper(Order2, { shallow: false });
    await nextTick();
    await delay(50);
    expect(wrapper.html()).toMatchSnapshot();
  }, 80000);

  it("case 2 orderLayout", async function() {
    //order have 1 sent item, add one item -> should display print,
    prepareOrder(mockOrder);
    let order = getCurrentOrder();
    addProduct(order, mockProduct);
    orderLayout.value = demoData.OrderLayout[0];
    makeWrapper(PosOrderLayout2, { shallow: true });
    await nextTick();
    await delay(50);
    expect(wrapper.html()).toMatchSnapshot()
  }, 80000);


});
