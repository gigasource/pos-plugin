const orm = require("schemahandler");
const {fromReducer, quantityReducer, toReducer, vTaxSumReducer} = require("./report-shared");
let Order = orm("Order");
const _ = require('lodash');
const {renderPivotTable} = require("./pivot");

async function staffReport(from, to) {
  const query = {
    date: {
      ...from && {$gte: new Date(from)},
      ...to && {$lte: new Date(to)},
    }
  };

  let orders = await Order.find(query);

  //todo: cashback, tip logic
  //groupByPayment
  const payment = orders.reduce((r, order) => r.concat(...order.payment.map(p => {
    return {
      ...p,
      user: _.get(order, 'user.0.name', '')
    }
  })), []);

  let groupByPayment = renderPivotTable(
    {
      columns: ['user', "type"],
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
