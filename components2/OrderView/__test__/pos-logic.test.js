//<editor-fold desc="declare">
import { nextTick } from "vue";
import {
  addMultiPayment,
  addPayment,
  addSinglePayment,
  cancelOrder,
  clearPayment,
  getRestTotal,
  mergeSameItems,
  removeItem,
  simulateBackendPrint,
  updateSinglePayment
} from "../pos-logic";
import expect from "expect";
import { changeCourse } from "../pos-logic";

const dayjs = require("dayjs");
import { stringify } from "../../../utils/test-utils";

const {
  makeDiscount,
  makeTakeaway,
  addModifier,
  addItem,
  createOrder,
  makeLastItemDiscount
} = require("../pos-logic");

const delay = require("delay");

const foodTax = { taxes: [5, 10] };
const drinkTax = { taxes: [16, 32] };

const cola = { name: "Cola", price: 1.3, quantity: 1, ...drinkTax };
const fanta = { name: "Fanta", price: 2, quantity: 1, ...drinkTax };
const rice = { name: "Rice", price: 10, quantity: 1, ...foodTax };
const ketchup = { name: "Add Ketchup", price: 3, quantity: 1 };
//</editor-fold>

describe("pos-logic", function() {
  it("case 1: test item-tax", async function() {
    let order = createOrder();
    addItem(order, cola, 10);
    addItem(order, fanta, 20);

    await nextTick();
    //<editor-fold desc="order-expect">
    expect(order).toMatchInlineSnapshot(`
      Object {
        "cancellationItems": Array [],
        "items": Array [
          Object {
            "name": "Cola",
            "price": 1.3,
            "quantity": 10,
            "tax": 16,
            "taxes": Array [
              16,
              32,
            ],
            "vSum": 13,
            "vTakeAway": false,
            "vTaxSum": Object {
              "16": Object {
                "gross": 13,
                "net": 11.21,
                "tax": 1.79,
              },
            },
          },
          Object {
            "name": "Fanta",
            "price": 2,
            "quantity": 20,
            "tax": 16,
            "taxes": Array [
              16,
              32,
            ],
            "vSum": 40,
            "vTakeAway": false,
            "vTaxSum": Object {
              "16": Object {
                "gross": 40,
                "net": 34.48,
                "tax": 5.52,
              },
            },
          },
        ],
        "status": "inProgress",
        "takeAway": false,
        "vSum": 53,
        "vTaxSum": Object {
          "16": Object {
            "gross": 53,
            "net": 45.69,
            "tax": 7.31,
          },
        },
      }
    `);
    //</editor-fold>
  });

  it("case 2: test item-tax modifiers", async function() {
    let order = createOrder();
    /*addItem(order, cola, 10);
    addItem(order, fanta, 20);*/
    addItem(order, rice, 1);
    addModifier(order, ketchup);

    await delay(10);

    //<editor-fold desc="order-expect">
    expect(order).toMatchInlineSnapshot(`
      Object {
        "cancellationItems": Array [],
        "items": Array [
          Object {
            "modifiers": Array [
              Object {
                "name": "Add Ketchup",
                "price": 3,
                "quantity": 1,
              },
            ],
            "name": "Rice",
            "price": 10,
            "quantity": 1,
            "tax": 5,
            "taxes": Array [
              5,
              10,
            ],
            "vSum": 13,
            "vTakeAway": false,
            "vTaxSum": Object {
              "5": Object {
                "gross": 13,
                "net": 12.38,
                "tax": 0.62,
              },
            },
          },
        ],
        "status": "inProgress",
        "takeAway": false,
        "vSum": 13,
        "vTaxSum": Object {
          "5": Object {
            "gross": 13,
            "net": 12.38,
            "tax": 0.62,
          },
        },
      }
    `);
    //</editor-fold>
  });

  it("case 3: test discount item", async function() {
    let order = createOrder();
    addItem(order, cola, 1);
    makeLastItemDiscount(order, "40%");

    await nextTick();

    //<editor-fold desc="order-expect">
    expect(order).toMatchInlineSnapshot(`
      Object {
        "cancellationItems": Array [],
        "items": Array [
          Object {
            "discount": "40%",
            "name": "Cola",
            "originalPrice": 1.3,
            "price": 0.78,
            "quantity": 1,
            "tax": 16,
            "taxes": Array [
              16,
              32,
            ],
            "vDiscount": 0.52,
            "vSum": 0.78,
            "vTakeAway": false,
            "vTaxSum": Object {
              "16": Object {
                "gross": 0.78,
                "net": 0.67,
                "tax": 0.11,
              },
            },
          },
        ],
        "takeAway": false,
        "vDiscount": 0.52,
        "vSum": 0.78,
        "vTaxSum": Object {
          "16": Object {
            "gross": 0.78,
            "net": 0.67,
            "tax": 0.11,
          },
        },
      }
    `);
    //</editor-fold>
  });

  it("case 3 b: test discount item - number", async function() {
    let order = createOrder();
    addItem(order, cola, 1);
    makeLastItemDiscount(order, "0.5");

    await nextTick();

    //<editor-fold desc="order-expect">
    expect(order).toMatchInlineSnapshot(`
      Object {
        "cancellationItems": Array [],
        "items": Array [
          Object {
            "discount": "0.5",
            "name": "Cola",
            "originalPrice": 1.3,
            "price": 0.8,
            "quantity": 1,
            "tax": 16,
            "taxes": Array [
              16,
              32,
            ],
            "vDiscount": 0.5,
            "vSum": 0.8,
            "vTakeAway": false,
            "vTaxSum": Object {
              "16": Object {
                "gross": 0.8,
                "net": 0.69,
                "tax": 0.11,
              },
            },
          },
        ],
        "takeAway": false,
        "vDiscount": 0.5,
        "vSum": 0.8,
        "vTaxSum": Object {
          "16": Object {
            "gross": 0.8,
            "net": 0.69,
            "tax": 0.11,
          },
        },
      }
    `);
    //</editor-fold>
  });

  it("case 3c: test discount item modifier", async function() {
    let order = createOrder();
    addItem(order, rice, 1);
    addModifier(order, { name: "Add Ketchup", price: 3, quantity: 1 });

    makeLastItemDiscount(order, "40%");

    await Promise.resolve();

    //<editor-fold desc="order-expect">
    expect(order).toMatchInlineSnapshot(`
      Object {
        "cancellationItems": Array [],
        "items": Array [
          Object {
            "discount": "40%",
            "modifiers": Array [
              Object {
                "name": "Add Ketchup",
                "originalPrice": 3,
                "price": 1.8,
                "quantity": 1,
              },
            ],
            "name": "Rice",
            "originalPrice": 10,
            "price": 6,
            "quantity": 1,
            "tax": 5,
            "taxes": Array [
              5,
              10,
            ],
            "vDiscount": 5.2,
            "vSum": 7.8,
            "vTakeAway": false,
            "vTaxSum": Object {
              "5": Object {
                "gross": 7.8,
                "net": 7.51,
                "tax": 2.09,
              },
            },
          },
        ],
        "takeAway": false,
        "vDiscount": 5.2,
        "vSum": 7.8,
        "vTaxSum": Object {
          "5": Object {
            "gross": 7.8,
            "net": 7.51,
            "tax": 2.09,
          },
        },
      }
    `);
    //</editor-fold>
  });

  it("case 4: test discount order", async function() {
    let order = createOrder();
    addItem(order, cola, 1);
    makeDiscount(order, "50%");

    await nextTick();

    //<editor-fold desc="order-expect">
    expect(order).toMatchInlineSnapshot(`
      Object {
        "cancellationItems": Array [],
        "discount": "50%",
        "items": Array [
          Object {
            "discount": "50%",
            "name": "Cola",
            "originalPrice": 1.3,
            "price": 0.65,
            "quantity": 1,
            "tax": 16,
            "taxes": Array [
              16,
              32,
            ],
            "vDiscount": 0.65,
            "vSum": 0.65,
            "vTakeAway": false,
            "vTaxSum": Object {
              "16": Object {
                "gross": 0.65,
                "net": 0.56,
                "tax": 0.09,
              },
            },
          },
        ],
        "takeAway": false,
        "vDiscount": 0.65,
        "vSum": 0.65,
        "vTaxSum": Object {
          "16": Object {
            "gross": 0.65,
            "net": 0.56,
            "tax": 0.09,
          },
        },
      }
    `);
    //</editor-fold>
  });

  it("case 4: test discount order - number", async function() {
    let order = createOrder();
    addItem(order, cola, 1);
    addItem(order, fanta, 2);
    makeDiscount(order, "2");
    await nextTick();

    //<editor-fold desc="order-expect">
    expect(order).toMatchInlineSnapshot(`
      Object {
        "cancellationItems": Array [],
        "discount": "2",
        "items": Array [
          Object {
            "discount": 0.48,
            "name": "Cola",
            "originalPrice": 1.3,
            "price": 0.82,
            "quantity": 1,
            "tax": 16,
            "taxes": Array [
              16,
              32,
            ],
            "vDiscount": 0.48,
            "vSum": 0.82,
            "vTakeAway": false,
            "vTaxSum": Object {
              "16": Object {
                "gross": 0.82,
                "net": 0.71,
                "tax": 0.11,
              },
            },
          },
          Object {
            "discount": "38%",
            "name": "Fanta",
            "originalPrice": 2,
            "price": 1.24,
            "quantity": 2,
            "tax": 16,
            "taxes": Array [
              16,
              32,
            ],
            "vDiscount": 1.52,
            "vSum": 2.48,
            "vTakeAway": false,
            "vTaxSum": Object {
              "16": Object {
                "gross": 2.48,
                "net": 2.14,
                "tax": 0.34,
              },
            },
          },
        ],
        "status": "inProgress",
        "takeAway": false,
        "vDiscount": 2,
        "vSum": 3.3,
        "vTaxSum": Object {
          "16": Object {
            "gross": 3.3,
            "net": 2.85,
            "tax": 0.45,
          },
        },
      }
    `);
    //</editor-fold>

    makeDiscount(order, 1);
    await nextTick();
    expect(order).toMatchInlineSnapshot(`
      Object {
        "cancellationItems": Array [],
        "discount": 1,
        "items": Array [
          Object {
            "discount": 0.24,
            "name": "Cola",
            "originalPrice": 1.3,
            "price": 1.06,
            "quantity": 1,
            "tax": 16,
            "taxes": Array [
              16,
              32,
            ],
            "vDiscount": 0.24,
            "vSum": 1.06,
            "vTakeAway": false,
            "vTaxSum": Object {
              "16": Object {
                "gross": 1.06,
                "net": 0.91,
                "tax": 0.15,
              },
            },
          },
          Object {
            "discount": "19%",
            "name": "Fanta",
            "originalPrice": 2,
            "price": 1.62,
            "quantity": 2,
            "tax": 16,
            "taxes": Array [
              16,
              32,
            ],
            "vDiscount": 0.76,
            "vSum": 3.24,
            "vTakeAway": false,
            "vTaxSum": Object {
              "16": Object {
                "gross": 3.24,
                "net": 2.79,
                "tax": 0.45,
              },
            },
          },
        ],
        "status": "inProgress",
        "takeAway": false,
        "vDiscount": 1,
        "vSum": 4.3,
        "vTaxSum": Object {
          "16": Object {
            "gross": 4.300000000000001,
            "net": 3.7,
            "tax": 0.6,
          },
        },
      }
    `);
  });

  it("case 5: vTaxSum", async function() {
    let order = createOrder();
    addItem(order, cola, 1);
    addItem(order, fanta, 2);
    addItem(order, rice, 2);
    //makeDiscount(order, "2");
    await nextTick();

    //<editor-fold desc="order-expect">
    expect(order).toMatchInlineSnapshot(`
      Object {
        "cancellationItems": Array [],
        "items": Array [
          Object {
            "name": "Cola",
            "price": 1.3,
            "quantity": 1,
            "tax": 16,
            "taxes": Array [
              16,
              32,
            ],
            "vSum": 1.3,
            "vTakeAway": false,
            "vTaxSum": Object {
              "16": Object {
                "gross": 1.3,
                "net": 1.12,
                "tax": 0.18,
              },
            },
          },
          Object {
            "name": "Fanta",
            "price": 2,
            "quantity": 2,
            "tax": 16,
            "taxes": Array [
              16,
              32,
            ],
            "vSum": 4,
            "vTakeAway": false,
            "vTaxSum": Object {
              "16": Object {
                "gross": 4,
                "net": 3.45,
                "tax": 0.55,
              },
            },
          },
          Object {
            "name": "Rice",
            "price": 10,
            "quantity": 2,
            "tax": 5,
            "taxes": Array [
              5,
              10,
            ],
            "vSum": 20,
            "vTakeAway": false,
            "vTaxSum": Object {
              "5": Object {
                "gross": 20,
                "net": 19.05,
                "tax": 0.95,
              },
            },
          },
        ],
        "takeAway": false,
        "vSum": 25.3,
        "vTaxSum": Object {
          "16": Object {
            "gross": 5.3,
            "net": 4.57,
            "tax": 0.73,
          },
          "5": Object {
            "gross": 20,
            "net": 19.05,
            "tax": 0.95,
          },
        },
      }
    `);
    //</editor-fold>
  });

  it("case 5a: vTaxSum", async function() {
    const ketchup = { name: "Add Ketchup", price: 3, quantity: 1 };
    let order = createOrder();
    //addItem(order, cola, 1);
    addItem(order, rice, 2);
    addModifier(order, ketchup);
    //makeDiscount(order, "2");
    await nextTick();

    //<editor-fold desc="order-expect">
    expect(order).toMatchInlineSnapshot(`
      Object {
        "cancellationItems": Array [],
        "items": Array [
          Object {
            "modifiers": Array [
              Object {
                "name": "Add Ketchup",
                "price": 3,
                "quantity": 1,
              },
            ],
            "name": "Rice",
            "price": 10,
            "quantity": 2,
            "tax": 5,
            "taxes": Array [
              5,
              10,
            ],
            "vSum": 26,
            "vTakeAway": false,
            "vTaxSum": Object {
              "5": Object {
                "gross": 26,
                "net": 24.76,
                "tax": 1.24,
              },
            },
          },
        ],
        "status": "inProgress",
        "takeAway": false,
        "vSum": 26,
        "vTaxSum": Object {
          "5": Object {
            "gross": 26,
            "net": 24.76,
            "tax": 1.24,
          },
        },
      }
    `);
    //</editor-fold>
  });

  it("case 6: partTax (menu)", async function() {
    const foodTax = { taxes: [5, 10] };
    const drinkTax = { taxes: [16, 32] };

    //price: 5 euro
    //partTax: {tax: 2, taxes:[]}

    const cola = { name: "Cola", price: 1.3, quantity: 1, ...drinkTax };
    const fanta = { name: "Fanta", price: 2, quantity: 1, ...drinkTax };
    const rice = { name: "Rice", price: 10, quantity: 1, ...foodTax };
    const menu = {
      name: "Keybap Menu",
      price: 10,
      quantity: 1,
      ...foodTax,
      partTax: { ...drinkTax, pricePart: 2 }
    };
    let order = createOrder();
    addItem(order, menu, 1);
    //makeTakeaway(order, true);
    /*addItem(order, cola, 1);
    addItem(order, fanta, 2);
    addItem(order, rice, 2);*/
    //makeDiscount(order, "2");
    await nextTick();

    //<editor-fold desc="order-expect">
    expect(order).toMatchInlineSnapshot(`
      Object {
        "cancellationItems": Array [],
        "items": Array [
          Object {
            "name": "Keybap Menu",
            "partTax": Object {
              "pricePart": 2,
              "tax": 16,
              "taxes": Array [
                16,
                32,
              ],
            },
            "price": 10,
            "quantity": 1,
            "tax": 5,
            "taxes": Array [
              5,
              10,
            ],
            "vSum": 10,
            "vTakeAway": false,
            "vTaxSum": Object {
              "16": Object {
                "gross": 2,
                "net": 1.9,
                "tax": 0.1,
              },
              "5": Object {
                "gross": 8,
                "net": 7.62,
                "tax": 0.38,
              },
            },
          },
        ],
        "takeAway": false,
        "vSum": 10,
        "vTaxSum": Object {
          "16": Object {
            "gross": 2,
            "net": 1.9,
            "tax": 0.1,
          },
          "5": Object {
            "gross": 8,
            "net": 7.62,
            "tax": 0.38,
          },
        },
      }
    `);
    //</editor-fold>
  });

  it("case 6b: partTax (menu) - discount", async function() {
    const foodTax = { taxes: [5, 10] };
    const drinkTax = { taxes: [16, 32] };

    //price: 5 euro
    //partTax: {tax: 2, taxes:[]}

    const cola = { name: "Cola", price: 1.3, quantity: 1, ...drinkTax };
    const fanta = { name: "Fanta", price: 2, quantity: 1, ...drinkTax };
    const rice = { name: "Rice", price: 10, quantity: 1, ...foodTax };
    const menu = {
      name: "Keybap Menu",
      price: 10,
      quantity: 1,
      ...foodTax,
      partTax: { ...drinkTax, pricePart: 2 }
    };
    let order = createOrder();
    addItem(order, menu, 1);
    makeLastItemDiscount(order, "40%");
    //makeTakeaway(order, true);
    /*addItem(order, cola, 1);
    addItem(order, fanta, 2);
    addItem(order, rice, 2);*/
    //makeDiscount(order, "2");
    await nextTick();

    //<editor-fold desc="order-expect">
    expect(order).toMatchInlineSnapshot(`
      Object {
        "cancellationItems": Array [],
        "items": Array [
          Object {
            "discount": "40%",
            "name": "Keybap Menu",
            "originalPrice": 10,
            "partTax": Object {
              "originalPricePart": 2,
              "pricePart": 1.2,
              "tax": 16,
              "taxes": Array [
                16,
                32,
              ],
            },
            "price": 6,
            "quantity": 1,
            "tax": 5,
            "taxes": Array [
              5,
              10,
            ],
            "vDiscount": 4,
            "vSum": 6,
            "vTakeAway": false,
            "vTaxSum": Object {
              "16": Object {
                "gross": 1.2,
                "net": 1.14,
                "tax": 0.06,
              },
              "5": Object {
                "gross": 4.8,
                "net": 4.57,
                "tax": 0.23,
              },
            },
          },
        ],
        "takeAway": false,
        "vDiscount": 4,
        "vSum": 6,
        "vTaxSum": Object {
          "16": Object {
            "gross": 1.2,
            "net": 1.14,
            "tax": 0.06,
          },
          "5": Object {
            "gross": 4.8,
            "net": 4.57,
            "tax": 0.23,
          },
        },
      }
    `);
    //</editor-fold>
  });

  it("case7: test single payment", async function() {
    let order = createOrder();
    addItem(order, cola, 1);
    addItem(order, fanta, 2);

    await nextTick();
    addSinglePayment(order, { type: "cash", value: 53 });
    addPayment(order, { type: "Sodexo", value: 5 });

    await nextTick();
    //<editor-fold desc="order-expect">
    expect([order.payment, order.cashback]).toMatchInlineSnapshot(`
      Array [
        Array [
          Object {
            "type": "cash",
            "value": 53,
          },
          Object {
            "type": "Sodexo",
            "value": 5,
          },
        ],
        47.7,
      ]
    `);
    //</editor-fold>

    updateSinglePayment(order, { type: "card", value: 100 });
    await nextTick();

    expect([order.payment, order.cashback, order.tip]).toMatchInlineSnapshot(`
      Array [
        Array [
          Object {
            "type": "card",
            "value": 100,
          },
          Object {
            "type": "Sodexo",
            "value": 5,
          },
        ],
        0,
        99.7,
      ]
    `);
    updateSinglePayment(order, { type: "cash", value: 50 });
    await nextTick();
    expect([order.payment, order.cashback, order.tip]).toMatchInlineSnapshot(`
      Array [
        Array [
          Object {
            "type": "cash",
            "value": 50,
          },
          Object {
            "type": "Sodexo",
            "value": 5,
          },
        ],
        49.7,
        0,
      ]
    `);
  });

  it("case7a : test multi payment tip", async function() {
    let order = createOrder();
    addItem(order, cola, 10);
    addItem(order, fanta, 20);

    await nextTick();
    addMultiPayment(order, { type: "cash", value: 10 });
    await nextTick();
    addMultiPayment(order, { type: "card", value: 60 });

    //auto add tip
    await nextTick();
    //<editor-fold desc="order-expect">
    expect([order.vSum, order.payment, order.cashback, order.tip])
      .toMatchInlineSnapshot(`
      Array [
        53,
        Array [
          Object {
            "type": "cash",
            "value": 10,
          },
          Object {
            "type": "card",
            "value": 60,
          },
        ],
        10,
        7,
      ]
    `);
    //</editor-fold>
  });

  it("case7b : test multi payment", async function() {
    let order = createOrder();
    addItem(order, cola, 10);
    addItem(order, fanta, 20);

    await nextTick();
    addMultiPayment(order, { type: "cash", value: 10 });
    await nextTick();
    addMultiPayment(order, { type: "card", value: getRestTotal(order) });

    //auto add tip
    await nextTick();
    //<editor-fold desc="order-expect">
    expect([order.payment, order.cashback, order.tip]).toMatchInlineSnapshot(`
      Array [
        Array [
          Object {
            "type": "cash",
            "value": 10,
          },
          Object {
            "type": "card",
            "value": 43,
          },
        ],
        undefined,
        undefined,
      ]
    `);
    //</editor-fold>
  });

  it("case7c : test multi payment cashback", async function() {
    let order = createOrder();
    addItem(order, cola, 10);
    addItem(order, fanta, 20);
    await nextTick();
    addMultiPayment(order, { type: "cash", value: 10 });
    await nextTick();
    addMultiPayment(order, { type: "card", value: 50 });
    //auto add tip
    await nextTick();
    //<editor-fold desc="order-expect">
    expect([order.vSum, order.payment, order.cashback, order.tip])
      .toMatchInlineSnapshot(`
      Array [
        53,
        Array [
          Object {
            "type": "cash",
            "value": 10,
          },
          Object {
            "type": "card",
            "value": 50,
          },
        ],
        7,
        0,
      ]
    `);
    //</editor-fold>
  });

  it("case7d: tip and cashback should be 0 when total payment lower than vSum", async function() {
    let order = createOrder();
    addItem(order, cola, 10);
    addItem(order, fanta, 20);
    await nextTick();
    addSinglePayment(order, { type: "cash", value: 10 });
    expect([order.vSum, order.payment, order.cashback, order.tip])
      .toMatchInlineSnapshot(`
      Array [
        53,
        Array [
          Object {
            "type": "cash",
            "value": 10,
          },
        ],
        0,
        0,
      ]
    `);
  });

  it("case 8: cancellationItems", async function() {
    let order = createOrder();
    addItem(order, cola, 10);
    addItem(order, fanta, 20);
    removeItem(order, 0, 3);
    await nextTick();
    //<editor-fold desc="order-expect">
    expect(order).toMatchInlineSnapshot(`
      Object {
        "cancellationItems": Array [
          Object {
            "name": "Cola",
            "price": 1.3,
            "quantity": 3,
            "taxes": Array [
              16,
              32,
            ],
          },
        ],
        "items": Array [
          Object {
            "name": "Cola",
            "price": 1.3,
            "quantity": 7,
            "tax": 16,
            "taxes": Array [
              16,
              32,
            ],
            "vSum": 9.1,
            "vTakeAway": false,
            "vTaxSum": Object {
              "16": Object {
                "gross": 9.1,
                "net": 7.84,
                "tax": 1.26,
              },
            },
          },
          Object {
            "name": "Fanta",
            "price": 2,
            "quantity": 20,
            "tax": 16,
            "taxes": Array [
              16,
              32,
            ],
            "vSum": 40,
            "vTakeAway": false,
            "vTaxSum": Object {
              "16": Object {
                "gross": 40,
                "net": 34.48,
                "tax": 5.52,
              },
            },
          },
        ],
        "payment": Array [],
        "status": "inProgress",
        "takeAway": false,
        "vSum": 49.1,
        "vTaxSum": Object {
          "16": Object {
            "gross": 49.1,
            "net": 42.31999999999999,
            "tax": 6.779999999999999,
          },
        },
      }
    `);
    //</editor-fold>
  });

  it("case 8b: cancellationItems remove all quantity", async function() {
    let order = createOrder();
    addItem(order, cola, 10);
    addItem(order, fanta, 20);
    removeItem(order, 0, 10);
    await nextTick();
    //<editor-fold desc="order-expect">
    expect(order).toMatchInlineSnapshot(`
      Object {
        "cancellationItems": Array [
          Object {
            "name": "Cola",
            "price": 1.3,
            "quantity": 10,
            "taxes": Array [
              16,
              32,
            ],
          },
        ],
        "items": Array [
          Object {
            "name": "Fanta",
            "price": 2,
            "quantity": 20,
            "tax": 16,
            "taxes": Array [
              16,
              32,
            ],
            "vSum": 40,
            "vTakeAway": false,
            "vTaxSum": Object {
              "16": Object {
                "gross": 40,
                "net": 34.48,
                "tax": 5.52,
              },
            },
          },
        ],
        "payment": Array [],
        "status": "inProgress",
        "takeAway": false,
        "vSum": 40,
        "vTaxSum": Object {
          "16": Object {
            "gross": 40,
            "net": 34.48,
            "tax": 5.52,
          },
        },
      }
    `);
    //</editor-fold>
  });

  it("case 9: cancel order", async function() {
    let order = createOrder();
    addItem(order, cola, 10);
    addItem(order, fanta, 20);
    cancelOrder(order);
    await nextTick();
    //<editor-fold desc="order-expect">
    expect(order).toMatchInlineSnapshot(`
      Object {
        "cancellationItems": Array [],
        "items": Array [
          Object {
            "name": "Cola",
            "price": 1.3,
            "quantity": 10,
            "tax": 16,
            "taxes": Array [
              16,
              32,
            ],
            "vSum": 13,
            "vTakeAway": false,
            "vTaxSum": Object {
              "16": Object {
                "gross": 13,
                "net": 11.21,
                "tax": 1.79,
              },
            },
          },
          Object {
            "name": "Fanta",
            "price": 2,
            "quantity": 20,
            "tax": 16,
            "taxes": Array [
              16,
              32,
            ],
            "vSum": 40,
            "vTakeAway": false,
            "vTaxSum": Object {
              "16": Object {
                "gross": 40,
                "net": 34.48,
                "tax": 5.52,
              },
            },
          },
        ],
        "payment": Array [],
        "status": "cancelled",
        "takeAway": false,
        "vSum": 53,
        "vTaxSum": Object {
          "16": Object {
            "gross": 53,
            "net": 45.69,
            "tax": 7.31,
          },
        },
      }
    `);
    //</editor-fold>
  });

  it("case 10: vDate", async function() {
    let order = createOrder();
    order.date = dayjs("01.01.2021 11:11:11", "DD.MM.YYYY HH:");
    await nextTick();
    //<editor-fold desc="order-expect">
    expect(order).toMatchInlineSnapshot(`
      Object {
        "cancellationItems": Array [],
        "date": "2021-01-01T04:11:11.000Z",
        "items": Array [],
        "payment": Array [],
        "status": "inProgress",
        "takeAway": false,
        "vDate": 2020-12-31T17:00:00.000Z,
        "vSum": 0,
        "vTaxSum": Object {},
      }
    `);
    //</editor-fold>
  });

  it("case 11: course", async function() {
    let order = createOrder();
    addItem(order, cola, 1);
    changeCourse(order, 0, -1);
    //should be takeAway
    await nextTick();

    changeCourse(order, 0, 1);
    await nextTick();
    //<editor-fold desc="order-expect">
    expect(stringify(order)).toMatchInlineSnapshot(`
      Object {
        "_id": "ObjectID",
        "cancellationItems": Array [],
        "items": Array [
          Object {
            "_id": "ObjectID",
            "course": 1,
            "name": "Cola",
            "price": 1.3,
            "quantity": 1,
            "takeAway": false,
            "tax": 16,
            "taxes": Array [
              16,
              32,
            ],
            "vSum": 1.3,
            "vTakeAway": false,
            "vTaxSum": Object {
              "16": Object {
                "gross": 1.3,
                "net": 1.12,
                "tax": 0.18,
              },
            },
          },
        ],
        "payment": Array [],
        "status": "inProgress",
        "takeAway": false,
        "user": Array [],
        "vDate": "2021-01-10T17:00:00.000Z",
        "vSum": 1.3,
        "vTaxSum": Object {
          "16": Object {
            "gross": 1.3,
            "net": 1.12,
            "tax": 0.18,
          },
        },
      }
    `);
    //</editor-fold>
  });

  it("case 12: compact order", async function() {
    let order = createOrder();
    addItem(order, cola, 5);
    await nextTick();
    addItem(order, fanta, 10);
    await nextTick();

    simulateBackendPrint(order);
    await nextTick();
    addItem(order, cola, 5);
    await nextTick();
    //compact
    mergeSameItems(order);
    await nextTick();

    //<editor-fold desc="order-expect">
    expect(stringify(order)).toMatchInlineSnapshot(`
      Object {
        "_id": "ObjectID",
        "cancellationItems": Array [],
        "items": Array [
          Object {
            "_id": "ObjectID",
            "course": 1,
            "name": "Cola",
            "price": 1.3,
            "printed": true,
            "quantity": 10,
            "sent": true,
            "tax": 16,
            "taxes": Array [
              16,
              32,
            ],
            "vSum": 13,
            "vTakeAway": false,
            "vTaxSum": Object {
              "16": Object {
                "gross": 13,
                "net": 11.21,
                "tax": 1.79,
              },
            },
          },
          Object {
            "_id": "ObjectID",
            "course": 1,
            "name": "Fanta",
            "price": 2,
            "printed": true,
            "quantity": 10,
            "sent": true,
            "tax": 16,
            "taxes": Array [
              16,
              32,
            ],
            "vSum": 20,
            "vTakeAway": false,
            "vTaxSum": Object {
              "16": Object {
                "gross": 20,
                "net": 17.24,
                "tax": 2.76,
              },
            },
          },
        ],
        "payment": Array [],
        "status": "inProgress",
        "takeAway": false,
        "user": Array [],
        "vDate": "2021-01-16T17:00:00.000Z",
        "vSum": 33,
        "vTaxSum": Object {
          "16": Object {
            "gross": 33,
            "net": 28.45,
            "tax": 4.55,
          },
        },
      }
    `);
    //</editor-fold>
  });
});
