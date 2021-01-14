//<editor-fold desc="declare">
import {nextTick} from "vue";
import {renderPivotTable} from "./pivot";
import {
  addPayment,
  addUser,
  cancelOrder,
  makeEOD,
  makePaid,
  mergeVTaxGroup,
  removeItem
} from "./pos-logic";
import {eodReport} from "./report-eod-logic";
import {eodReportCalender} from "./report-eod-calender-logic";
import {monthReport} from "./report-month-report";
import {staffReport} from "./report-staff-logic";
import {xReport} from "./report-x-report-logic";

const _ = require("lodash");
const moment = require("moment");

const orm = require("schemahandler");

const {
  makeDiscount,
  makeTakeaway,
  addModifier,
  addItem,
  createOrder,
  makeLastItemDiscount
} = require("../../components2/OrderView/pos-logic");

const delay = require("delay");
orm.connect("mongodb://localhost:27017", "tseReport");

let Order = orm("Order");

const items = [
  {name: "A1", price: 10, quantity: 1, tax: 7, group: "G1", takeAway: true},
  {name: "A2", price: 10, quantity: 1, tax: 19, group: "G2", takeAway: true},
  {name: "A3", price: 10, quantity: 1, tax: 7, group: "G1", takeAway: true},
  {name: "A4", price: 10, quantity: 1, tax: 7, group: "G2", takeAway: true},
  {name: "A5", price: 10, quantity: 1, tax: 7, group: "G1"},
  {name: "A6", price: 10, quantity: 1, tax: 19, group: "G2"},
  {name: "A7", price: 10, quantity: 1, tax: 19, group: "G1"},
  {name: "A8", price: 10, quantity: 1, tax: 19, group: "G2"},
  {name: "A9", price: 10, quantity: 1, tax: 7, group: "G1"}
];

let fromReducer = {
  label: "from",
  fn(_from, order) {
    if (_from === undefined) return order.date;
    if (_from > order.date) return order.date;
    return _from;
  },
  initValue: "undefined"
};
let toReducer = {
  label: "to",
  fn(_to, order) {
    if (_to === undefined) return order.date;
    if (_to < order.date) return order.date;
    return _to;
  },
  initValue: "undefined"
};
let vTaxSumReducer = {
  label: "vTaxSum",
  fn(result, order) {
    const {vTaxSum} = order;
    _.mergeWith(result.vTaxSum, vTaxSum, mergeVTaxGroup);
    _.assign(result, {gross: 0, net: 0, tax: 0});

    for (const k of Object.keys(result.vTaxSum)) {
      const {gross, net, tax} = result.vTaxSum[k];
      result.gross += gross;
      result.net += net;
      result.tax += tax;
    }

    result.gross = _.round(result.gross, 2);
    result.net = _.round(result.net, 2);
    result.tax = _.round(result.tax, 2);

    return result;
  },
  initValue: {vTaxSum: {}}
};
let quantityReducer = {
  label: "quantity",
  fn: q => q + 1
};

beforeAll(async () => {
  await prepareDb();
});

function makeDate(str) {
  return moment(str, "DD.MM.YYYY").toDate();
}

//</editor-fold>

