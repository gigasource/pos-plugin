const _ = require('lodash');
const {getEscPrinter, getGroupPrinterInfo} = require('../print-utils/print-utils');

module.exports = async function (cms) {
  cms.socket.on('connect', socket => {
    socket.on('printReport', async (reportType, args, device, callback) => {
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
        const printData = await report.makePrintData(cms, args);
        const groupPrinters = await getGroupPrinterInfo(cms, device, type);
        const printers = _.flatten(groupPrinters.map(group => ({
          ...group.printers,
          groupPrinter: group.name
        })));

        for (const printerInfo of printers) {
          const escPrinter = await getEscPrinter(printerInfo);
          const {escPOS} = printerInfo

          if (escPOS) await report.printEscPos(escPrinter, printData, printerInfo.groupPrinter);
          else await report.printSsr(escPrinter, printData, printerInfo.groupPrinter);
        }

        callback({success: true});
      } catch (e) {
        console.error(e);
        callbackWithError(callback, e);
      }
    })
  });

  function callbackWithError(callback, error) {
    callback({
      success: false,
      message: error.toString()
    })
  }
}
