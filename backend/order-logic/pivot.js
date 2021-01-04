const _ = require('lodash');

function reducerMap(r) {
  if (typeof r === 'string') {
    if (_.startsWith(r, '@sum')) {
      const prop = r.split(':')[1];
      const _round = r.split(':')[0].slice(4);
      let roundNumber = parseInt(_.get(_round.match(/\[(.*)\]/), 1));
      return {
        fn: (sum, i) => sum + _.get(i, prop, 0),
        label: prop,
        ..._round.includes('[') && {
          format(n) {
            return _.round(n, roundNumber);
          }
        }
      }
    }
  }
  return r;
}

function renderPivotTable(pivot, items) {
  const result = {data: items};

  const reducers = pivot.reducers.map(reducerMap);

  result.reducer = reducers[0];
  result.reducers = reducers;

  result.reducerType = pivot.reducers[0].resultType;

  const mapCol = r => {
    if (typeof r === 'string') {
      return {
        label: r,
        fn: i => _.get(i, r)
      }
    } else {
      return r;
    }
  }
  result.rowFields = pivot.rows.map(mapCol);
  result.colFields = pivot.columns.map(mapCol);
  if (pivot.filter) {
    result.filter = pivot.filter;
  }

  let fields = result.colFields.concat(result.rowFields);
  if (result.filter) fields = result.filter.concat(fields);

  let jsonData = _(items).groupBy(item => {
    const arr = [];
    for (const field of fields) {
      arr.push(field.fn(item));
    }
    return arr.join(',');
  }).mapValues(items => {
    const _result = result.reducers.reduce((obj, reducer) => {
      const initValue = _.cloneDeep(reducer.initValue ? eval(reducer.initValue) : 0);
      let reduceResult = _.reduce(items, reducer.fn, initValue);
      if (reducer.format) reduceResult = reducer.format(reduceResult)
      return _.assign(obj, {[reducer.label]: reduceResult});
    }, {});
    if (result.reducers.length === 1) return _result[result.reducers[0].label];
    return _result;
  }).thru(groups => {
    const res = {};
    for (const k of Object.keys(groups)) {
      if (result.reducerType === 'array' && groups[k].length === 0) continue;
      _.setWith(res, k.split(','), groups[k], Object);
    }
    return res;
  }).value();
  if (fields.length === 0) jsonData = jsonData[''];

  return jsonData;
}

/*const items = [
  {name: 'A1', price: 10, quantity: 1, tax: 7, group: 'G1', takeAway: true},
  {name: 'A2', price: 10, quantity: 1, tax: 19, group: 'G2', takeAway: true},
  {name: 'A3', price: 10, quantity: 1, tax: 7, group: 'G1', takeAway: true},
  {name: 'A4', price: 10, quantity: 1, tax: 7, group: 'G2', takeAway: true},
  {name: 'A5', price: 10, quantity: 1, tax: 7, group: 'G1'},
  {name: 'A6', price: 10, quantity: 1, tax: 19, group: 'G2'},
  {name: 'A7', price: 10, quantity: 1, tax: 19, group: 'G1'},
  {name: 'A8', price: 10, quantity: 1, tax: 19, group: 'G2'},
  {name: 'A9', price: 10, quantity: 1, tax: 7, group: 'G1'}
]

const pivot = {
  rows: [{label: 'tax', getter: i => i.tax}],
  columns: [{label: 'group', getter: i => i.group}],
  reducers: [{fn: (sum, i) => sum + i.quantity, name: 'quantity'}]
}
const result = renderPivotTable(pivot, items);*/

module.exports = {
  renderPivotTable
}
