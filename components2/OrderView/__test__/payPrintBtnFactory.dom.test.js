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

//<editor-fold desc="component">

beforeAll(() => (config.renderStubDefaultSlot = true));
//</editor-fold>

describe("PrintButton test", function () {
  beforeAll(() => {
    component = {
      setup() {
        const {renderPayBtn} = payPrintBtnFactory();
        return () => renderPayBtn();
      }
    };
    makeWrapper();
  });

  it("case 1 render big sidebar print", async function () {
    //order have 1 sent item, add one item -> should display print,
    prepareOrder(mockOrder);
    let order = getCurrentOrder();
    addProduct(order, mockProduct);
    await nextTick();
    //removeItem(order, 0, 1);
    //changeItemQuantity(order, 0, 1);
    smallSidebar.value = false;
    await nextTick();
    expect(wrapper.html()).toMatchInlineSnapshot(`
      <g-btn-bs-stub disabled="false"
                     width="104"
                     style="font-size: 14px; padding: 0px;"
                     background-color="#1271FF"
                     text-color="#FFF"
                     icon="icon-print"
      >
        <span>
          common.currency 80
        </span>
      </g-btn-bs-stub>
    `);
  }, 80000);

  it("case 2 render big sidebar pay", async function () {
    //order have 1 sent item -> should display pay,
    prepareOrder(mockOrder);
    let order = getCurrentOrder();
    //addProduct(order, mockProduct);
    await nextTick();
    //removeItem(order, 0, 1);
    //changeItemQuantity(order, 0, 1);
    smallSidebar.value = false;
    await nextTick();
    expect(wrapper.html()).toMatchInlineSnapshot(`
      <g-btn-bs-stub width="104"
                     style="font-size: 14px; padding: 4px 0px;"
                     background-color="#1271FF"
                     disabled="false"
                     icon="icon-wallet"
      >
        <span>
          common.currency 40
        </span>
      </g-btn-bs-stub>
    `);
  }, 80000);

  it("case 3 render small sidebar print", async function () {
    //order have 1 sent item, add one item -> should display print,
    prepareOrder(mockOrder);
    let order = getCurrentOrder();
    addProduct(order, mockProduct);
    await nextTick();
    //removeItem(order, 0, 1);
    //changeItemQuantity(order, 0, 1);
    await nextTick();
    expect(wrapper.html()).toMatchInlineSnapshot(`
      <g-btn-bs-stub width="75"
                     style="font-size: 14px; padding: 0px;"
                     text-color="#FFF"
                     background-color="#1271FF"
                     disabled="false"
      >
        <transition-stub name="front">
          <div class="animation-wrapper">
            <span>
              common.currency 80
            </span>
          </div>
        </transition-stub>
        <transition-stub name="back">
        </transition-stub>
      </g-btn-bs-stub>
    `);
  }, 80000);

  it("case 4 render small sidebar pay", async function () {
    //order have 1 sent item, add one item -> should display print,
    prepareOrder(mockOrder);
    let order = getCurrentOrder();
    //addProduct(order, mockProduct);
    await nextTick();
    //removeItem(order, 0, 1);
    //changeItemQuantity(order, 0, 1);
    await nextTick();
    togglePayPrintBtn();
    await nextTick();
    expect(wrapper.html()).toMatchInlineSnapshot(`
      <g-btn-bs-stub width="75"
                     style="font-size: 14px; padding: 0px;"
                     text-color="#FFF"
                     background-color="#1271FF"
                     disabled="false"
      >
        <transition-stub name="front">
        </transition-stub>
        <transition-stub name="back">
          <div class="animation-wrapper bg-pink">
            <g-icon-stub>
              icon-wallet
            </g-icon-stub>
          </div>
        </transition-stub>
      </g-btn-bs-stub>
    `);
  }, 80000);

  it("case 5 render header", async function () {
    //order have 1 sent item, add one item -> should display print,
    prepareOrder(mockOrder);
    let order = getCurrentOrder();
    //addProduct(order, mockProduct);
    await nextTick();
    //removeItem(order, 0, 1);
    //changeItemQuantity(order, 0, 1);
    await nextTick();
    togglePayPrintBtn();
    await nextTick();
    expect(wrapper.html()).toMatchInlineSnapshot(`
      <g-btn-bs-stub width="75"
                     style="font-size: 14px; padding: 0px;"
                     text-color="#FFF"
                     background-color="#1271FF"
                     disabled="false"
      >
        <transition-stub name="front">
        </transition-stub>
        <transition-stub name="back">
          <div class="animation-wrapper bg-pink">
            <g-icon-stub>
              icon-wallet
            </g-icon-stub>
          </div>
        </transition-stub>
      </g-btn-bs-stub>
    `);
  }, 80000);
});

