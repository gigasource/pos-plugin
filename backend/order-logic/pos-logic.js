//<editor-fold desc="declare">
const {reactive, computed, watch, watchEffect, h, nextTick, ref} = require('vue');
const _ = require('lodash');

const calTax = function (gross, tax) {
  if (tax === 0) return 0;
  return gross * (1 - 1 / (1 + tax / 100));
}

function calNet(gross, tax) {
  if (tax === 0) return gross;
  return gross * (1 / (1 + tax / 100));
}

function calItemTax(item, price) {
  const unitGross = (price || item.price) + _.sumBy(item.modifiers, m => m.quantity * m.price);
  return +(calTax(unitGross * item.quantity, item.tax || 0)).toFixed(2);
}

function calItemNet(item, price) {
  const unitGross = (price || item.price) + _.sumBy(item.modifiers, m => m.quantity * m.price);
  return +(calNet(unitGross * item.quantity, item.tax || 0)).toFixed(2);
}

function calItemVSum(item, price) {
  const unitGross = (price || item.price) + _.sumBy(item.modifiers, m => m.quantity * m.price);
  return +(unitGross * item.quantity).toFixed(2);
}

const hooks = new (require('schemahandler/hooks/hooks'))();
const uuid = require('uuid/v1');

function mergeVTaxGroup(objValue, itemValue) {
  if (!objValue) return itemValue;
  if (!itemValue) return objValue;
  return {
    tax: objValue.tax + itemValue.tax,
    net: objValue.net + itemValue.net,
    gross: objValue.gross + itemValue.gross
  };
}

//</editor-fold>

