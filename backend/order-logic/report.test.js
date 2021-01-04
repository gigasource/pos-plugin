//<editor-fold desc="declare">
import { nextTick } from "vue";
import { renderPivotTable } from "./pivot";
import { makePaid, mergeVTaxGroup } from "./pos-logic";

const _ = require("lodash");

const orm = require("schemahandler");

const {
  makeDiscount,
  makeTakeaway,
  addModifier,
  addItem,
  createOrder,
  makeLastItemDiscount
} = require("./pos-logic");

const delay = require("delay");
orm.connect("mongodb://localhost:27017", "tseReport");

let Order = orm("Order");

async function prepareDb() {
  await Order.remove({});
  const foodTax = { taxes: [5, 10] };
  const drinkTax = { taxes: [16, 32] };

  const cola = { name: "Cola", price: 1.3, quantity: 1, ...drinkTax };
  const fanta = { name: "Fanta", price: 2, quantity: 1, ...drinkTax };
  const rice = { name: "Rice", price: 10, quantity: 1, ...foodTax };
  const ketchup = { name: "Add Ketchup", price: 3, quantity: 1 };

  async function makeOrder(initValue, cb) {
    let order = createOrder(initValue);
    if (cb) await cb(order);
    makePaid(order);
    await nextTick();
    await Order.create(order);
  }

  await makeOrder({ date: new Date() }, async order => {
    addItem(order, cola, 1);
    addItem(order, fanta, 2);
  });

  await makeOrder({ date: new Date() }, async order => {
    addItem(order, cola, 1);
    addItem(order, rice, 2);
    addModifier(order, ketchup);
  });

  await makeOrder({ date: new Date() }, async order => {
    addItem(order, cola, 1);
    makeTakeaway(order);
  });

  await makeOrder({ date: new Date() }, async order => {
    addItem(order, cola, 1);
    makeLastItemDiscount(order, "40%");
  });
}

const items = [
  { name: "A1", price: 10, quantity: 1, tax: 7, group: "G1", takeAway: true },
  { name: "A2", price: 10, quantity: 1, tax: 19, group: "G2", takeAway: true },
  { name: "A3", price: 10, quantity: 1, tax: 7, group: "G1", takeAway: true },
  { name: "A4", price: 10, quantity: 1, tax: 7, group: "G2", takeAway: true },
  { name: "A5", price: 10, quantity: 1, tax: 7, group: "G1" },
  { name: "A6", price: 10, quantity: 1, tax: 19, group: "G2" },
  { name: "A7", price: 10, quantity: 1, tax: 19, group: "G1" },
  { name: "A8", price: 10, quantity: 1, tax: 19, group: "G2" },
  { name: "A9", price: 10, quantity: 1, tax: 7, group: "G1" }
];

beforeAll(async () => {
  await prepareDb();
});
//</editor-fold>

describe("pos-logic", function() {
  it("case 0: test pivot", async function() {
    const pivot = {
      rows: ["tax"],
      columns: ["group"],
      reducers: ["@sum:quantity"]
    };

    const result = renderPivotTable(pivot, items);
    expect(result).toMatchSnapshot();
  });

  it("case 0 b: test pivot", async function() {
    const pivot = {
      rows: ["tax"],
      columns: [
        {
          label: "takeAway",
          fn: i => (i.takeAway ? "takeAway" : "dineIn")
        }
      ],
      reducers: ["@sum:quantity"]
    };

    const result = renderPivotTable(pivot, items);
    expect(result).toMatchSnapshot();
  });

  it("case 1: test item-tax", async function() {
    const orders = await Order.find({});

    const pivot = {
      rows: ["status"],
      columns: [
        { label: "takeAway", fn: i => (i.takeAway ? "takeAway" : "dineIn") }
      ],
      reducers: [
        "@sum[2]:vSum",
        "@sum[2]:vDiscount",
        {
          label: "vTaxSum",
          fn(result, order) {
            const { vTaxSum } = order;
            _.mergeWith(result.vTaxSum, vTaxSum, mergeVTaxGroup);

            _.assign(result, { gross: 0, net: 0, tax: 0 });

            for (const k of Object.keys(result.vTaxSum)) {
              const { gross, net, tax } = result.vTaxSum[k];
              result.gross += gross;
              result.net += net;
              result.tax += tax;
            }

            return result;
          },
          initValue: { vTaxSum: {} }
        },
        {
          label: "quantity",
          fn : q => q + 1
        },
        {
          label: "from",
          fn(_from, order) {
            if (_from === undefined) return order.date;
            if (_from > order.date) return order.date;
            return _from;
          },
          initValue: "undefined"
        },
        {
          label: "to",
          fn(_to, order) {
            if (_to === undefined) return order.date;
            if (_to < order.date) return order.date;
            return _to;
          },
          initValue: "undefined"
        }
      ]
    };

    const result = renderPivotTable(pivot, orders);

    expect(result).toMatchInlineSnapshot(`
      Object {
        "dineIn": Object {
          "paid": Object {
            "from": 2021-01-04T01:14:47.744Z,
            "quantity": 3,
            "to": 2021-01-04T01:14:47.761Z,
            "vDiscount": 0.52,
            "vSum": 33.38,
            "vTaxSum": Object {
              "gross": 33.38,
              "net": 31.12,
              "tax": 2.26,
              "vTaxSum": Object {
                "16": Object {
                  "gross": 7.38,
                  "net": 6.36,
                  "tax": 1.02,
                },
                "5": Object {
                  "gross": 26,
                  "net": 24.76,
                  "tax": 1.24,
                },
              },
            },
          },
        },
        "takeAway": Object {
          "paid": Object {
            "from": 2021-01-04T01:14:47.759Z,
            "quantity": 1,
            "to": 2021-01-04T01:14:47.759Z,
            "vDiscount": 0,
            "vSum": 1.3,
            "vTaxSum": Object {
              "gross": 1.3,
              "net": 0.98,
              "tax": 0.32,
              "vTaxSum": Object {
                "32": Object {
                  "gross": 1.3,
                  "net": 0.98,
                  "tax": 0.32,
                },
              },
            },
          },
        },
      }
    `);
  });
});
