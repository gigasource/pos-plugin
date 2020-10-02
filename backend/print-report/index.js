const _ = require('lodash');
const { getEscPrinter, getGroupPrinterInfo } = require('../print-utils/print-utils');
const fs = require('fs');
const path = require('path');

module.exports = async function (cms) {
  cms.socket.on('connect', socket => {
    socket.on('printReport', printHandler)
  });
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
      groupPrinter: group.name
    })));

    for (const printerInfo of printers) {
      const escPrinter = await getEscPrinter(printerInfo);
      const { escPOS } = printerInfo

      if (escPOS) {
        await report.printEscPos(escPrinter, printData, printerInfo.groupPrinter);
      } else {
        await report.printSsr(escPrinter, printData, printerInfo.groupPrinter);
      }
    }

    const result = { success: true };
    callback(result);
    return result
  } catch (e) {
    console.error(e);
    return callbackWithError(callback, e)
  }
}

function callbackWithError(callback, error) {
  const result = {
    success: false,
    message: error.toString()
  };
  callback(result)
  return result
}
