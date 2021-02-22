const {renderPivotTable} = require('./pivot')
const orm = require("schemahandler");
let Order = orm("Order");
const _ = require('lodash');

async function monthReport(from, to) {
  const query = {
    date: {
      ...from && {$gte: from},
      ...to && {$lte: to},
    },
    status: {$in: ["paid", "cancelled", ]}
  };

  const orders = await Order.find(query);
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

  let total = renderPivotTable(
    {
      reducers: ["@sum[2]:vSum"]
    },
    items
  );

  const payment = orders.reduce((r, order) => r.concat(...order.payment), []);

  let salesByPayment = renderPivotTable(
    {
      columns: ["type"],
      reducers: ["@sum[2]:value"]
    },
    payment
  );

  const salesByCategory = renderPivotTable(
    {
      columns: ["category"],
      reducers: ["@sum[2]:vSum", "@sum:quantity"]
    },
    items
  );

  //salesByCategory
  const salesByCategoryName = renderPivotTable(
    {
      rows: ["name"],
      columns: ["category"],
      reducers: ["@sum[2]:vSum", "@sum:quantity"]
    },
    items
  );

  const zNumbers = renderPivotTable(
    {
      rows: ["z"],
      columns: ["@date[DD.MM.YYYY]:vDate"],
      reducers: ["@sum[2]:vSum"]
    },
    orders
  );


  return {
    total,
    salesByPayment,
    salesByCategory,
    salesByCategoryName,
    zNumbers
  }
}

module.exports = {monthReport};
