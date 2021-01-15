//<editor-fold desc="declare">
import {config, mount} from "@vue/test-utils";

import {nextTick} from "vue";
import {payPrintBtnFactory} from "../payPrintBtnFactory";

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

import {mockProduct} from "./mock_product";
import {mockOrder} from "./mock-order";
import {smallSidebar} from "../order-layout-setting-logic";
import {orderRightSideHeader} from "../orderRightSideHeaderFactory";
import {orderRightSideItemsTable} from "../orderRightSideItemsTable";
import PosOrder2 from "../PosOrder2";
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
  orm
} from "../../test-utils";
import Order2 from "../Order2";

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

describe("PrintButton test", function () {
  beforeAll(() => {
    component = Order2;
    makeWrapper();
  });

  it("case 1 render big sidebar print", async function () {
    //order have 1 sent item, add one item -> should display print,
    prepareOrder(mockOrder);
    let order = getCurrentOrder();
    addProduct(order, mockProduct);
    await nextTick();
    expect(wrapper.html()).toMatchInlineSnapshot();
  }, 80000);
});