const createOrder = function (_order) {
  const _uuid = uuid();
  let order = _.assign(_order, {items: [], cancellationItems: [], takeAway: false, status: 'inProgress'});
  order = reactive(order);

  watchEffect(() => {
    order.vSum = _.round(_.sumBy(order.items, 'vSum'), 2);
  })

  //item.vSum
  watchEffect(() => {
    for (const item of order.items) {
      item.vSum = calItemVSum(item);
    }
  })

  //item.takeAway
  watchEffect(() => {
    for (const item of order.items) {
      item.vTakeAway = !!(order.takeAway || item.takeAway);
    }
  })

  //item.taxes
  watchEffect(() => {
    for (const item of order.items) {
      if (item.taxes) {
        item.tax = item.vTakeAway ? item.taxes[1] : item.taxes[0];
      }
    }
  })

  function calPriceWDiscount(originalPrice, discount) {
    if (typeof discount === 'string' && discount.includes('%')) {
      const _discount = parseFloat(discount.replace('%', ''));
      return _.round(originalPrice * (100 - _discount) / 100, 2);
    } else if (typeof discount === 'string') {
      const _discount = parseFloat(discount);
      return _.round(originalPrice - _discount, 2);
    } else if (typeof discount === 'number') {
      return _.round(originalPrice - discount, 2);
    }
    return originalPrice;
  }

//item.discount -> orginal price
  watchEffect(function () {
    for (const item of order.items) {
      if (item.discount) {
        if (!item.originalPrice) {
          item.originalPrice = item.price;
          if (item.modifiers) {
            for (const modifier of item.modifiers) {
              modifier.originalPrice = modifier.price;
              modifier.price = calPriceWDiscount(modifier.originalPrice, item.discount)
            }
          }
          hooks.emit('item.discount', item);
        }

        item.price = calPriceWDiscount(item.originalPrice, item.discount);
      }
    }
  })

  //order.discount -> item.discount
  watchEffect(() => {
    let discount = order.discount;

    if (!discount) return;

    function processPercentCase(discount) {
      for (const item of order.items) {
        if (_.endsWith(discount, '%')) {
          item.discount = discount;
        }
      }
    }

    if (typeof discount === 'string' && discount.includes('%')) {
      processPercentCase(discount);
    } else {
      if (typeof discount === 'string') discount = parseFloat(discount);
      const vSumOriginal = _.sumBy(order.items, item => (item.originalPrice || item.price) * item.quantity + _.sumBy(item.modifiers, m => m.price * m.quantity));
      // calculate percent
      let _discount = _.round((discount / vSumOriginal) * 100, 0) + '%';
      for (const item of order.items) {
        item.discount = _discount;
      }
      hooks.once(`${_uuid}:discountNumber:post`, function () {
        const _item = _.find(order.items, i => i.quantity === 1);
        if (order.vDiscount !== discount && _item) {
          const items = [...order.items];
          items.splice(items.indexOf(_item), 1);
          const __discount = discount - _.sumBy(items, 'vDiscount');
          _item.discount = _.round(__discount / _item.quantity, 2);
        }
      })
    }
  })

  //order.vDiscount
  watchEffect(() => {
    let vDiscount = _.sumBy(order.items, 'vDiscount');
    vDiscount = vDiscount ? _.round(vDiscount, 2) : vDiscount;
    if (vDiscount > 0) {
      order.vDiscount = vDiscount;
      hooks.emit(`${_uuid}:discountNumber:post`);
    }
  })

  //item.vDiscount
  watchEffect(() => {
    for (const item of order.items) {
      if (item.discount) {
        const vSumOriginal = item.originalPrice * item.quantity + _.sumBy(item.modifiers, m => m.originalPrice * m.quantity);
        item.vDiscount = _.round(vSumOriginal - item.vSum, 2);
      }
    }
  })

  //item.vTaxSum
  watchEffect(() => {
    for (const item of order.items) {
      let vTaxSum = {
        [item.tax]: {
          tax: calItemTax(item),
          net: calItemNet(item),
          gross: calItemVSum(item),
        }
      }

      hooks.emit('item.vTaxSum', item, e => eval(e));

      item.vTaxSum = vTaxSum;
    }
  })

  //order.vTaxSum
  watchEffect(() => {
    const vTaxSum = {}
    for (const item of order.items) {
      _.mergeWith(vTaxSum, item.vTaxSum, mergeVTaxGroup);
    }
    order.vTaxSum = vTaxSum;
  })

  //partTax.tax
  watchEffect(() => {
    for (const item of order.items) {
      if (item.partTax) {
        item.partTax.tax = !item.vTakeAway ? item.partTax.taxes[0] : item.partTax.taxes[1];
      }
    }
  })

  //partTax vTaxSum
  hooks.on('item.vTaxSum', function (item) {
    if (item.partTax && item.partTax.tax) {
      let vTaxSum = {
        [item.partTax.tax]: {
          tax: calItemTax(item, item.partTax.pricePart),
          net: calItemNet(item, item.partTax.pricePart),
          gross: calItemVSum(item, item.partTax.pricePart),
        },
        [item.tax]: {
          tax: calItemTax(item, item.price - item.partTax.pricePart),
          net: calItemNet(item, item.price - item.partTax.pricePart),
          gross: calItemVSum(item, item.price - item.partTax.pricePart)
        }
      }
      this.update('vTaxSum', vTaxSum);
    }
  })

  //partTax discount
  hooks.on('item.discount', function (item) {
    if (item.partTax) {
      item.partTax.originalPricePart = item.partTax.pricePart;
      item.partTax.pricePart = calPriceWDiscount(item.partTax.originalPricePart, item.discount)
    }
  });

  //todo: cancellationItems
  return order;
}

//<editor-fold desc="functions">
function addItem(order, item, quantity) {
  const _item = _.cloneDeep(item);
  if (quantity !== undefined) {
    _item.quantity = quantity;
  }

  order.items.push(_item);
}

function makeTakeaway(order, takeAway = true) {
  order.takeAway = takeAway;
}

function addModifier(order, modifier) {
  const last = _.last(order.items);
  if (last) {
    last.modifiers = last.modifiers || [];
    last.modifiers.push(modifier);
  }
}

function makeDiscount(order, discount) {
  order.discount = discount;
}

function makeLastItemDiscount(order, discount) {
  const last = _.last(order.items);
  if (last) {
    last.discount = discount;
  }
}

function makePaid(order) {
  order.status = 'paid';
}

//</editor-fold>

module.exports = {
  createOrder,
  addItem,
  addModifier,
  makeTakeaway,
  makeDiscount,
  makeLastItemDiscount,
  makePaid,
  mergeVTaxGroup
}