describe("header test", function () {
  beforeAll(() => {
    component = {
      setup() {
        const {renderHeader} = orderRightSideHeader({}, {emit: () => null});
        return () => renderHeader();
      }
    };
    makeWrapper();
  });

  it("case 5 render header", async function () {
    //order have 1 sent item, add one item -> should display print,
    prepareOrder(mockOrder);
    let order = getCurrentOrder();
    addProduct(order, mockProduct);
    await nextTick();
    //removeItem(order, 0, 1);
    //changeItemQuantity(order, 0, 1);
    await nextTick();
    //togglePayPrintBtn();
    await nextTick();
    expect(wrapper.html()).toMatchInlineSnapshot(`
      <div class="order-detail__header">
        <g-btn-bs-stub background-color="#FFCB3A"
                       border-color="#f0f0f0"
                       width="75"
                       style="transition-delay: 0.6s; padding: 4px; display: none;"
        >
          <g-icon-stub>
            icon-split_check_2
          </g-icon-stub>
        </g-btn-bs-stub>
        <transition-stub name="fade">
          <div class="row-flex align-items-center flex-grow-1">
            <g-avatar size="36">
              <img alt="true">
            </g-avatar>
            <div style="display: flex; flex: 2;"
                 class="ml-1 align-items-baseline"
            >
              <p class="order-detail__header-username">
              </p>
              <p style="line-height: 19px;">
                <span class="order-detail__header-title">
                  Table
                </span>
                <span class="order-detail__header-value">
                  10
                </span>
              </p>
            </div>
          </div>
        </transition-stub>
      </div>
    `);
  }, 80000);
});

describe("item table test", function () {
  beforeAll(() => {
    component = {
      setup() {
        const {renderItemsTable} = orderRightSideItemsTable(
          {},
          {emit: () => null}
        );
        return () => renderItemsTable();
      }
    };
    makeWrapper();
  });

  it("case 5 render table", async function () {
    //order have 1 sent item, add one item -> should display print,
    prepareOrder(mockOrder);
    let order = getCurrentOrder();
    addProduct(order, mockProduct);
    await nextTick();
    addProduct(order, mockProduct);
    await nextTick();
    //removeItem(order, 0, 1);
    //changeItemQuantity(order, 0, 1);
    //await nextTick();
    //togglePayPrintBtn();
    //await nextTick();
    expect(wrapper.html()).toMatchInlineSnapshot(`
      <div class="order-detail__content">
        <div class="item">
          <div class="item-detail">
            <div style="opacity: 0.55;">
              <p class="item-detail__name">
                48. Whiskey
              </p>
              <p>
                <span class="item-detail__price item-detail__discount">
                  €
                </span>
                <span class="item-detail__price--new">
                  common.currency40
                </span>
                <span class="item-detail__option text-red-accent-2">
                </span>
              </p>
            </div>
            <div class="item-action">
              <g-icon-stub color="#FF4452">
                remove_circle_outline
              </g-icon-stub>
              <span class="ml-1 mr-1">
                1
              </span>
              <g-icon-stub style="opacity: 0.5;">
                add_circle_outline
              </g-icon-stub>
            </div>
          </div>
        </div>
        <div class="item">
          <div class="item-detail">
            <div>
              <p class="item-detail__name">
                48. Whiskey
              </p>
              <p>
                <span class="item-detail__price item-detail__discount">
                  €
                </span>
                <span class="item-detail__price--new">
                  common.currency40
                </span>
                <span class="item-detail__option text-red-accent-2">
                </span>
              </p>
            </div>
            <div class="item-action">
              <g-icon-stub color="#000">
                remove_circle_outline
              </g-icon-stub>
              <span class="ml-1 mr-1">
                2
              </span>
              <g-icon-stub>
                add_circle_outline
              </g-icon-stub>
            </div>
          </div>
        </div>
      </div>
      <dialog-config-order-item-stub modelvalue="false"
                                     original-value="0"
      >
      </dialog-config-order-item-stub>
    `);
  }, 80000);
});

