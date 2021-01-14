import {renderPivotTable} from "./pivot";
const orm = require("schemahandler");
const {fromReducer, quantityReducer, toReducer, vTaxSumReducer} = require("./report-shared");
let Order = orm("Order");
const _ = require('lodash');

async function eodReport(z) {
  //todo: query z
  const query = {};
  if (z) query.z = z;
  const orders = await Order.find(query);
  const paidOrders = orders.filter(o => o.status === 'paid');

  const report = renderPivotTable({
    reducers: [
      "@sum[2]:vSum",
      "@sum[2]:vDiscount",
      vTaxSumReducer,
      quantityReducer,
      fromReducer,
      toReducer
    ]
  }, paidOrders);

  const payments = paidOrders.reduce((r, order) => r.concat(...order.payment), []);

  const reportByPayment = renderPivotTable({
    columns: ["type"],
    reducers: ["@sum[2]:value"]
  }, payments);

  const cancelledOrders = orders.filter(o => o.status === 'cancelled');

  const cancelledReport = renderPivotTable({
    columns: ["status"],
    reducers: ["@sum[2]:vSum"]
  }, cancelledOrders);

  return {
    report,
    reportByPayment,
    cancelledReport
  }
}

module.exports = {eodReport};
