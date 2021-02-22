const {renderPivotTable} = require('./pivot')
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

  const cancelledItems = orders.reduce((list, order) => {
    if (order.status === 'cancelled') {
      list.push(...order.items, ...order.cancellationItems);
      return list;
    }
    list.push(...order.cancellationItems);
    return list;
  }, [])


  const cancelledItemReport = renderPivotTable({
    reducers: ["@sum[2]:vSum"]
  }, cancelledItems) || 0;

  //voucher:
  const voucherItems = paidOrders.reduce((list, order) => {
    list.push(...order.items.filter(i => i.isVoucher));
    return list;
  }, []);

  const voucherReport = {
    sold: renderPivotTable({
      reducers: ["@sum[2]:vSum"]
    }, voucherItems.filter(i => i.price >= 0)) || 0,
    used: renderPivotTable({
      reducers: ["@sum[2]:vSum"]
    }, voucherItems.filter(i => i.price < 0)) || 0
  }

  const items = paidOrders.reduce((list, order) => {
    list.push(...order.items);
    return list;
  }, []);

  const dineInReport = renderPivotTable({
    reducers: [vTaxSumReducer]
  }, items.filter(i => !i.vTakeAway));

  /*
  {
    "vTaxSum": {
      "10": {"tax": 1.18,"net": 11.82,"gross": 13},
    },
    "gross": 14.3,"net": 12.8,"tax": 1.5
  }
   */
  const takeAwayReport = renderPivotTable({
    reducers: [vTaxSumReducer]
  }, items.filter(i => i.vTakeAway));

  //todo: category


  return {
    report,
    reportByPayment,
    cancelledReport,
    paidOrders,
    cancelledItemReport,
    voucherReport,
    dineInReport,
    takeAwayReport
  }
}

module.exports = {eodReport};
