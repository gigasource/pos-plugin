const PureImagePrinter = require('@gigasource/pureimage-printer-renderer');
const {PNG} = require('pngjs')
const PRINT_VIRTUAL_REPORT = 'run:printVirtualReport'
const PRINT_VIRTUAL_KITCHEN = 'run:printVirtualKitchen'
const PRINT_VIRTUAL_ENTIRE_RECEIPT = 'run:printVirtualEntireReceipt'

function createPureImageVirtualPrinter(printerInfo, type) {
  return new PureImagePrinter(560, {
    printFunctions: {
      printPng: async (png) => {
        try {
          const bufferInBase64 = PNG.sync.write(png).toString('base64')
          await cms.getModel('VirtualReport').create({
            imageContent: bufferInBase64,
            created: dayjs(),
            type: type,
            printerId: printerInfo._id,
            printerGroupId: printerInfo.groupPrinterId
          })
        } catch (e) {
          console.log('canvasprinter: printPng exception', e)
        }
      },
      print: () => {
      },
    }
  });

}

module.exports = (cms) => {

  cms.post(PRINT_VIRTUAL_REPORT, async ({report, printData, printerInfo, type}) => {
    const canvasPrinter = createPureImageVirtualPrinter(printerInfo, type)
    await report.printCanvas(canvasPrinter, printData, printerInfo.groupPrinter, 'canvas');
    await canvasPrinter.cleanup();
  })

  cms.post(PRINT_VIRTUAL_KITCHEN, async ({printCanvas, printData, printerInfo}) => {
    if (typeof (printCanvas) !== "function") {
      console.log('printReport:VirtualPrinter:PRINT_VIRTUAL_KITCHEN:printCanvas is not a function')
      return;
    }
    if (!printData || !printerInfo) {
      console.log('printReport:VirtualPrinter:PRINT_VIRTUAL_KITCHEN:Missing required data')
      return;
    }

    const canvasPrinter = createPureImageVirtualPrinter(printerInfo, 'kitchen');
    await printCanvas(canvasPrinter, printData, printerInfo)
    await canvasPrinter.cleanup();
  })

  cms.post(PRINT_VIRTUAL_ENTIRE_RECEIPT, async ({printCanvas, props, printerInfo}) => {
    if (typeof (printCanvas) !== "function") {
      console.log('printReport:VirtualPrinter:PRINT_VIRTUAL_ENTIRE_RECEIPT:printCanvas is not a function')
      return;
    }
    if (!props || !printerInfo) {
      console.log('printReport:VirtualPrinter:PRINT_VIRTUAL_ENTIRE_RECEIPT:Missing required data')
      return;
    }

    const canvasPrinter = createPureImageVirtualPrinter(printerInfo, 'entireReceipt');
    printCanvas(canvasPrinter, props, printerInfo);
    await canvasPrinter.cleanup();
  })
}

module.exports.cmsHookEvents = {
  PRINT_VIRTUAL_REPORT,
  PRINT_VIRTUAL_KITCHEN,
  PRINT_VIRTUAL_ENTIRE_RECEIPT
}
