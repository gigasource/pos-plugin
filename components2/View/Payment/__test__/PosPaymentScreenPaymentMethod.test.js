import PosPaymentScreenPaymentMethods2 from "../Helpers/PosPaymentScreenPaymentMethods2";
import { wrapper, setComponent, makeWrapper, cola } from "../../../test-utils";

import PaymentLogicsFactory from "../payment-logics";
import * as PaymentLogics from "../payment-logics";
import { addItem } from "../../../OrderView/pos-logic";
import { nextTick } from "vue";

const {
  currentOrder,
  showMultiPaymentDialog,
  tipEditValue,
  cashEditValue,
  cardEditValue,
  defaultPaymentList,
  paidValue,
  currentOrderTip,
  currentOrderPaymentList,
  selectedPayment,
  currentOrderChange,
  onOpenMultiPaymentDialog,
  onOpenTipDialog,
  onSaveMulti,
  onSaveTip,
  getBadgeCount,
  onAddFixedItem,
  onAddPaymentMethod,
  getRemainingValue
} = PaymentLogicsFactory();

const PaymentLogicsFactoryMock = jest.spyOn(PaymentLogics, "default");
PaymentLogicsFactoryMock.mockImplementation(() => {
  return {
    currentOrder,
    showMultiPaymentDialog,
    tipEditValue,
    cashEditValue,
    cardEditValue,
    defaultPaymentList,
    paidValue,
    currentOrderTip,
    currentOrderPaymentList,
    selectedPayment,
    currentOrderChange,
    onOpenMultiPaymentDialog,
    onOpenTipDialog,
    onSaveMulti,
    onSaveTip,
    getBadgeCount,
    onAddFixedItem,
    onAddPaymentMethod,
    getRemainingValue
  };
});

