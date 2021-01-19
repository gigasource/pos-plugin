import {renderPivotTable} from "./pivot";
const orm = require("schemahandler");
const {fromReducer, quantityReducer, toReducer, vTaxSumReducer} = require("./report-shared");
let Order = orm("Order");
const _ = require('lodash');

async function staffReport(from, to) {
  const query = {
    date: {
      ...from && {$gte: from},
      ...to && {$lte: to},
    }
  };

  let orders = await Order.find(query);

  //groupByPayment
  const payment = orders.reduce((r, order) => r.concat(...order.payment), []);

  let groupByPayment = renderPivotTable(
    {
      columns: ["type"],
      reducers: ["@sum[2]:value"]
    },
    payment
  );

  //sales
  let userSales = renderPivotTable(
    {
      rows: [],
      columns: ["user.0.name"],
      reducers: [vTaxSumReducer, "@sum[2]:vDiscount", fromReducer, toReducer]
    },
    orders
  );

  let groupByStatus = renderPivotTable(
    {
      rows: ["status"],
      columns: ["user.0.name"],
      reducers: ["@sum[2]:vSum"]
    },
    orders
  );

  return {
    groupByPayment,
    userSales,
    groupByStatus
  }
}

module.exports = {staffReport};