describe("PosOrderRight intergration", function () {
  beforeAll(() => {
    component = PosOrder2;
    makeWrapper();
  });

  it("case 6 render right side", async function () {
    //order have 1 sent item, add one item -> should display print,
    prepareOrder(mockOrder);
    let order = getCurrentOrder();
    addProduct(order, mockProduct);
    await nextTick();
    addProduct(order, mockProduct);
    await nextTick();
    //removeItem(order, 0, 1);
    //changeItemQuantity(order, 0, 1);
    //await nextTick();
    //togglePayPrintBtn();
    //await nextTick();
    expect(wrapper.html()).toMatchInlineSnapshot(`
      <div class="order-detail"
           style="height: 100%; max-height: 100%;"
      >
        <div class="order-detail__header">
          <g-btn-bs-stub background-color="#FFCB3A"
                         border-color="#f0f0f0"
                         width="75"
                         style="transition-delay: 0.6s; padding: 4px; display: none;"
          >
            <g-icon-stub>
              icon-split_check_2
            </g-icon-stub>
          </g-btn-bs-stub>
          <transition-stub name="fade">
            <div class="row-flex align-items-center flex-grow-1">
              <g-avatar-stub size="36">
                <img alt="true">
              </g-avatar-stub>
              <div style="display: flex; flex: 2;"
                   class="ml-1 align-items-baseline"
              >
                <p class="order-detail__header-username">
                </p>
                <p style="line-height: 19px;">
                  <span class="order-detail__header-title">
                    Table
                  </span>
                  <span class="order-detail__header-value">
                    10
                  </span>
                </p>
              </div>
            </div>
          </transition-stub>
        </div>
        <div class="order-detail__content">
          <div class="item">
            <div class="item-detail">
              <div style="opacity: 0.55;">
                <p class="item-detail__name">
                  48. Whiskey
                </p>
                <p>
                  <span class="item-detail__price item-detail__discount">
                    common.currency
                  </span>
                  <span class="item-detail__price--new">
                    common.currency40
                  </span>
                  <span class="item-detail__option text-red-accent-2">
                  </span>
                </p>
              </div>
              <div class="item-action">
                <g-icon-stub color="#FF4452">
                  remove_circle_outline
                </g-icon-stub>
                <span class="ml-1 mr-1">
                  1
                </span>
                <g-icon-stub style="opacity: 0.5;">
                  add_circle_outline
                </g-icon-stub>
              </div>
            </div>
          </div>
          <div class="item">
            <div class="item-detail">
              <div>
                <p class="item-detail__name">
                  48. Whiskey
                </p>
                <p>
                  <span class="item-detail__price item-detail__discount">
                    common.currency
                  </span>
                  <span class="item-detail__price--new">
                    common.currency40
                  </span>
                  <span class="item-detail__option text-red-accent-2">
                  </span>
                </p>
              </div>
              <div class="item-action">
                <g-icon-stub color="#000">
                  remove_circle_outline
                </g-icon-stub>
                <span class="ml-1 mr-1">
                  2
                </span>
                <g-icon-stub>
                  add_circle_outline
                </g-icon-stub>
              </div>
            </div>
          </div>
        </div>
        <dialog-config-order-item-stub>
        </dialog-config-order-item-stub>
        <div class="blur-overlay">
        </div>
        <g-overlay-stub value="[object Object]"
                        absolute="true"
                        opacity="0.7"
                        color="rgba(255, 255, 255)"
                        style="top: 54px;"
        >
        </g-overlay-stub>
      </div>
    `);
  }, 80000);
});
