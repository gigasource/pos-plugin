const fs = require('fs');
const EscPrinter = require('../print-utils/node-thermal-printer');
const _ = require('lodash')

module.exports = {
  async getGroupPrinterInfo(cms, device, type) {
    const {printerGeneralSetting} = await cms.getModel('PosSetting').findOne();
    const {useMultiPrinterForEntirePrinter, useMultiPrinterForInvoicePrinter, useMultiPrinterForKitchenPrinter} = printerGeneralSetting;

    let printMultiple = false

    if (type === 'kitchen') printMultiple = useMultiPrinterForKitchenPrinter
    if (type === 'entire') printMultiple = useMultiPrinterForEntirePrinter
    if (type === 'invoice') printMultiple = useMultiPrinterForInvoicePrinter

    const groupPrinters = printMultiple
        ? await cms.getModel('GroupPrinter').aggregate([
          {$unwind: {path: '$printers'}},
          {$match: {'printers.hardwares': device, type}}
        ])
        : await cms.getModel('GroupPrinter').aggregate([
          {$unwind: {path: '$printers'}},
          {$match: {type}}
        ])

    if (!groupPrinters) return null;

    return groupPrinters;
  },

  groupArticles(items) {
    let resultArr = [];
    items.forEach(product => {
      const existingItem = resultArr.find(r =>
          _.isEqual(_.omit(r, 'quantity'), _.omit(product, 'quantity'))
      );
      if (existingItem) {
        existingItem.quantity = existingItem.quantity + product.quantity
      } else {
        resultArr.push(_.cloneDeep(product));
      }
    })
    return resultArr
  },

  getEscPrinter(printerInfo) {
    return new EscPrinter(printerInfo)
  }
}
