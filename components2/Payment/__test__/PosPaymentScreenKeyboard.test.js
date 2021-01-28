import PosPaymentScreenKeyboard2 from "../Helpers/PosPaymentScreenKeyboard2";
import {
  cola,
  ketchup,
  makeWrapper,
  setComponent,
  wrapper
} from "../../../test-utils";
import {
  addItem,
  addModifier,
  addPayment,
  createOrder,
  makeDiscount
} from "../../../OrderView/pos-logic";
import { nextTick } from "vue";
import PaymentLogicsFactory from "../payment-logics";
import delay from "delay";
import { stringify } from "schemahandler/utils";

describe("test Pos Payment Screen Keyboard", () => {
  it("should render", async () => {
    const {
      currentOrder,
      onAddPaymentMethod,
      onSaveMulti
    } = PaymentLogicsFactory();
    addItem(currentOrder, cola, 1);
    addModifier(currentOrder, ketchup);
    await nextTick();
    onAddPaymentMethod({ type: "cash", value: 100 });
    await nextTick();
    setComponent(PosPaymentScreenKeyboard2);
    makeWrapper();
    // test order change
    expect(wrapper.html()).toMatchInlineSnapshot(`
      <div class="pos-payment-keyboard">
        <div style="position: relative;"
             class="col-6"
        >
          <pos-keyboard-full-stub template="grid-template-areas: &quot; key7 key7 key8 key8 key9 key9&quot; &quot;key4 key4 key5 key5 key6 key6&quot; &quot;key1 key1 key2 key2 key3 key3&quot; &quot;keyDot keyDot key0 key0 del del&quot;;grid-auto-columns: 1fr; grid-gap: 5px"
                                  items="[object Object],[object Object],[object Object],[object Object],[object Object],[object Object],[object Object],[object Object],[object Object],[object Object],[object Object],[object Object]"
                                  gap="4px"
                                  style="height: 100%;"
          >
          </pos-keyboard-full-stub>
        </div>
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
        <div style="position: relative;"
             class="col-6"
        >
          <pos-keyboard-full-stub template="grid-template-areas: &quot; key7 key7 key8 key8 key9 key9&quot; &quot;key4 key4 key5 key5 key6 key6&quot; &quot;key1 key1 key2 key2 key3 key3&quot; &quot;keyDot keyDot key0 key0 del del&quot;;grid-auto-columns: 1fr; grid-gap: 5px"
                                  items="[object Object],[object Object],[object Object],[object Object],[object Object],[object Object],[object Object],[object Object],[object Object],[object Object],[object Object],[object Object]"
                                  gap="4px"
                                  style="height: 100%;"
          >
          </pos-keyboard-full-stub>
          <div class="keyboard-overlay">
          </div>
        </div>
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
    onAddPaymentMethod({ type: "multi" });
    onSaveMulti({ card: 10, cash: 20 });
    await nextTick();
    expect(wrapper.html()).toMatchInlineSnapshot(`
      <div class="pos-payment-keyboard">
        <div style="position: relative;"
             class="col-6"
        >
          <pos-keyboard-full-stub template="grid-template-areas: &quot; key7 key7 key8 key8 key9 key9&quot; &quot;key4 key4 key5 key5 key6 key6&quot; &quot;key1 key1 key2 key2 key3 key3&quot; &quot;keyDot keyDot key0 key0 del del&quot;;grid-auto-columns: 1fr; grid-gap: 5px"
                                  items="[object Object],[object Object],[object Object],[object Object],[object Object],[object Object],[object Object],[object Object],[object Object],[object Object],[object Object],[object Object]"
                                  gap="4px"
                                  style="height: 100%;"
          >
          </pos-keyboard-full-stub>
        </div>
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
                    <pos-textfield-new-stub modelvalue="20">
                    </pos-textfield-new-stub>
                  </div>
                </div>
              </tr>
              <tr>
                <div class="payment-table__row">
                  <div class="flex-grow-1 row-flex align-items-center">
                    <span style="text-transform: capitalize;">
                      payment.card
                    </span>
                  </div>
                  <div class="value-input w-20">
                    <span>
                      10
                    </span>
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
                  20
                </div>
              </div>
              <div class="row-flex payment-footer__value">
                <div class="flex-grow-1">
                  payment.tip
                </div>
                <g-spacer-stub>
                </g-spacer-stub>
                <div class="payment-footer__value__number">
                  5.70
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    `);
    makeDiscount(currentOrder, "5%");
    await nextTick();
    expect(wrapper.html()).toMatchInlineSnapshot(`
      <div class="pos-payment-keyboard">
        <div style="position: relative;"
             class="col-6"
        >
          <pos-keyboard-full-stub template="grid-template-areas: &quot; key7 key7 key8 key8 key9 key9&quot; &quot;key4 key4 key5 key5 key6 key6&quot; &quot;key1 key1 key2 key2 key3 key3&quot; &quot;keyDot keyDot key0 key0 del del&quot;;grid-auto-columns: 1fr; grid-gap: 5px"
                                  items="[object Object],[object Object],[object Object],[object Object],[object Object],[object Object],[object Object],[object Object],[object Object],[object Object],[object Object],[object Object]"
                                  gap="4px"
                                  style="height: 100%;"
          >
          </pos-keyboard-full-stub>
        </div>
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
              4.09
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
                    <pos-textfield-new-stub modelvalue="20">
                    </pos-textfield-new-stub>
                  </div>
                </div>
              </tr>
              <tr>
                <div class="payment-table__row">
                  <div class="flex-grow-1 row-flex align-items-center">
                    <span style="text-transform: capitalize;">
                      payment.card
                    </span>
                  </div>
                  <div class="value-input w-20">
                    <span>
                      10
                    </span>
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
                  20
                </div>
              </div>
              <div class="row-flex payment-footer__value">
                <div class="flex-grow-1">
                  payment.tip
                </div>
                <g-spacer-stub>
                </g-spacer-stub>
                <div class="payment-footer__value__number">
                  5.91
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    `);
    addItem(currentOrder, cola, 3);
    await nextTick();
    expect(wrapper.html()).toMatchInlineSnapshot(`
      <div class="pos-payment-keyboard">
        <div style="position: relative;"
             class="col-6"
        >
          <pos-keyboard-full-stub template="grid-template-areas: &quot; key7 key7 key8 key8 key9 key9&quot; &quot;key4 key4 key5 key5 key6 key6&quot; &quot;key1 key1 key2 key2 key3 key3&quot; &quot;keyDot keyDot key0 key0 del del&quot;;grid-auto-columns: 1fr; grid-gap: 5px"
                                  items="[object Object],[object Object],[object Object],[object Object],[object Object],[object Object],[object Object],[object Object],[object Object],[object Object],[object Object],[object Object]"
                                  gap="4px"
                                  style="height: 100%;"
          >
          </pos-keyboard-full-stub>
        </div>
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
              7.81
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
                    <pos-textfield-new-stub modelvalue="20">
                    </pos-textfield-new-stub>
                  </div>
                </div>
              </tr>
              <tr>
                <div class="payment-table__row">
                  <div class="flex-grow-1 row-flex align-items-center">
                    <span style="text-transform: capitalize;">
                      payment.card
                    </span>
                  </div>
                  <div class="value-input w-20">
                    <span>
                      10
                    </span>
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
                  20
                </div>
              </div>
              <div class="row-flex payment-footer__value">
                <div class="flex-grow-1">
                  payment.tip
                </div>
                <g-spacer-stub>
                </g-spacer-stub>
                <div class="payment-footer__value__number">
                  2.19
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    `);
    addItem(currentOrder, cola, 2);
    addModifier(currentOrder, ketchup);
    await nextTick();
    expect(stringify(currentOrder)).toMatchInlineSnapshot(`
      Object {
        "_id": "ObjectID",
        "cancellationItems": Array [],
        "cashback": 14.01,
        "discount": "5%",
        "items": Array [
          Object {
            "_id": "ObjectID",
            "course": 1,
            "discount": "5%",
            "modifiers": Array [
              Object {
                "name": "Add Ketchup",
                "originalPrice": 3,
                "price": 2.85,
                "quantity": 1,
              },
            ],
            "name": "Cola",
            "originalPrice": 1.3,
            "price": 1.24,
            "quantity": 1,
            "tax": 16,
            "taxes": Array [
              16,
              32,
            ],
            "vDiscount": 0.21,
            "vSum": 4.09,
            "vTakeAway": false,
            "vTaxSum": Object {
              "16": Object {
                "gross": 4.09,
                "net": 3.53,
                "tax": 0.56,
              },
            },
          },
          Object {
            "_id": "ObjectID",
            "course": 1,
            "discount": "5%",
            "name": "Cola",
            "originalPrice": 1.3,
            "price": 1.24,
            "quantity": 3,
            "tax": 16,
            "taxes": Array [
              16,
              32,
            ],
            "vDiscount": 0.18,
            "vSum": 3.72,
            "vTakeAway": false,
            "vTaxSum": Object {
              "16": Object {
                "gross": 3.72,
                "net": 3.21,
                "tax": 0.51,
              },
            },
          },
          Object {
            "_id": "ObjectID",
            "course": 1,
            "discount": "5%",
            "modifiers": Array [
              Object {
                "name": "Add Ketchup",
                "originalPrice": 3,
                "price": 2.85,
                "quantity": 1,
              },
            ],
            "name": "Cola",
            "originalPrice": 1.3,
            "price": 1.24,
            "quantity": 2,
            "tax": 16,
            "taxes": Array [
              16,
              32,
            ],
            "vDiscount": -2.58,
            "vSum": 8.18,
            "vTakeAway": false,
            "vTaxSum": Object {
              "16": Object {
                "gross": 8.18,
                "net": 7.05,
                "tax": 1.13,
              },
            },
          },
        ],
        "multiPayment": true,
        "payment": Array [
          Object {
            "type": "cash",
            "value": 20,
          },
          Object {
            "type": "card",
            "value": 10,
          },
        ],
        "status": "inProgress",
        "takeAway": false,
        "tip": 0,
        "user": Array [],
        "vDate": "2021-01-26T17:00:00.000Z",
        "vDiscount": 0.39,
        "vSum": 15.99,
        "vTaxSum": Object {
          "16": Object {
            "gross": 15.99,
            "net": 13.79,
            "tax": 2.2,
          },
        },
      }
    `);
    expect(wrapper.html()).toMatchInlineSnapshot(`
      <div class="pos-payment-keyboard">
        <div style="position: relative;"
             class="col-6"
        >
          <pos-keyboard-full-stub template="grid-template-areas: &quot; key7 key7 key8 key8 key9 key9&quot; &quot;key4 key4 key5 key5 key6 key6&quot; &quot;key1 key1 key2 key2 key3 key3&quot; &quot;keyDot keyDot key0 key0 del del&quot;;grid-auto-columns: 1fr; grid-gap: 5px"
                                  items="[object Object],[object Object],[object Object],[object Object],[object Object],[object Object],[object Object],[object Object],[object Object],[object Object],[object Object],[object Object]"
                                  gap="4px"
                                  style="height: 100%;"
          >
          </pos-keyboard-full-stub>
        </div>
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
              15.99
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
                    <pos-textfield-new-stub modelvalue="20">
                    </pos-textfield-new-stub>
                  </div>
                </div>
              </tr>
              <tr>
                <div class="payment-table__row">
                  <div class="flex-grow-1 row-flex align-items-center">
                    <span style="text-transform: capitalize;">
                      payment.card
                    </span>
                  </div>
                  <div class="value-input w-20">
                    <span>
                      10
                    </span>
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
                  14.01
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    `);
  });
  it("test fix discount", async () => {
    const order = createOrder();

    addItem(order, cola, 10);
    addItem(order, cola, 5);
    addModifier(order, ketchup);

    const {
      currentOrder,
      onAddPaymentMethod,
      onSaveMulti
    } = PaymentLogicsFactory();
    onAddPaymentMethod({ type: "multi" });
    onSaveMulti({ card: 10, cash: 20 });
    makeDiscount(currentOrder, "8");
    await nextTick();
    expect(currentOrder).toMatchInlineSnapshot(`
      Object {
        "_id": "6010f6bfea2c690bb2ff1fd5",
        "cancellationItems": Array [],
        "cashback": 20,
        "discount": "8",
        "items": Array [],
        "multiPayment": true,
        "payment": Array [
          Object {
            "type": "cash",
            "value": 20,
          },
          Object {
            "type": "card",
            "value": 10,
          },
        ],
        "status": "inProgress",
        "takeAway": false,
        "tip": 10,
        "user": Array [],
        "vDate": 2021-01-26T17:00:00.000Z,
        "vSum": 0,
        "vTaxSum": Object {},
      }
    `);
  });
});
