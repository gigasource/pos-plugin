const JsonFn = require("json-fn");

const _ = require('lodash');
const {getEscPrinter, getGroupPrinterInfo} = require('../print-utils/print-utils');
const fs = require('fs');
const path = require('path');
const PureImagePrinter = require('@gigasource/pureimage-printer-renderer');
const virtualPrinter = require('../print-utils/virtual-printer')

module.exports = async function (cms) {
  const Order = cms.getModel('Order')
  const EndOfDay = cms.getModel('EndOfDay');
  cms.on('bridge:inited', function () {
    cms.bridge.on('endOfDay', async function (report, cb) {
      report = JsonFn.clone(report)
      let vDateOrders = await Order.find({status: 'paid', vDate: dayjs(report.begin).startOf('day').toDate()})
      vDateOrders = JsonFn.clone(vDateOrders, true, true);

      const ordersToUpdate = vDateOrders.filter(order => report.begin <= order.date && order.date <= report.end).map(i => i._id)
      await cms.getModel('OrderCommit').addCommits([{
        type: 'order',
        action: 'update',
        where: JSON.stringify({ _id: { $in: ordersToUpdate } }),
        data: {
          allowMutateInactiveOrder: true
        },
        update: {
          method: 'updateMany',
          query: JSON.stringify({ $set: { z: report.z } })
        }
      }])

      await EndOfDay.create(report)
      await printHandler('ZReport', report)
      cb();
    });

    cms.bridge.on('printReport', async (reportType, data, cb) => {
      if (reportType === 'XReport') {
        const from = dayjs(data).startOf('day').toDate()
        const to = dayjs(data).add(1, 'day').toDate()
        data = { from, to }
      } else {
        data = JsonFn.clone(data)
      }

      await printHandler(reportType, data)
      cb()
    })
  })

  cms.socket.on('connect', (socket) => {
    socket.on('endOfDay', async function (report, cb) {
      cms.bridge.emitToMaster('endOfDay', report, () => {
        typeof cb === 'function' && cb();
      });
    })
    socket.on('printReport', (reportType, data, cb) => {
      cms.bridge.emitToMaster('printReport', reportType, data, () => {
        typeof cb === 'function' && cb()
      })
    })
  })
}

module.exports.printInvoiceHandler = printHandler

async function getLocale() {
  // store locale
  let locale = 'en'
  const posSettings = await cms.getModel('PosSetting').findOne()
  if (posSettings) {
    if (posSettings.onlineDevice.store && posSettings.onlineDevice.store.locale) locale = posSettings.onlineDevice.store.locale
  }
  const localeFilePath = `../../i18n/${locale}.js`
  const isLocaleFileExist = fs.existsSync(path.resolve(__dirname, localeFilePath))
  if (isLocaleFileExist) {
    return require(localeFilePath)[locale]
  }
  return require(`../../i18n/en.js`).en
}

async function printHandler(reportType, reportData, device, callback = () => null) {
  let report;
  let type

  switch (reportType) {
    case 'OrderReport':
      type = 'invoice'
      report = require('./order-report');
      break;
    case 'ZReport':
      type = 'invoice'
      report = require('./z-report');
      break;
    case 'MonthlyReport':
      type = 'invoice'
      report = require('./monthly-report');
      break;
    case 'StaffReport':
      type = 'invoice'
      report = require('./staff-report');
      break;
    case 'XReport':
      type = 'invoice'
      report = require('./x-report');
      break;
    case 'OnlineOrderReport':
      type = 'invoice'
      report = require('./online-order-report');
      break;
    case 'OnlineOrderKitchen':
      type = 'kitchen'
      report = require('./online-order-kitchen');
      break;
    default:
      return callbackWithError(callback, new Error(`Report type ${reportType} is not supported`));
  }

  try {
    const locale = await getLocale()
    const printData = await report.makePrintData(cms, reportData, locale);
    const groupPrinters = await getGroupPrinterInfo(cms, device, type);
    const printers = _.flatten(groupPrinters.map(group => ({
      ...group.printers,
      groupPrinter: group.name,
      groupPrinterId: group._id
    })));

    const posSetting = await cms.getModel('PosSetting').findOne({}, {generalSetting: 1})
    const {useVirtualPrinter} = posSetting.generalSetting

    for (const printerInfo of printers) {
      if (useVirtualPrinter) {
        await cms.execPostAsync(virtualPrinter.cmsHookEvents.PRINT_VIRTUAL_REPORT, null, [{report, printData, printerInfo, type}])
      }

      const {escPOS} = printerInfo
      const escPrinter = await getEscPrinter(printerInfo);
      if (escPOS) {
        await report.printEscPos(escPrinter, printData, printerInfo.groupPrinter, 'escpos');
      } else {
        const pureImagePrinter = new PureImagePrinter(560, {
          printFunctions: {
            printPng: escPrinter.printPng.bind(escPrinter),
            print: escPrinter.print.bind(escPrinter),
          }
        });
        await report.printCanvas(pureImagePrinter, printData, printerInfo.groupPrinter, 'canvas');
        pureImagePrinter.cleanup();
      }
    }
    const result = {success: true}
    callback(result);
    return result;
  } catch (e) {
    console.error(e);
    return callbackWithError(callback, e);
  }
}

function callbackWithError(callback, error) {
  const result = {
    success: false,
    message: error.toString()
  };
  callback(result)
  return result;
}
