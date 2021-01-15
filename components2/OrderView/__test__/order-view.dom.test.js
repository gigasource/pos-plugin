//<editor-fold desc="declare">
import {
  actions,
  cola,
  drinkTax,
  expectArray,
  fanta,
  foodTax,
  ketchup,
  rice,
  component,
  wrapper,
  makeWrapper,
  orm,
  setComponent
} from "../../test-utils";
import { config, mount } from "@vue/test-utils";

import { nextTick } from "vue";
import { payPrintBtnFactory } from "../payPrintBtnFactory";

import {
  addProduct,
  disablePay,
  getCurrentOrder,
  payBtnClickable,
  payPrintMode,
  prepareOrder,
  showIcon,
  togglePayPrintBtn
} from "../pos-logic-be";

import { mockProduct } from "./mock_product";
import { mockOrder } from "./mock-order";
import { smallSidebar } from "../order-layout-setting-logic";
import { orderRightSideHeader } from "../orderRightSideHeaderFactory";
import { orderRightSideItemsTable } from "../orderRightSideItemsTable";
import PosOrder2 from "../PosOrder2";
import Order2 from "../Order2";
import { orderLayout } from "../pos-ui-shared";
import { demoData } from "./demoData";
import PosOrderLayout2 from "../PosOrderLayout2";

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
