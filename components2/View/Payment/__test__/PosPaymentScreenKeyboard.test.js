import PosPaymentScreenKeyboard2 from '../Helpers/PosPaymentScreenKeyboard2';
import { cola, ketchup, makeWrapper, setComponent, wrapper } from '../../../test-utils';
import { addItem, addModifier } from '../../../OrderView/pos-logic';
import { nextTick } from 'vue';
import PaymentLogicsFactory from '../payment-logics';
import delay from 'delay';

describe("test Pos Payment Screen Keyboard", () => {
  it("should render", async () => {
    const { currentOrder, onAddPaymentMethod } = PaymentLogicsFactory();
    addItem(currentOrder, cola);
    addModifier(currentOrder, ketchup);
    await nextTick();
    onAddPaymentMethod({ type: "cash", value: 100 });
    await nextTick();
    setComponent(PosPaymentScreenKeyboard2);
    makeWrapper();
    // test order change
    expect(wrapper.html()).toMatchInlineSnapshot(`
      <div class="pos-payment-keyboard">
        <div class="col-flex"
             style="height: 100%; margin-left: 8px; flex: 1;"
        >
          <div class="payment-table__header">
            <span>
              onlineOrder.total
            </span>
            <g-spacer-stub>
            </g-spacer-stub>
            <span class="total-value">
              4.30
            </span>
          </div>
          <g-table-stub class="payment-table flex-grow-1"
                        striped="true"
                        fixed-header="true"
          >
            <tbody>
              <tr>
                <div class="payment-table__row">
                  <div class="flex-grow-1 row-flex align-items-center">
                    <span style="text-transform: capitalize;">
                      payment.cash
                    </span>
                  </div>
                  <div class="value-input w-20">
                    <pos-textfield-new-stub modelvalue="100">
                    </pos-textfield-new-stub>
                  </div>
                </div>
              </tr>
            </tbody>
          </g-table-stub>
          <div class="payment-table__footer">
            <div class="payment-change__description mt-2">
              payment.enterTender
            </div>
            <g-divider-stub inset="true"
                            class="mb-2"
            >
            </g-divider-stub>
            <div class="payment-footer">
              <div class="row-flex payment-footer__value">
                <div class="flex-grow-1">
                  payment.change
                </div>
                <div class="payment-footer__value__number">
                  95.70
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    `);
    await delay(50);
    // test order tip
    onAddPaymentMethod({ type: "card", value: 100 });
    await nextTick();
    expect(wrapper.html()).toMatchInlineSnapshot(`
      <div class="pos-payment-keyboard">
        <div class="col-flex"
             style="height: 100%; margin-left: 8px; flex: 1;"
        >
          <div class="payment-table__header">
            <span>
              onlineOrder.total
            </span>
            <g-spacer-stub>
            </g-spacer-stub>
            <span class="total-value">
              4.30
            </span>
          </div>
          <g-table-stub class="payment-table flex-grow-1"
                        striped="true"
                        fixed-header="true"
          >
            <tbody>
              <tr>
                <div class="payment-table__row">
                  <div class="flex-grow-1 row-flex align-items-center">
                    <span style="text-transform: capitalize;">
                      payment.card
                    </span>
                  </div>
                  <div class="value-input w-20">
                    <span>
                      100
                    </span>
                  </div>
                </div>
              </tr>
            </tbody>
          </g-table-stub>
          <div class="payment-table__footer">
            <g-divider-stub inset="true"
                            class="mb-2"
            >
            </g-divider-stub>
            <div class="payment-footer">
              <div class="row-flex payment-footer__value">
                <div class="flex-grow-1">
                  payment.change
                </div>
                <div class="payment-footer__value__number">
                  0
                </div>
              </div>
              <div class="row-flex payment-footer__value">
                <div class="flex-grow-1">
                  payment.tip
                </div>
                <g-spacer-stub>
                </g-spacer-stub>
                <div class="payment-footer__value__number">
                  95.70
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    `);
  });
});
