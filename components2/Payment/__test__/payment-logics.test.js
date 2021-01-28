import PaymentLogicsFactory from "../payment-logics";
import { stringify } from "schemahandler/utils";
import { addItem, addModifier, addPayment } from "../../OrderView/pos-logic";
import { nextTick } from "vue";
import delay from "delay";

const foodTax = { taxes: [5, 10] };
const drinkTax = { taxes: [16, 32] };

const cola = { name: "Cola", price: 1.3, quantity: 1, ...drinkTax };
const fanta = { name: "Fanta", price: 2, quantity: 1, ...drinkTax };
const rice = { name: "Rice", price: 10, quantity: 1, ...foodTax };
const ketchup = { name: "Add Ketchup", price: 3, quantity: 1 };

describe("test payment logics", () => {
  it("should ...", async () => {
    const {
      currentOrderChange,
      currentOrder,
      onAddPaymentMethod,
      selectedPayment,
      currentOrderPaymentList
    } = PaymentLogicsFactory();
    addItem(currentOrder, cola, 10);
    addModifier(currentOrder, ketchup);
    onAddPaymentMethod({
      type: "cash",
      value: 100
    });
    await delay(100);
    expect(stringify(currentOrder)).toMatchInlineSnapshot(`
      Object {
        "_id": "ObjectID",
        "cancellationItems": Array [],
        "cashback": 100,
        "items": Array [
          Object {
            "_id": "ObjectID",
            "course": 1,
            "modifiers": Array [
              Object {
                "name": "Add Ketchup",
                "price": 3,
                "quantity": 1,
              },
            ],
            "name": "Cola",
            "price": 1.3,
            "quantity": 10,
            "tax": 16,
            "taxes": Array [
              16,
              32,
            ],
            "vSum": 43,
            "vTakeAway": false,
            "vTaxSum": Object {
              "16": Object {
                "gross": 43,
                "net": 37.07,
                "tax": 5.93,
              },
            },
          },
        ],
        "payment": Array [
          Object {
            "type": "cash",
            "value": 100,
          },
        ],
        "status": "inProgress",
        "takeAway": false,
        "tip": 0,
        "user": Array [],
        "vDate": "2021-01-18T17:00:00.000Z",
        "vSum": 43,
        "vTaxSum": Object {
          "16": Object {
            "gross": 43,
            "net": 37.07,
            "tax": 5.93,
          },
        },
      }
    `);
    //test currentOrder payment list
    expect(currentOrderPaymentList.value).toMatchInlineSnapshot(`
      Array [
        Object {
          "type": "cash",
          "value": 100,
        },
      ]
    `);
    //test selectedPayment
    expect(selectedPayment.value).toEqual("cash");
  });
});