//<editor-fold desc="prepareDb">
async function prepareDb() {
  await Order.remove({});
  const foodTax = {taxes: [5, 10]};
  const drinkTax = {taxes: [16, 32]};

  const cola = {name: "Cola", price: 1.3, category: "drink", ...drinkTax};
  const fanta = {name: "Fanta", price: 2, category: "drink", ...drinkTax};
  const rice = {name: "Rice", price: 10, category: "food", ...foodTax};
  const ketchup = {name: "Add Ketchup", price: 3};

  async function makeOrder(initValue, cb, afterPaidCb) {
    let order = createOrder(initValue);
    if (cb) await cb(order);
    makePaid(order);
    afterPaidCb && afterPaidCb(order);
    await nextTick();
    await Order.create(order);
  }

  await makeOrder({date: new Date()}, async order => {
    addItem(order, cola, 1);
    addItem(order, fanta, 2);
    addPayment(order, "cash");
    order.date = moment("05.01.2021", "DD.MM.YYYY").toDate();
    makeEOD(order, 1);
    addUser(order, "Waiter 1");
  });

  await makeOrder({date: new Date()}, async order => {
    addItem(order, cola, 1);
    addItem(order, rice, 2);
    removeItem(order, 1, 1);
    addModifier(order, ketchup);
    addPayment(order, [{type: "card", value: 2}, {type: "cash"}]);
    order.date = moment("05.01.2021", "DD.MM.YYYY").toDate();
    makeEOD(order, 1);
    addUser(order, "Waiter 2");
  });

  await makeOrder(
    {date: new Date()},
    async order => {
      addItem(order, cola, 2);
      removeItem(order, 0, 1);
      makeTakeaway(order);
      addPayment(order, "cash");
      order.date = moment("05.01.2021", "DD.MM.YYYY").toDate();
      makeEOD(order, 1);
      addUser(order, "Waiter 1");
    },
    async order => {
      cancelOrder(order);
    }
  );

  await makeOrder({date: new Date()}, async order => {
    addItem(order, cola, 1);
    makeLastItemDiscount(order, "40%");
    addPayment(order, "card");
    order.date = moment("06.01.2021", "DD.MM.YYYY").toDate();
    makeEOD(order, 2);
    addUser(order, "Waiter 1");
  });
}

//</editor-fold>

