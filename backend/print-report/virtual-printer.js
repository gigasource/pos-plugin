const PureImagePrinter = require('@gigasource/pureimage-printer-renderer');
const {PNG} = require('pngjs')

const PRINT_VIRTUAL_REPORT = 'run:printVirtualReport'

module.exports = (cms) => {
  cms.post(PRINT_VIRTUAL_REPORT, async ({ report, printData, printerInfo, type }) => {
    const canvasPrinter = new PureImagePrinter(560, {
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
        print: () => {},
      }
    });
    await report.printCanvas(canvasPrinter, printData, printerInfo.groupPrinter, 'canvas');
    canvasPrinter.cleanup();
  })
}

module.exports.cmsHookEvents = {
  PRINT_VIRTUAL_REPORT
}
