const _ = require('lodash')
const dayjs = require('dayjs')

const orderUtil = {
  calItemTotal(item) {
    return +(item.quantity * item.price);
  },
  calTax(price, tax) {
    return price * (1 - 1 / (1 + tax / 100))
  },
  calItemTax(item) {
    return +(orderUtil.calTax(item.price, item.tax || 0) * item.quantity).toFixed(2);
  },
  calOrderTax(items) {
    // vTax
    return _.sumBy(items, orderUtil.calItemTax);
  },
  calOrderTotal(items) {
    // total without modifiers
    return _.sumBy(items, orderUtil.calItemTotal);
  },
  calItemDiscount(item) {
    return item.vDiscount ? (item.vDiscount * item.quantity) : 0
  },
  calOrderDiscount(items) {
    // vDiscount
    return _.sumBy(items, orderUtil.calItemDiscount)
  },
  calItemModifier(item) {
    return item.modifiers ? _.sum(item.modifiers.map(i => i.price)) * item.quantity : 0
  },
  calOrderModifier(items) {
    return _.sumBy(items, orderUtil.calItemModifier)
  },
  calOrderReceive(payment) {
    // receive
    return _.sumBy(payment, i => +i.value)
  },
  calOrderVSum(order) {
    // vSum
    return orderUtil.calOrderTotal(order.items) + orderUtil.calOrderModifier(order.items)
  },
  getOrderTaxGroups(items) {
    // taxGroups
    return _.groupBy(items, 'tax')
  },
  getOrderVTaxGroups(taxGroups) {
    // vTaxGroups
    return _.map(taxGroups, (val, key) => ({
      taxType: key,
      tax: orderUtil.calOrderTax(val),
      sum: orderUtil.calOrderTotal(val)
    }))
  },
  applyDiscountForOrder(items, { difference, value }) {
    const totalWithoutDiscountResist = difference + value;
    const percent = difference / totalWithoutDiscountResist * 100;
    let sumDiscount = 0;
    const lastDiscountableItemIndex = _.findLastIndex(items, item => !item.discountResistance && item.originalPrice > 0);
    for (let i = 0; i < items.length; i++) {
      let item = items[i];
      if (!item.discountResistance) {
        if (i !== lastDiscountableItemIndex) {
          item.price = +(item.originalPrice * (100 - percent) / 100);
          item.discountUnit = 'percent';
          item.vDiscount = +(item.originalPrice - item.price);
          sumDiscount += this.calItemDiscount(item);
        } else {
          item.discountUnit = 'amount';
          item.vDiscount = +((difference - sumDiscount) / item.quantity);
          item.price = item.originalPrice - item.vDiscount;
        }
      }
    }
    return items;
  },
  async getLatestOrderId() {
    try {
      const orderWithHighestId = await cms.getModel('Order').findOne().sort('-id');
      return ((orderWithHighestId && orderWithHighestId.id) || 0) + 1
    } catch (e) {
      console.error(e)
    }
  },
  async getComputedOrderItems(orderItems, date) {
    const items = []
    const BSON = require('bson');
    const isValidObjectId = BSON.ObjectID.isValid;

    for (const item of orderItems) {
      if (item.groupPrinter && typeof item.groupPrinter === 'string' && isValidObjectId(item.groupPrinter)) {
        item.groupPrinter = await cms.getModel('GroupPrinter').findOne({ _id: item.groupPrinter })
      }

      if (item.groupPrinter2 && typeof item.groupPrinter2 === 'string' && isValidObjectId(item.groupPrinter2)) {
        item.groupPrinter2 = await cms.getModel('GroupPrinter').findOne({ _id: item.groupPrinter })
      }

      if (item.category ) {
        if (typeof item.category === 'string' && isValidObjectId(item.category)) {
          const category = await cms.getModel('Category').findById(item.category)
          if (category) item.category = category.name
        } else if (typeof item.category === 'object') {
          item.category = item.category.name
        }
      }

      items.push({
        ..._.omit(item, 'category'),
        category: item.category,
        date,
        ...item.groupPrinter && { groupPrinter: item.groupPrinter.name },
        ...item.groupPrinter2 && { groupPrinter2: item.groupPrinter2.name },
      });
    }

    return items
  },
  formatOrderItems(items) {
    return items.map(i => Object.assign({}, i, {
      price: i.price.toFixed(2),
      originalPrice: i.originalPrice.toFixed(2),
      ...i.vDiscount && { vDiscount: i.vDiscount.toFixed(2) },
      id: i.id || ''
    }))
  },
  getItemPrice(item) {
    let price = item.originalPrice || item.price
    if (item.modifiers && item.modifiers.length > 0) {
      price += _.sumBy(item.modifiers, m => m.price * m.quantity)
    }
    return price
  },
  getExtraInfo(item) {
    let extrasArr = []
    if (item.modifiers && item.modifiers.length) extrasArr.push(...item.modifiers.map(m => m.name))
    if (item.note) extrasArr.push(item.note)
    return extrasArr.length ? `(${extrasArr.join(', ')})` : ''
  },
  compactOrder(products) {
    let resultArr = [];
    products.forEach(product => {
      const existingProduct = resultArr.find(r =>
        _.isEqual(_.omit(r, 'quantity', '_id'), _.omit(product, 'quantity', '_id'))
      );
      if (existingProduct) {
        existingProduct.quantity = existingProduct.quantity + product.quantity
      } else {
        resultArr.push(_.cloneDeep(product));
      }
    })
    return resultArr
  },
  async getLatestDailyId() {
    try {
      const startDate = dayjs().startOf('day').toDate(), endDate = dayjs().endOf('day').toDate()
      const orderWithHighestId = await cms.getModel('Order').findOne({
        date: { $gte: startDate, $lte: endDate }
      }).sort('-dailyId');
      return ((orderWithHighestId && orderWithHighestId.dailyId) || 0) + 1
    } catch (e) {
      console.error(e)
    }
  },
  resetDiscount(items) {
    return items.map(item => ({
      ...item,
      price: item.originalPrice,
      discountUnit: '',
      vDiscount: 0
    }))
  }
}

module.exports = orderUtil
