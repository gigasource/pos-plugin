import {renderPivotTable} from "./pivot";
const orm = require("schemahandler");
const {fromReducer, quantityReducer, toReducer, vTaxSumReducer} = require("./report-shared");
let Order = orm("Order");
const _ = require('lodash');

async function eodReportCalender(from, to) {
  const query = {
    ...from && {from},
    ...to && {to},
    status: "paid"
  };

  let orders = await Order.find(query);

  const ordersByDate = renderPivotTable({
    columns: ["@date:vDate", "z"],
    reducers: ["@sum[2]:vSum", fromReducer, toReducer]
  }, orders);

  return {
    ordersByDate
  }
}

module.exports = {eodReportCalender};