describe("test Pos Payment Screen Keyboard", () => {
  it("should render", async () => {
    setComponent(PosPaymentScreenPaymentMethods2);
    makeWrapper();

    addItem(currentOrder, cola);
    onAddPaymentMethod({ type: "cash" });
    await nextTick();
    // color of cash button should be changed
    expect(wrapper.html()).toMatchInlineSnapshot(`
      <div class="pos-payment-method column-flex flex-wrap align-items-start pl-4 pt-4">
        <div class="row-flex">
          <g-btn-stub elevation="3"
                      uppercase="false"
                      x-large="true"
                      style="flex-basis: 20%;"
                      class="payment-method-btn payment-method-btn--selected"
                      textcolor="#fff"
          >
            <g-icon-stub size="20">
              icon-cash
            </g-icon-stub>
            <span class="ml-2"
                  style="text-transform: capitalize;"
            >
              payment.cash
            </span>
          </g-btn-stub>
          <g-btn-stub elevation="3"
                      uppercase="false"
                      x-large="true"
                      style="flex-basis: 20%;"
                      class="payment-method-btn"
                      textcolor="#1D1D26"
          >
            <g-icon-stub size="20">
              icon-credit_card
            </g-icon-stub>
            <span class="ml-2"
                  style="text-transform: capitalize;"
            >
              payment.card
            </span>
          </g-btn-stub>
          <g-btn-stub elevation="3"
                      uppercase="false"
                      x-large="true"
                      style="flex-basis: 20%;"
                      class="payment-method-btn"
                      textcolor="#1D1D26"
          >
            <g-icon-stub size="20">
              icon-multi_payment
            </g-icon-stub>
            <span class="ml-2"
                  style="text-transform: capitalize;"
            >
              payment.multi
            </span>
          </g-btn-stub>
        </div>
        <div class="row-flex">
          <g-btn-stub elevation="3"
                      uppercase="false"
                      x-large="true"
                      style="flex-basis: 20%;"
                      class="payment-method-btn"
          >
            <g-icon-stub size="20">
              icon-tip
            </g-icon-stub>
            <span style="text-transform: capitalize;">
              tip
            </span>
          </g-btn-stub>
          <g-btn-stub elevation="3"
                      uppercase="false"
                      x-large="true"
                      style="flex-basis: 20%;"
                      class="payment-method-btn"
          >
            <span style="text-transform: capitalize;">
              WC common.currency0.5
            </span>
          </g-btn-stub>
          <g-btn-stub elevation="3"
                      uppercase="false"
                      x-large="true"
                      style="flex-basis: 20%;"
                      class="payment-method-btn"
          >
            <span style="text-transform: capitalize;">
              sodexo common.currency6
            </span>
          </g-btn-stub>
        </div>
        <dialog-multi-payment2-stub modelvalue="false"
                                    total="1.3"
                                    storelocale="en"
                                    cardvalue
                                    cashvalue
                                    ismobile="false"
        >
        </dialog-multi-payment2-stub>
        <dialog-form-input-stub width="40%"
                                keyboard-type="numeric"
                                keyboard-width="100%"
        >
        </dialog-form-input-stub>
      </div>
    `);
    tipEditValue.value = "100";
    onSaveTip();
    await nextTick();
    // card button 's color should be changed
    expect(wrapper.html()).toMatchInlineSnapshot(`
      <div class="pos-payment-method column-flex flex-wrap align-items-start pl-4 pt-4">
        <div class="row-flex">
          <g-btn-stub elevation="3"
                      uppercase="false"
                      x-large="true"
                      style="flex-basis: 20%;"
                      class="payment-method-btn"
                      textcolor="#1D1D26"
          >
            <g-icon-stub size="20">
              icon-cash
            </g-icon-stub>
            <span class="ml-2"
                  style="text-transform: capitalize;"
            >
              payment.cash
            </span>
          </g-btn-stub>
          <g-btn-stub elevation="3"
                      uppercase="false"
                      x-large="true"
                      style="flex-basis: 20%;"
                      class="payment-method-btn payment-method-btn--selected"
                      textcolor="#fff"
          >
            <g-icon-stub size="20">
              icon-credit_card
            </g-icon-stub>
            <span class="ml-2"
                  style="text-transform: capitalize;"
            >
              payment.card
            </span>
          </g-btn-stub>
          <g-btn-stub elevation="3"
                      uppercase="false"
                      x-large="true"
                      style="flex-basis: 20%;"
                      class="payment-method-btn"
                      textcolor="#1D1D26"
          >
            <g-icon-stub size="20">
              icon-multi_payment
            </g-icon-stub>
            <span class="ml-2"
                  style="text-transform: capitalize;"
            >
              payment.multi
            </span>
          </g-btn-stub>
        </div>
        <div class="row-flex">
          <g-btn-stub elevation="3"
                      uppercase="false"
                      x-large="true"
                      style="flex-basis: 20%;"
                      class="payment-method-btn"
          >
            <g-icon-stub size="20">
              icon-tip
            </g-icon-stub>
            <span style="text-transform: capitalize;">
              tip
            </span>
          </g-btn-stub>
          <g-btn-stub elevation="3"
                      uppercase="false"
                      x-large="true"
                      style="flex-basis: 20%;"
                      class="payment-method-btn"
          >
            <span style="text-transform: capitalize;">
              WC common.currency0.5
            </span>
          </g-btn-stub>
          <g-btn-stub elevation="3"
                      uppercase="false"
                      x-large="true"
                      style="flex-basis: 20%;"
                      class="payment-method-btn"
          >
            <span style="text-transform: capitalize;">
              sodexo common.currency6
            </span>
          </g-btn-stub>
        </div>
        <dialog-multi-payment2-stub modelvalue="false"
                                    total="1.3"
                                    storelocale="en"
                                    cardvalue
                                    cashvalue
                                    ismobile="false"
        >
        </dialog-multi-payment2-stub>
        <dialog-form-input-stub width="40%"
                                keyboard-type="numeric"
                                keyboard-width="100%"
        >
        </dialog-form-input-stub>
      </div>
    `);
    expect(currentOrder.tip).toEqual(98.7)

  });
});
