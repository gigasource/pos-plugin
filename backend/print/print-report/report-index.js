const JsonFn = require("json-fn");

const _ = require('lodash');
const {getEscPrinter, getGroupPrinterInfo} = require('../print-utils/print-utils');
const fs = require('fs');
const path = require('path');
const PureImagePrinter = require('@gigasource/pureimage-printer-renderer');
const virtualPrinter = require('../print-utils/virtual-printer')
const dayjs = require('dayjs')

module.exports = async function (cms) {
  const {orm} = cms
  const Order = cms.getModel('Order')
  const EndOfDay = cms.getModel('EndOfDay');
  const Action = cms.getModel('Action')

  cms.on('run:endOfDay', async report => {
    await EndOfDay.create(_.omit(report, ['pending']));
    await Order.updateMany({
      date: {$gte: report.begin, $lte: report.end},
      status: 'paid',
      z: {$exists: false}
    }, {
      //todo: check if z is a number
      $set: {z: report.z}
    });
  })

  /**
   * Handle action for endOfDay
   * Action is acted iff this is master
   */
  orm.on('commit:handler:finish:Action', async function (action, commit) {
    if (!commit.tags.includes('endOfDay') || !orm.isMaster) return
    const {report} = action
    await cms.emit('run:endOfDay', report)
    await printHandler('ZReport', report)
  })

  orm.on('commit:handler:finish:Action', async function (action, commit) {
    if (!commit.tags.includes('printReport') || !orm.isMaster) return
    if (action.reportType === 'XReport') {
      const from = dayjs(action.data).startOf('day').toDate()
      const to = dayjs(action.data).add(1, 'day').toDate()
      action.data = {from, to}
    } else {
      action.data = JsonFn.clone(action.data)
    }

    await printHandler(action.reportType, action.data)
  })

  cms.socket.on('connect', (socket) => {
    //todo: create action on frontend
    socket.on('endOfDay', async function (report, cb) {
      //todo: emit/on pattern
      await Action.create({
        report
      }).commit('endOfDay')
      cb()
    })
    socket.on('printReport', async (reportType, data, cb) => {
      await Action.create({
        reportType,
        data
      }).commit('printReport')
      cb()
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
  const localeFilePath = `../../../i18n/${locale}.js`
  const isLocaleFileExist = fs.existsSync(path.resolve(__dirname, localeFilePath))
  if (isLocaleFileExist) {
    return require(localeFilePath)[locale]
  }
  return require(`../../../i18n/en.js`).en
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

  //todo: refactor : performance cost is too big
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
    const useVirtualPrinter = posSetting.generalSetting ? posSetting.generalSetting.useVirtualPrinter : null
    for (const printerInfo of printers) {
      if (useVirtualPrinter) {
        await cms.emit(virtualPrinter.cmsHookEvents.PRINT_VIRTUAL_REPORT, {report, printData, printerInfo, type})
      }

      const {escPOS} = printerInfo
      const escPrinter = await getEscPrinter(printerInfo);
      //todo: think some better concept
      if (escPOS && process.env.NODE_ENV !== 'test') {
        await report.printEscPos(escPrinter, printData, printerInfo.groupPrinter, 'escpos');
      } else {
        const pureImagePrinter = new PureImagePrinter(560, {
          printFunctions: global.printFunctions || {
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
