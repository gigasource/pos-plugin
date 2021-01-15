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

describe("PrintButton test", function() {
  beforeAll(() => {
    makeWrapper(Order2, {shallow: false});
  });

  it("case 1 render big sidebar print", async function() {
    //order have 1 sent item, add one item -> should display print,
    prepareOrder(mockOrder);
    let order = getCurrentOrder();
    addProduct(order, mockProduct);
    await nextTick();
    expect(wrapper.html()).toMatchInlineSnapshot(`
      <div class="order">
        <div class="order-main">
          <pos-order-layout2-stub style="flex: 1;"
                                  fontsize="14px"
                                  category="[object Object]"
                                  minimumtextrow="true"
                                  collapseblankcolumn="true"
                                  hidetextrow="false"
                                  hideblankcolumn="false"
                                  collapsetext="true"
                                  actionmode="none"
                                  showoverlay="true"
                                  scrollablelayout="true"
          >
          </pos-order-layout2-stub>
          <pos-order style="flex: 0 0 25%;"
                     fontsize="14px"
                     category="[object Object]"
                     minimumtextrow="true"
                     collapseblankcolumn="true"
                     hidetextrow="false"
                     hideblankcolumn="false"
                     collapsetext="true"
                     actionmode="none"
                     showoverlay="true"
                     scrollablelayout="true"
                     user="[object Object]"
                     actionlist
          >
          </pos-order>
        </div>
        <pos-quick-order-toolbar currentorder="[object Object]"
                                 actionlist
        >
        </pos-quick-order-toolbar>
      </div>
      <pos-order-split-order modelvalue="false"
                             user="[object Object]"
                             current-order="[object Object]"
      >
      </pos-order-split-order>
      <pos-order-receipt modelvalue="false"
                         order="[object Object]"
      >
      </pos-order-receipt>
      <pos-order-move-items modelvalue="false"
                            user="[object Object]"
                            current-order="[object Object]"
      >
      </pos-order-move-items>
      <pos-order-voucher-dialog modelvalue="false">
      </pos-order-voucher-dialog>
    `);
  }, 80000);
});