describe("pos-logic", function () {
  it("case 0: test pivot", async function () {
    const pivot = {
      rows: ["tax"],
      columns: ["group"],
      reducers: ["@sum:quantity"]
    };

    const result = renderPivotTable(pivot, items);
    expect(result).toMatchSnapshot();
  });

  it("case 0 b: test pivot", async function () {
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

  //EOD
  it("case 1: EOD", async function () {
    const {report, reportByPayment, cancelledReport} = await eodReport();
    expect(report).toMatchInlineSnapshot(`
      Object {
        "from": 2021-01-04T17:00:00.000Z,
        "quantity": 3,
        "to": 2021-01-05T17:00:00.000Z,
        "vDiscount": 0.52,
        "vSum": 20.38,
        "vTaxSum": Object {
          "gross": 20.38,
          "net": 18.74,
          "tax": 1.64,
          "vTaxSum": Object {
            "16": Object {
              "gross": 7.38,
              "net": 6.36,
              "tax": 1.02,
            },
            "5": Object {
              "gross": 13,
              "net": 12.38,
              "tax": 0.62,
            },
          },
        },
      }
    `);

    expect(reportByPayment).toMatchInlineSnapshot(`
      Object {
        "card": 2.78,
        "cash": 17.6,
      }
    `);

    expect(cancelledReport).toMatchInlineSnapshot(`
      Object {
        "cancelled": 1.3,
      }
    `);
  });

  //EOD calendar
  //from, to
  it("case 4: ordersByDate", async function () {
    //query from/to/paid
    const {ordersByDate} = await eodReportCalender();

    expect(ordersByDate).toMatchInlineSnapshot(`
      Object {
        "2021-01-04T17:00:00.000Z": Object {
          "1": Object {
            "from": 2021-01-04T17:00:00.000Z,
            "to": 2021-01-04T17:00:00.000Z,
            "vSum": 19.6,
          },
        },
        "2021-01-05T17:00:00.000Z": Object {
          "2": Object {
            "from": 2021-01-05T17:00:00.000Z,
            "to": 2021-01-05T17:00:00.000Z,
            "vSum": 0.78,
          },
        },
      }
    `);
  });

  it("case 5: month report", async function () {
    const {
      total,
      salesByPayment,
      salesByCategory,
      zNumbers
    } = await monthReport();

    expect(total).toMatchInlineSnapshot(`20.38`);

    expect(salesByPayment).toMatchInlineSnapshot(`
      Object {
        "card": 2.78,
        "cash": 17.6,
      }
    `);

    expect(salesByCategory).toMatchInlineSnapshot(`
      Object {
        "drink": Object {
          "Cola": Object {
            "quantity": 3,
            "vSum": 3.38,
          },
          "Fanta": Object {
            "quantity": 2,
            "vSum": 4,
          },
        },
        "food": Object {
          "Rice": Object {
            "quantity": 1,
            "vSum": 13,
          },
        },
      }
    `);

    expect(zNumbers).toMatchInlineSnapshot(`
      Object {
        "05.01.2021": Object {
          "1": 19.6,
        },
        "06.01.2021": Object {
          "2": 0.78,
        },
      }
    `);
  });

  it("case 7: staff report", async function () {
    const {groupByPayment, groupByStatus, userSales} = await staffReport();

    expect(groupByPayment).toMatchInlineSnapshot(`
      Object {
        "card": 2.78,
        "cash": 18.9,
      }
    `);

    expect(userSales).toMatchInlineSnapshot(`
      Object {
        "Waiter 1": Object {
          "from": 2021-01-04T17:00:00.000Z,
          "to": 2021-01-05T17:00:00.000Z,
          "vDiscount": 0.52,
          "vTaxSum": Object {
            "gross": 7.38,
            "net": 6.22,
            "tax": 1.16,
            "vTaxSum": Object {
              "16": Object {
                "gross": 6.08,
                "net": 5.24,
                "tax": 0.84,
              },
              "32": Object {
                "gross": 1.3,
                "net": 0.98,
                "tax": 0.32,
              },
            },
          },
        },
        "Waiter 2": Object {
          "from": 2021-01-04T17:00:00.000Z,
          "to": 2021-01-04T17:00:00.000Z,
          "vDiscount": 0,
          "vTaxSum": Object {
            "gross": 14.3,
            "net": 13.5,
            "tax": 0.8,
            "vTaxSum": Object {
              "16": Object {
                "gross": 1.3,
                "net": 1.12,
                "tax": 0.18,
              },
              "5": Object {
                "gross": 13,
                "net": 12.38,
                "tax": 0.62,
              },
            },
          },
        },
      }
    `);

    expect(groupByStatus).toMatchInlineSnapshot(`
      Object {
        "Waiter 1": Object {
          "cancelled": 1.3,
          "paid": 6.08,
        },
        "Waiter 2": Object {
          "paid": 14.3,
        },
      }
    `);

    //cancellation items:
    //về cơ bản là phải mapping từ pm cũ sang
    //thay đổi
  });

  it("case 8: x report", async function () {
    const {
      groupItemsByCategory,
      sumByCategory,
      sumByPayment,
      sumByTakeout,
      report
    } = await xReport()

    expect(groupItemsByCategory).toMatchInlineSnapshot(`
      Object {
        "drink": Object {
          "Cola": 4.68,
          "Fanta": 4,
        },
        "food": Object {
          "Rice": 13,
        },
      }
    `);

    expect(sumByCategory).toMatchInlineSnapshot(`
      Object {
        "05.01.2021": Object {
          "drink": 7.9,
          "food": 13,
        },
        "06.01.2021": Object {
          "drink": 0.78,
        },
      }
    `);

    expect(sumByPayment).toMatchInlineSnapshot(`
      Object {
        "05.01.2021": Object {
          "card": 14.3,
          "cash": 5.3,
        },
        "06.01.2021": Object {
          "card": 0.78,
        },
      }
    `);

    expect(sumByTakeout).toMatchInlineSnapshot(`
      Object {
        "05.01.2021": Object {
          "": 20.9,
        },
        "06.01.2021": Object {
          "": 0.78,
        },
      }
    `);

    expect(report).toMatchInlineSnapshot(`
      Object {
        "discount": 0,
        "from": 2021-01-04T17:00:00.000Z,
        "to": 2021-01-05T17:00:00.000Z,
        "vTaxSum": Object {
          "gross": 20.38,
          "net": 18.74,
          "tax": 1.64,
          "vTaxSum": Object {
            "16": Object {
              "gross": 7.38,
              "net": 6.36,
              "tax": 1.02,
            },
            "5": Object {
              "gross": 13,
              "net": 12.38,
              "tax": 0.62,
            },
          },
        },
      }
    `);
  });
});
