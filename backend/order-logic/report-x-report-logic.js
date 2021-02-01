const {renderPivotTable} = require('./pivot')
const orm = require("schemahandler");
const {fromReducer, quantityReducer, toReducer, vTaxSumReducer} = require("./report-shared");
let Order = orm("Order");
const _ = require('lodash');

async function xReport(from, to) {
  const query = {
    date: {
      ...from && {$gte: from},
      ...to && {$lte: to},
    },
    status: "paid"
  };

  let orders = await Order.find(query);

  let paidOrder = orders.filter(o => o.status === "paid");
  //items base
  const items = _.reduce(
    orders,
    (items, order) => {
      return items.concat(
        order.items.map(i => Object.assign(i, { orderDate: order.date }))
      );
    },
    []
  );

  let groupItemsByCategory = renderPivotTable(
    {
      rows: ["name"],
      columns: ["category"],
      reducers: ["@sum[2]:vSum", '@sum:quantity']
    },
    items
  );

  let sumByCategory = renderPivotTable(
    {
      rows: ["category"],
      //columns: ["@date[DD.MM.YYYY]:orderDate"],
      reducers: ["@sum[2]:vSum"]
    },
    items
  );

  let sumByPayment = renderPivotTable(
    {
      rows: ["payment.0.type"],
      //columns: ["@date[DD.MM.YYYY]:vDate"],
      reducers: ["@sum[2]:vSum"]
    },
    paidOrder
  );

  let sumByTakeout = renderPivotTable(
    {
      rows: ["takeout"],
      //columns: ["@date[DD.MM.YYYY]:orderDate"],
      reducers: ["@sum[2]:vSum"]
    },
    items
  );

  let report = renderPivotTable(
    {
      reducers: [fromReducer, toReducer, vTaxSumReducer, "@sum[2]:discount"]
    },
    paidOrder
  );

  return {
    groupItemsByCategory,
    sumByCategory,
    sumByPayment,
    sumByTakeout,
    report
  }
}

module.exports = {xReport};
