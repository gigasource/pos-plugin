import {mergeVTaxGroup} from "../../components2/OrderView/pos-logic";
const _ = require('lodash');

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
    const { vTaxSum } = order;
    _.mergeWith(result.vTaxSum, vTaxSum, mergeVTaxGroup);
    _.assign(result, { gross: 0, net: 0, tax: 0 });

    for (const k of Object.keys(result.vTaxSum)) {
      const { gross, net, tax } = result.vTaxSum[k];
      result.gross += gross;
      result.net += net;
      result.tax += tax;
    }

    result.gross = _.round(result.gross, 2);
    result.net = _.round(result.net, 2);
    result.tax = _.round(result.tax, 2);

    return result;
  },
  initValue: { vTaxSum: {} }
};

let quantityReducer = {
  label: "quantity",
  fn: q => q + 1
};

module.exports = {
  fromReducer,
  toReducer,
  vTaxSumReducer,
  quantityReducer
}
